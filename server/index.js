const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db-adapter'); // CHANGED to adapter

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  }
});

app.use('/uploads', express.static(uploadsDir));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

// --- Auth Middleware ---
const requireUser = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    req.user = decoded;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
};

app.use((req, res, next) => {
  const isAuthRoute = req.path.startsWith('/api/auth');
  const isUserRoute = req.path.startsWith('/api/user');
  
  if (req.method !== 'GET' && !req.path.startsWith('/uploads') && !isAuthRoute && !isUserRoute) {
    return requireUser(req, res, () => requireAdmin(req, res, next));
  }
  next();
});

// --- AUTHENTICATION API ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  
  const existingUser = await db.findOne('users', { email });
  if (existingUser) return res.status(400).json({ error: 'Email is already registered' });
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = await db.insert('users', {
    email,
    password: hashedPassword,
    role: 'student', // FORCE STUDENT
    profile_completed: false,
    first_login_at: null,
    last_login_at: null
  });
  
  res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  
  const user = await db.findOne('users', { email });
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });
  
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });
  
  const now = new Date().toISOString();
  const updates = { last_login_at: now };
  if (!user.first_login_at) updates.first_login_at = now;
  
  const updatedUser = await db.update('users', user.id, updates);
  
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      profile_completed: updatedUser.profile_completed,
      first_login_at: updatedUser.first_login_at,
      last_login_at: updatedUser.last_login_at,
      name: updatedUser.name
    }
  });
});

// --- USER PROFILE API ---
app.get('/api/user/profile', requireUser, async (req, res) => {
  const user = await db.findOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const { password, ...profile } = user;
  res.json(profile);
});

app.put('/api/user/profile', requireUser, async (req, res) => {
  const user = await db.findOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const { name, mobile, dob, branch, gender, college, semester } = req.body;
  
  if (!name || !mobile || !dob || !branch) {
    return res.status(400).json({ error: 'Name, Mobile, DOB, and Branch are required' });
  }
  
  const updatedUser = await db.update('users', user.id, {
    name, mobile, dob, branch, gender, college, semester,
    profile_completed: true
  });
  
  const { password, ...profile } = updatedUser;
  res.json(profile);
});

app.get('/api/subjects', async (req, res) => {
  const { publishedOnly } = req.query;
  let subjects = publishedOnly === 'true' ? await db.find('subjects', { published: true }) : await db.getAll('subjects');
  subjects.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  res.json(subjects);
});

// --- ADMIN API ---
app.get('/api/admin/stats', requireUser, requireAdmin, async (req, res) => {
  const stats = await db.getAdminStats();
  res.json(stats);
});

app.post('/api/subjects', async (req, res) => {
  const { name, display_order, published } = req.body;
  const newSubject = await db.insert('subjects', { name, display_order: display_order || 0, published: published ? true : false });
  res.json(newSubject);
});

app.delete('/api/subjects/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const chapters = await db.find('chapters', { subject_id: id });
  if (chapters.length > 0) return res.status(400).json({ error: "Cannot delete subject: it has dependent chapters." });
  await db.remove('subjects', id);
  res.json({ success: true });
});

// Chapters
app.get('/api/chapters', async (req, res) => {
  const { subject_id, publishedOnly } = req.query;
  const criteria = {};
  if (subject_id) criteria.subject_id = subject_id;
  if (publishedOnly === 'true') criteria.published = true;
  
  let chapters = await db.find('chapters', criteria);
  chapters.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  res.json(chapters);
});

app.post('/api/chapters', async (req, res) => {
  const { subject_id, name, description, display_order, published } = req.body;
  const newChapter = await db.insert('chapters', { subject_id: parseInt(subject_id), name, description, display_order: display_order || 0, published: published ? true : false });
  res.json(newChapter);
});

