const jsonDb = require('./db');
const pgDb = require('./db-pg');

const USE_PG = !!process.env.DATABASE_URL;

const adapter = USE_PG ? pgDb : {
  getAll: async (table) => {
    return jsonDb.get(table);
  },
  find: async (table, criteria) => {
    const records = jsonDb.get(table);
    return records.filter(r => {
      for (const key in criteria) {
        if (r[key] != criteria[key]) return false; // weak equality to match pg string vs int logic sometimes
      }
      return true;
    });
  },
  findOne: async (table, criteria) => {
    const records = jsonDb.get(table);
    return records.find(r => {
      for (const key in criteria) {
        if (r[key] != criteria[key]) return false;
      }
      return true;
    }) || null;
  },
  findUserByEmail: async (email) => {
    if (!email) return null;
    const records = jsonDb.get('users');
    const clean = email.trim().toLowerCase();
    return records.find(r => r.email && r.email.toLowerCase() === clean) || null;
  },
  insert: async (table, data) => {
    return jsonDb.insert(table, data);
  },
  update: async (table, id, data) => {
    return jsonDb.update(table, parseInt(id), data);
  },
  remove: async (table, id) => {
    jsonDb.remove(table, parseInt(id));
  },
  getStudentSyllabus: async () => {
    const subjects = jsonDb.get('subjects').filter(s => s.published);
    const chapters = jsonDb.get('chapters').filter(c => c.published);
    const topics = jsonDb.get('topics').filter(t => t.published);
    const materials = jsonDb.get('materials').filter(m => m.published);
    const questions = jsonDb.get('questions').filter(q => q.published);
    return { subjects, chapters, topics, materials, questions };
  },
  getAdminStats: async () => {
    const users = jsonDb.get('users');
    return {
      students: users.filter(u => u.role === 'student').length,
      subjects: jsonDb.get('subjects').length,
      chapters: jsonDb.get('chapters').length,
      topics: jsonDb.get('topics').length,
      materials: jsonDb.get('materials').length,
      questions: jsonDb.get('questions').length,
      tests: jsonDb.get('tests').length
    };
  },
  testConnection: async () => true,
  close: async () => {}
};

module.exports = adapter;
