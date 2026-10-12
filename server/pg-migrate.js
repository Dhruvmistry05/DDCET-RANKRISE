const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is required to run migration.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const booleanFields = ['published', 'profile_completed'];

const upsert = async (client, table, rows, jsonColumns = []) => {
  if (!rows || rows.length === 0) {
    console.log(`Skipping ${table}: 0 records.`);
    return;
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
  
  // Sync sequence
  try {
    await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`);
  } catch (e) {
    // Ignore sequence sync errors if table doesn't have an identity column setup exactly this way
  }
  console.log(`Migrated ${count} records into ${table}.`);
};

const runMigration = async () => {
  const client = await pool.connect();
  try {
    console.log("Starting PostgreSQL Migration...");
    await client.query('BEGIN');
    
    // 1. Init schema
    console.log("Initializing Schema...");
    const sql = fs.readFileSync(path.join(__dirname, 'pg-schema.sql'), 'utf8');
    await client.query(sql);
    
    // 2. Read DB
    const dbPath = path.resolve(__dirname, 'db.json');
    if (!fs.existsSync(dbPath)) {
      throw new Error("db.json not found locally.");
    }
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    // 3. Migrate tables in relational order
    await upsert(client, 'users', db.users || []);
    await upsert(client, 'subjects', db.subjects || []);
    await upsert(client, 'chapters', db.chapters || []);
    await upsert(client, 'topics', db.topics || []);
    await upsert(client, 'materials', db.materials || []);
    
    // questions have options (jsonb)
    await upsert(client, 'questions', db.questions || [], ['options']);
    
    await upsert(client, 'tests', db.tests || []);
    await upsert(client, 'test_questions', db.test_questions || []);
    
    // resources has exam_year and paper_id which could be null, handled seamlessly by pg
    await upsert(client, 'resources', db.resources || []);
    
    await upsert(client, 'student_attempts', db.student_attempts || [], ['answers']);
    
    await client.query('COMMIT');
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration();