app.delete('/api/chapters/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const topics = await db.find('topics', { chapter_id: id });
  if (topics.length > 0) return res.status(400).json({ error: "Cannot delete chapter: it has dependent topics." });
  await db.remove('chapters', id);
  res.json({ success: true });
});

// Topics
app.get('/api/topics', async (req, res) => {
  const { chapter_id, publishedOnly } = req.query;
  const criteria = {};
  if (chapter_id) criteria.chapter_id = chapter_id;
  if (publishedOnly === 'true') criteria.published = true;
  
  let topics = await db.find('topics', criteria);
  topics.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  res.json(topics);
});

app.post('/api/topics', async (req, res) => {
  const { chapter_id, name, display_order, published } = req.body;
  const newTopic = await db.insert('topics', { chapter_id: parseInt(chapter_id), name, display_order: display_order || 0, published: published ? true : false });
  res.json(newTopic);
});

app.delete('/api/topics/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const materials = await db.find('materials', { topic_id: id });
  const questions = await db.find('questions', { topic_id: id });
  if (materials.length > 0 || questions.length > 0) return res.status(400).json({ error: "Cannot delete topic: it has linked materials or questions." });
  await db.remove('topics', id);
  res.json({ success: true });
});

// --- MATERIALS API ---
app.post('/api/materials', upload.single('file'), async (req, res) => {
  const { title, type, description, reference_url, subject_id, chapter_id, topic_id, published } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;
  const newMaterial = await db.insert('materials', {
    title, type, description, file_path, reference_url,
    subject_id: subject_id ? parseInt(subject_id) : null,
    chapter_id: chapter_id ? parseInt(chapter_id) : null,
    topic_id: topic_id ? parseInt(topic_id) : null,
    published: published === 'true' || published === true ? true : false
  });
  res.json(newMaterial);
});

app.get('/api/materials', async (req, res) => {
  const { subject_id, chapter_id, topic_id, publishedOnly } = req.query;
  const criteria = {};
  if (subject_id) criteria.subject_id = subject_id;
  if (chapter_id) criteria.chapter_id = chapter_id;
  if (topic_id) criteria.topic_id = topic_id;
  if (publishedOnly === 'true') criteria.published = true;
  
  let materials = await db.find('materials', criteria);
  res.json(materials);
});

app.delete('/api/materials/:id', async (req, res) => {
  await db.remove('materials', parseInt(req.params.id));
  res.json({ success: true });
});

// --- RESOURCES API ---
app.get('/api/resources', async (req, res) => {
  const { type, publishedOnly } = req.query;
  const criteria = {};
  if (type) criteria.type = type;
  if (publishedOnly === 'true') criteria.published = true;
  
  let resources = await db.find('resources', criteria);
  resources.sort((a, b) => (b.exam_year || 0) - (a.exam_year || 0));
  res.json(resources);
});

app.post('/api/resources', upload.single('file'), async (req, res) => {
  const { title, description, type, exam_year, paper_id, published } = req.body;
  if (!req.file) return res.status(400).json({ error: 'PDF file is required' });
  
  const file_path = `/uploads/${req.file.filename}`;
  const newResource = await db.insert('resources', {
    title, 
    description, 
    type, 
    exam_year: exam_year ? parseInt(exam_year) : null,
    paper_id: paper_id ? parseInt(paper_id) : null,
    file_path,
    published: published === 'true' || published === true ? true : false
  });
  res.json(newResource);
});

app.delete('/api/resources/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const keys = await db.find('resources', { type: 'answer_key', paper_id: id });
  if (keys.length > 0) return res.status(400).json({ error: "Cannot delete this paper because answer keys are linked to it." });
  
  await db.remove('resources', id);
  res.json({ success: true });
});

// --- QUESTIONS API ---
app.get('/api/questions', async (req, res) => {
  res.json(await db.getAll('questions'));
});

