const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.json');

// Initial schema
const defaultDb = {
  users: [],
  subjects: [],
  chapters: [],
  topics: [],
  materials: [],
  questions: [],
  tests: [],
  test_questions: [],
  student_attempts: [],
  resources: [],
  student_topic_progress: [],
  student_activity: []
};

let db = { ...defaultDb };

const save = () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

const load = () => {
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = { ...defaultDb, ...JSON.parse(data) };
    } catch (e) {
      console.error("Error reading db.json", e);
    }
  } else {
    save();
  }
};

load();

module.exports = {
  get: (table) => db[table] || [],
  insert: (table, record) => {
    if (!db[table]) db[table] = [];
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const newRecord = { id, ...record };
    db[table].push(newRecord);
    save();
    return newRecord;
  },
  update: (table, id, updates) => {
    const index = db[table].findIndex(r => r.id === id);
    if (index !== -1) {
      db[table][index] = { ...db[table][index], ...updates };
      save();
      return db[table][index];
    }
    return null;
  },
  remove: (table, id) => {
    db[table] = db[table].filter(r => r.id !== id);
    save();
  }
};
