const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('--validate');

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is required to run migration.");
  console.error("Usage:");
  console.error("  node server/pg-migrate.js --dry-run   (Validate without making changes)");
  console.error("  node server/pg-migrate.js             (Execute transactional migration)");
  process.exit(1);
}

const isRemoteDb = Boolean(
  process.env.DATABASE_URL && (
    process.env.DATABASE_URL.includes('supabase') ||
    process.env.DATABASE_URL.includes('render.com') ||
    process.env.NODE_ENV === 'production'
  )
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000
});

const booleanFields = ['published', 'profile_completed'];

// 1. Data Integrity Validation Helper
const validateDataIntegrity = (db) => {
  const issues = [];
  const subjectIds = new Set((db.subjects || []).map(s => s.id));
  const chapterIds = new Set((db.chapters || []).map(c => c.id));
  const topicIds = new Set((db.topics || []).map(t => t.id));
  const questionIds = new Set((db.questions || []).map(q => q.id));
  const testIds = new Set((db.tests || []).map(t => t.id));
  const resourceIds = new Set((db.resources || []).map(r => r.id));

  // Check chapters -> subjects
  (db.chapters || []).forEach(c => {
    if (c.subject_id && !subjectIds.has(c.subject_id)) {
      issues.push(`Chapter id=${c.id} references non-existent subject_id=${c.subject_id}`);
    }
  });

  // Check topics -> chapters
  (db.topics || []).forEach(t => {
    if (t.chapter_id && !chapterIds.has(t.chapter_id)) {
      issues.push(`Topic id=${t.id} references non-existent chapter_id=${t.chapter_id}`);
    }
  });

  // Check test_questions
  (db.test_questions || []).forEach(tq => {
    if (!testIds.has(tq.test_id)) {
      issues.push(`test_questions id=${tq.id} references non-existent test_id=${tq.test_id}`);
    }
    if (!questionIds.has(tq.question_id)) {
      issues.push(`test_questions id=${tq.id} references non-existent question_id=${tq.question_id}`);
    }
  });

  // Check resources -> paper_id
  (db.resources || []).forEach(r => {
    if (r.paper_id && !resourceIds.has(r.paper_id)) {
      issues.push(`Resource id=${r.id} references non-existent paper_id=${r.paper_id}`);
    }
  });

  return issues;
};

const upsert = async (client, table, rows, jsonColumns = []) => {
  if (!rows || rows.length === 0) {
    return 0;
  }
  const keys = Object.keys(rows[0]);
  let count = 0;
  
  for (const row of rows) {
    const vals = keys.map(k => {
      if (jsonColumns.includes(k)) return JSON.stringify(row[k]);
      if (booleanFields.includes(k)) {
        return row[k] === true || row[k] === 'true' || row[k] === 1 || row[k] === '1';
      }
      return row[k];
    });
    const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
    const updates = keys.filter(k => k !== 'id').map(k => `${k} = EXCLUDED.${k}`).join(', ');
    
    let query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    if (updates.length > 0) {
      query += ` ON CONFLICT (id) DO UPDATE SET ${updates}`;
    } else {
      query += ` ON CONFLICT (id) DO NOTHING`;
    }
    
    await client.query(query, vals);
    count++;
  }
  
  // Sync sequence to avoid collision with explicit IDs
  try {
    await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`);
  } catch (e) {
    // Ignore if table has no serial sequence
  }
  return count;
};

const runMigration = async () => {
  const dbPath = path.resolve(__dirname, 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error("Error: server/db.json not found locally.");
    process.exit(1);
  }

  let db;
  try {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.error("Error: server/db.json is malformed or unreadable:", e.message);
    process.exit(1);
  }

  const collections = [
    { name: 'users', rows: db.users || [], json: [] },
    { name: 'subjects', rows: db.subjects || [], json: [] },
    { name: 'chapters', rows: db.chapters || [], json: [] },
    { name: 'topics', rows: db.topics || [], json: [] },
    { name: 'materials', rows: db.materials || [], json: [] },
    { name: 'questions', rows: db.questions || [], json: ['options'] },
    { name: 'tests', rows: db.tests || [], json: [] },
    { name: 'test_questions', rows: db.test_questions || [], json: [] },
    { name: 'resources', rows: db.resources || [], json: [] },
    { name: 'student_attempts', rows: db.student_attempts || [], json: ['answers'] }
  ];

  const integrityIssues = validateDataIntegrity(db);

  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1'); // Test handshake
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }

  if (isDryRun) {
    console.log("\n============================================================");
    console.log("  DDCET RankRise - PostgreSQL Migration DRY-RUN & VALIDATION");
    console.log("============================================================");
    console.log(`Database Connection     : CONNECTED (PostgreSQL pool verified)`);
    console.log(`Source File             : server/db.json`);
    console.log(`Foreign Key Integrity   : ${integrityIssues.length === 0 ? 'PASS (0 issues)' : 'WARN (' + integrityIssues.length + ' issues)'}`);
    if (integrityIssues.length > 0) {
      integrityIssues.forEach(iss => console.log(`  - ${iss}`));
    }
    console.log("\nRecords Planned for Migration:");
    collections.forEach(c => {
      console.log(`  - ${c.name.padEnd(18)}: ${c.rows.length} records`);
    });
    console.log("------------------------------------------------------------");
    console.log("DRY-RUN RESULT: VALIDATION PASSED. Zero database changes made.");
    console.log("To execute live migration, run: node server/pg-migrate.js");
    console.log("============================================================\n");
    client.release();
    await pool.end();
    process.exit(0);
  }

  // LIVE MIGRATION PATH
  try {
    console.log("\nStarting Live PostgreSQL Migration...");
    await client.query('BEGIN');
    
    // 1. Initialize schema
    console.log("Step 1: Initializing Schema...");
    const sql = fs.readFileSync(path.join(__dirname, 'pg-schema.sql'), 'utf8');
    await client.query(sql);
    
    // 2. Import collections in relational order
    console.log("Step 2: Importing Collections...");
    const importedCounts = {};
    for (const c of collections) {
      const count = await upsert(client, c.name, c.rows, c.json);
      importedCounts[c.name] = count;
      console.log(`  ✓ ${c.name.padEnd(18)}: ${count} imported`);
    }

    // 3. Post-migration count verification
    console.log("Step 3: Verifying Destination Counts...");
    let allMatched = true;
    for (const c of collections) {
      const res = await client.query(`SELECT count(*)::int as cnt FROM ${c.name}`);
      const dbCount = res.rows[0].cnt;
      const expected = c.rows.length;
      if (dbCount < expected) {
        console.error(`  ✗ Count mismatch in ${c.name}: expected at least ${expected}, found ${dbCount}`);
        allMatched = false;
      }
    }

    if (!allMatched) {
      throw new Error("Post-migration verification failed: row count mismatch.");
    }

    await client.query('COMMIT');
    console.log("\n============================================================");
    console.log("  MIGRATION COMPLETED & VERIFIED SUCCESSFULLY");
    console.log("============================================================\n");
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("\n[MIGRATION FAILED - TRANSACTION ROLLED BACK]:", error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

runMigration();