app.post('/api/questions', async (req, res) => {
  const { text, options, answer_index, explanation, marks, negative_marks, subject_id, chapter_id, topic_id, published } = req.body;
  
  const USE_PG = !!process.env.DATABASE_URL;
  const optionsData = USE_PG ? JSON.stringify(options) : options;

  const newQ = await db.insert('questions', {
    text, options: optionsData, answer_index, explanation,
    marks: marks || 1.0,
    negative_marks: negative_marks || 0.0,
    subject_id: subject_id ? parseInt(subject_id) : null,
    chapter_id: chapter_id ? parseInt(chapter_id) : null,
    topic_id: topic_id ? parseInt(topic_id) : null,
    published: published !== false ? true : false
  });
  res.json(newQ);
});

app.delete('/api/questions/:id', async (req, res) => {
  await db.remove('questions', parseInt(req.params.id));
  res.json({ success: true });
});

// --- TESTS API ---
app.get('/api/tests', async (req, res) => {
  const tests = await db.getAll('tests');
  res.json(tests);
});

app.post('/api/tests', async (req, res) => {
  const { title, type, subject_id, chapter_id, duration_minutes, scheduled_start_time, scheduled_end_time, status, question_ids } = req.body;
  
  const newTest = await db.insert('tests', {
    title, type, 
    subject_id: subject_id ? parseInt(subject_id) : null,
    chapter_id: chapter_id ? parseInt(chapter_id) : null,
    duration_minutes: parseInt(duration_minutes) || 60,
    scheduled_start_time,
    scheduled_end_time,
    status: status || 'draft'
  });

  if (Array.isArray(question_ids)) {
    for (const qid of question_ids) {
      await db.insert('test_questions', { test_id: newTest.id, question_id: parseInt(qid) });
    }
  }
  
  res.json(newTest);
});

app.put('/api/tests/:id/publish', async (req, res) => {
  const id = parseInt(req.params.id);
  const test = await db.update('tests', id, { status: 'published' });
  if (test) res.json(test);
  else res.status(404).json({ error: 'Test not found' });
});

app.delete('/api/tests/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await db.remove('tests', id);
  // Remove associated test questions
  const tq = await db.find('test_questions', { test_id: id });
  for (const link of tq) {
    await db.remove('test_questions', link.id);
  }
  res.json({ success: true });
});

// Full DDCET syllabus endpoint for student view
app.get('/api/student/syllabus', async (req, res) => {
  const { subjects, chapters, topics, materials, questions } = await db.getStudentSyllabus();
  
  subjects.sort((a,b)=>a.display_order - b.display_order);
  chapters.sort((a,b)=>a.display_order - b.display_order);
  topics.sort((a,b)=>a.display_order - b.display_order);
  
  const tree = subjects.map(s => {
    const sChapters = chapters.filter(c => c.subject_id === s.id).map(c => {
      const cTopics = topics.filter(t => t.chapter_id === c.id).map(t => {
        return { ...t, materials: materials.filter(m => m.topic_id === t.id) };
      });
      const cMaterials = materials.filter(m => m.chapter_id === c.id);
      const cQuestions = questions.filter(q => q.chapter_id === c.id);
      return { ...c, topics: cTopics, materials: cMaterials, question_count: cQuestions.length };
    });
    const sMaterials = materials.filter(m => m.subject_id === s.id && !m.chapter_id && !m.topic_id);
    return { ...s, chapters: sChapters, materials: sMaterials };
  });
  
  res.json(tree);
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  // Do not expose stack trace or SQL details to client
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

const USE_PG = !!process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production' && !USE_PG) {
  console.error('FATAL ERROR: DATABASE_URL is required in production.');
  process.exit(1);
}

const startServer = async () => {
  try {
    await db.testConnection();
  } catch (err) {
    console.error('FATAL ERROR: Database connection failed.', err.message);
    process.exit(1);
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT} [DB: ${USE_PG ? 'PostgreSQL' : 'JSON'}]`);
  });
};

startServer();
