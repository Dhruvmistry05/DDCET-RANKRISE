const { Pool } = require('pg');

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

const buildWhere = (criteria) => {
  const keys = Object.keys(criteria);
  if (keys.length === 0) return { clause: '', values: [] };
  const clause = 'WHERE ' + keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
  const values = keys.map(k => criteria[k]);
  return { clause, values };
};

const getAll = async (table) => {
  const res = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
  return res.rows;
};

const find = async (table, criteria) => {
  const { clause, values } = buildWhere(criteria);
  const res = await pool.query(`SELECT * FROM ${table} ${clause} ORDER BY id ASC`, values);
  return res.rows;
};

const findOne = async (table, criteria) => {
  const { clause, values } = buildWhere(criteria);
  const res = await pool.query(`SELECT * FROM ${table} ${clause} LIMIT 1`, values);
  return res.rows[0] || null;
};

const insert = async (table, data) => {
  const keys = Object.keys(data);
  const values = keys.map(k => data[k]);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  const res = await pool.query(query, values);
  return res.rows[0];
};

const update = async (table, id, data) => {
  const keys = Object.keys(data);
  if (keys.length === 0) return await findOne(table, { id });
  
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...keys.map(k => data[k])];
  
  const query = `
    UPDATE ${table}
    SET ${sets}
    WHERE id = $1
    RETURNING *
  `;
  const res = await pool.query(query, values);
  return res.rows[0] || null;
};

const remove = async (table, id) => {
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
};

// Specialized complex queries
const getStudentSyllabus = async () => {
  // We can just rely on the unified interface for now and reconstruct in JS, 
  // or write a complex JOIN. To match JSON behavior exactly, fetching all and filtering in JS works perfectly for smaller datasets.
  const subjects = await find('subjects', { published: true });
  const chapters = await find('chapters', { published: true });
  const topics = await find('topics', { published: true });
  const materials = await find('materials', { published: true });
  const questions = await find('questions', { published: true });
  return { subjects, chapters, topics, materials, questions };
};

const getAdminStats = async () => {
  const students = (await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`)).rows[0].count;
  const subjects = (await pool.query(`SELECT COUNT(*) FROM subjects`)).rows[0].count;
  const chapters = (await pool.query(`SELECT COUNT(*) FROM chapters`)).rows[0].count;
  const topics = (await pool.query(`SELECT COUNT(*) FROM topics`)).rows[0].count;
  const materials = (await pool.query(`SELECT COUNT(*) FROM materials`)).rows[0].count;
  const questions = (await pool.query(`SELECT COUNT(*) FROM questions`)).rows[0].count;
  const tests = (await pool.query(`SELECT COUNT(*) FROM tests`)).rows[0].count;
  return { students: parseInt(students), subjects: parseInt(subjects), chapters: parseInt(chapters), topics: parseInt(topics), materials: parseInt(materials), questions: parseInt(questions), tests: parseInt(tests) };
};

const initSchema = async () => {
  const fs = require('fs');
  const path = require('path');
  const sql = fs.readFileSync(path.join(__dirname, 'pg-schema.sql'), 'utf8');
  await pool.query(sql);
};

const testConnection = async () => {
  const client = await pool.connect();
  client.release();
  return true;
};

const close = async () => {
  await pool.end();
};

module.exports = {
  pool,
  getAll,
  find,
  findOne,
  insert,
  update,
  remove,
  getStudentSyllabus,
  getAdminStats,
  initSchema,
  testConnection,
  close
};
