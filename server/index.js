const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db-adapter'); // CHANGED to adapter

const app = express();

const getAllowedOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://ddcet-rankrise-frontend.onrender.com'
  ];
  const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return [...defaults, ...envOrigins];
};

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const origins = getAllowedOrigins();
    const cleanOrigin = origin.replace(/\/$/, '');
    
    const isAllowed = 
      origins.includes(cleanOrigin) ||
      origins.includes('*') ||
      (cleanOrigin.startsWith('https://') && cleanOrigin.includes('onrender.com'));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin "${origin}" is not in allowed origins list.`);
      callback(new Error(`Not allowed by CORS: Origin "${origin}" is not in allowed origins list.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

const storageService = require('./storage');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory storage so file buffer is available for magic-byte verification and cloud upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: Only PDF documents (.pdf) are allowed.'));
    }
  }
});

app.use('/uploads', express.static(uploadsDir));

// Serve bundled static resources from public/resources if present
const publicResourcesDir = path.join(__dirname, '..', 'public', 'resources');
if (fs.existsSync(publicResourcesDir)) {
  app.use('/resources', express.static(publicResourcesDir));
}

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

// Real-time check if an email is already registered
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existingUser = await (db.findUserByEmail ? db.findUserByEmail(cleanEmail) : db.findOne('users', { email: cleanEmail }));
    if (existingUser) {
      return res.json({ 
        exists: true, 
        message: 'This email is already registered in DDCET RankRise.' 
      });
    }

    return res.json({ 
      exists: false, 
      message: 'Email is available for registration.' 
    });
  } catch (err) {
    console.error('Error verifying email availability:', err);
    return res.status(500).json({ error: 'Failed to check email availability' });
  }
});

// Student Profile Creation - Modern primary entry flow
app.post('/api/auth/student-profile', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      mobile, 
      dob, 
      gender, 
      college, 
      branch, 
      semester 
    } = req.body;

    // 1. Validate required fields
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email Address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full Name must be at least 2 characters.' });
    }

    const cleanMobile = String(mobile || '').replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    if (!dob || typeof dob !== 'string' || !dob.trim()) {
      return res.status(400).json({ error: 'Date of Birth is required.' });
    }

    if (!gender || typeof gender !== 'string' || !gender.trim()) {
      return res.status(400).json({ error: 'Gender is required.' });
    }

    if (!college || typeof college !== 'string' || college.trim().length < 2) {
      return res.status(400).json({ error: 'Diploma College Name is required.' });
    }

    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      return res.status(400).json({ error: 'Diploma Engineering Branch is required.' });
    }

    if (!semester) {
      return res.status(400).json({ error: 'Current Semester is required.' });
    }

    // 2. Prevent duplicate student accounts & profile hijacking
    const existingUser = await (db.findUserByEmail ? db.findUserByEmail(cleanEmail) : db.findOne('users', { email: cleanEmail }));
    if (existingUser) {
      return res.status(409).json({ 
        error: 'This email is already registered in DDCET RankRise. Please sign in if you already have an account.' 
      });
    }

    // 3. Generate secure cryptographic password hash to preserve bcrypt database schema
    const secureSecret = crypto.randomBytes(32).toString('hex');
    const hashedPassword = bcrypt.hashSync(secureSecret, 10);
    const now = new Date().toISOString();

    // 4. Insert new student into users table
    const newUser = await db.insert('users', {
      email: cleanEmail,
      password: hashedPassword,
      role: 'student',
      profile_completed: true,
      name: name.trim(),
      mobile: cleanMobile,
      dob: dob.trim(),
      gender: gender.trim(),
      college: college.trim(),
      branch: branch.trim(),
      semester: String(semester).trim(),
      first_login_at: now,
      last_login_at: now
    });

    // 5. Sign JWT token for the authenticated student session
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: 'student' }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      message: 'Profile created successfully! Welcome to DDCET RankRise.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: 'student',
        profile_completed: true,
        mobile: newUser.mobile,
        dob: newUser.dob,
        gender: newUser.gender,
        college: newUser.college,
        branch: newUser.branch,
        semester: newUser.semester,
        first_login_at: newUser.first_login_at,
        last_login_at: newUser.last_login_at
      }
    });
  } catch (err) {
    console.error('Error creating student profile:', err);
    return res.status(500).json({ error: 'Failed to create student profile. Please try again.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  
  const cleanEmail = email.trim().toLowerCase();
  const existingUser = await (db.findUserByEmail ? db.findUserByEmail(cleanEmail) : db.findOne('users', { email: cleanEmail }));
  if (existingUser) return res.status(400).json({ error: 'Email is already registered' });
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = await db.insert('users', {
    email: cleanEmail,
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
  
  const cleanEmail = email.trim().toLowerCase();
  const user = await (db.findUserByEmail ? db.findUserByEmail(cleanEmail) : db.findOne('users', { email: cleanEmail }));
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
  let file_path = null;
  if (req.file) {
    try {
      const uploaded = await storageService.uploadResourceFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        category: 'materials'
      });
      file_path = uploaded.fileUrl;
    } catch (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }
  }
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
  const id = parseInt(req.params.id);
  const material = await db.findOne('materials', { id });
  if (material && material.file_path) {
    await storageService.deleteResourceFile(material.file_path);
  }
  await db.remove('materials', id);
  res.json({ success: true });
});

// --- URL Safety Validator ---
const validateWebUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('Destination URL is required and must be a string.');
  }
  const trimmed = urlStr.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (e) {
    throw new Error('Invalid URL format. Please provide a well-formed web address.');
  }

  // Strictly enforce approved web protocols (reject javascript:, data:, file:, etc.)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Insecure protocol "${parsed.protocol}". Only HTTPS and HTTP web links are permitted.`);
  }

  if (!parsed.hostname || parsed.hostname.toLowerCase() === 'javascript') {
    throw new Error('Invalid destination host in URL.');
  }

  return parsed.toString();
};

// --- RESOURCES API ---
app.get('/api/resources', async (req, res) => {
  const { type, publishedOnly, subject_id, chapter_id, exam_year, externalOnly, search, page, limit } = req.query;
  
  // Extract user authorization to determine if request is from an admin
  let isUserAdmin = false;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isUserAdmin = true;
      }
    } catch (_err) {
      // Invalid token or expired, treated as non-admin
    }
  }

  const criteria = {};
  if (type) criteria.type = type;
  if (subject_id) criteria.subject_id = parseInt(subject_id);
  if (chapter_id) criteria.chapter_id = parseInt(chapter_id);
  if (exam_year) criteria.exam_year = parseInt(exam_year);

  // CRITICAL SECURITY ENFORCEMENT:
  // If requester is not an authorized administrator, ONLY published resources are accessible.
  if (!isUserAdmin || publishedOnly === 'true') {
    criteria.published = true;
  }

  let resources = await db.find('resources', criteria);

  if (externalOnly === 'true') {
    resources = resources.filter(r => r.external_url);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    resources = resources.filter(r => 
      (r.title && r.title.toLowerCase().includes(q)) || 
      (r.description && r.description.toLowerCase().includes(q))
    );
  }

  resources.sort((a, b) => {
    if ((a.display_order || 0) !== (b.display_order || 0)) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    return (b.exam_year || 0) - (a.exam_year || 0);
  });

  // Server-side pagination support for large collections
  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const total = resources.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = resources.slice(startIndex, startIndex + limitNum);
    return res.json({
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  }

  res.json(resources);
});

// Access / Signed URL resolution for a specific resource
app.get('/api/resources/:id/access', async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await db.findOne('resources', { id });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  let isUserAdmin = false;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      if (decoded && decoded.role === 'admin') isUserAdmin = true;
    } catch (_err) {}
  }

  // Non-admins cannot access unpublished resources
  if (!resource.published && !isUserAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource.' });
  }

  // External web link
  if (resource.external_url) {
    return res.json({
      type: 'external',
      url: resource.external_url,
      title: resource.title
    });
  }

  if (!resource.file_path) {
    return res.status(404).json({ error: 'No file attached to this resource.' });
  }

  let accessUrl = resource.file_path;
  if (storageService.isSupabaseConfigured() && resource.file_path.includes(process.env.SUPABASE_STORAGE_BUCKET || 'ddcet-resources')) {
    const signed = await storageService.getSignedUrl(resource.file_path, 3600);
    if (signed) accessUrl = signed;
  }

  res.json({
    type: 'file',
    url: accessUrl,
    title: resource.title,
    file_size: resource.file_size || null
  });
});

// Direct safe download endpoint with Content-Disposition
app.get('/api/resources/:id/download', async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await db.findOne('resources', { id });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  let isUserAdmin = false;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      if (decoded && decoded.role === 'admin') isUserAdmin = true;
    } catch (_err) {}
  }

  if (!resource.published && !isUserAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to download this resource.' });
  }

  if (resource.external_url) {
    return res.redirect(resource.external_url);
  }

  if (!resource.file_path) {
    return res.status(404).json({ error: 'No file attached to this resource.' });
  }

  // Local disk file
  if (resource.file_path.startsWith('/uploads/')) {
    const filename = path.basename(resource.file_path);
    const localPath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(localPath)) {
      const safeTitle = (resource.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
      return res.download(localPath, `${safeTitle}.pdf`);
    }
  }

  // Supabase file
  if (storageService.isSupabaseConfigured() && resource.file_path.includes(process.env.SUPABASE_STORAGE_BUCKET || 'ddcet-resources')) {
    const signed = await storageService.getSignedUrl(resource.file_path, 300);
    if (signed) return res.redirect(signed);
  }

  return res.redirect(resource.file_path);
});

app.post('/api/resources', upload.single('file'), async (req, res) => {
  const { title, description, type, exam_year, paper_id, published, external_url, subject_id, chapter_id, topic_id, display_order } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  let file_path = null;
  let file_size = null;
  let validatedExternalUrl = null;

  if (req.file) {
    try {
      const uploaded = await storageService.uploadResourceFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        category: type || 'resources'
      });
      file_path = uploaded.fileUrl;
      file_size = uploaded.fileSize || req.file.size;
    } catch (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }
  } else if (external_url && external_url.trim()) {
    try {
      validatedExternalUrl = validateWebUrl(external_url);
    } catch (urlErr) {
      return res.status(400).json({ error: urlErr.message });
    }
  } else {
    return res.status(400).json({ error: 'Either a PDF file or an external URL is required' });
  }
  
  const newResource = await db.insert('resources', {
    title: title.trim(), 
    description: description ? description.trim() : '', 
    type: type || 'general', 
    exam_year: exam_year ? parseInt(exam_year) : null,
    paper_id: paper_id ? parseInt(paper_id) : null,
    file_path,
    file_size,
    external_url: validatedExternalUrl,
    subject_id: subject_id ? parseInt(subject_id) : null,
    chapter_id: chapter_id ? parseInt(chapter_id) : null,
    topic_id: topic_id ? parseInt(topic_id) : null,
    display_order: display_order ? parseInt(display_order) : 0,
    published: published === 'true' || published === true ? true : false
  });
  res.status(201).json(newResource);
});

// Update resource metadata (without replacing file)
app.put('/api/resources/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await db.findOne('resources', { id });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  const { title, description, type, exam_year, paper_id, published, external_url, subject_id, chapter_id, topic_id, display_order } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (type !== undefined) updates.type = type;
  if (exam_year !== undefined) updates.exam_year = exam_year ? parseInt(exam_year) : null;
  if (paper_id !== undefined) updates.paper_id = paper_id ? parseInt(paper_id) : null;
  if (subject_id !== undefined) updates.subject_id = subject_id ? parseInt(subject_id) : null;
  if (chapter_id !== undefined) updates.chapter_id = chapter_id ? parseInt(chapter_id) : null;
  if (topic_id !== undefined) updates.topic_id = topic_id ? parseInt(topic_id) : null;
  if (display_order !== undefined) updates.display_order = parseInt(display_order) || 0;
  if (published !== undefined) updates.published = published === 'true' || published === true;

  if (external_url !== undefined) {
    if (external_url === null || external_url === '') {
      updates.external_url = null;
    } else {
      try {
        updates.external_url = validateWebUrl(external_url);
      } catch (urlErr) {
        return res.status(400).json({ error: urlErr.message });
      }
    }
  }

  const updated = await db.update('resources', id, updates);
  res.json(updated);
});

// Quick toggle publish/unpublish
app.put('/api/resources/:id/publish', async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await db.findOne('resources', { id });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  const newStatus = !resource.published;
  const updated = await db.update('resources', id, { published: newStatus });
  res.json(updated);
});

// Replace existing file without altering resource metadata or ID
app.put('/api/resources/:id/replace-file', upload.single('file'), async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await db.findOne('resources', { id });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  if (!req.file) return res.status(400).json({ error: 'New PDF file is required' });

  try {
    const uploaded = await storageService.uploadResourceFile({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      category: resource.type || 'resources'
    });

    const oldFilePath = resource.file_path;
    const updated = await db.update('resources', id, { 
      file_path: uploaded.fileUrl, 
      file_size: uploaded.fileSize || req.file.size,
      external_url: null 
    });

    // Clean up old file after successful database update
    if (oldFilePath && oldFilePath !== uploaded.fileUrl) {
      await storageService.deleteResourceFile(oldFilePath);
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Coordinated resource deletion
app.delete('/api/resources/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await db.findOne('resources', { id });
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  // Safety check: ensure answer keys are not orphaned
  const keys = await db.find('resources', { type: 'answer_key', paper_id: id });
  if (keys.length > 0) {
    return res.status(400).json({ 
      error: "Cannot delete this question paper because answer keys are linked to it. Please delete or re-link the answer keys first." 
    });
  }
  
  // 1. Remove record from database first
  await db.remove('resources', id);

  // 2. Safely remove file from storage
  if (resource.file_path) {
    await storageService.deleteResourceFile(resource.file_path);
  }

  res.json({ success: true, message: 'Resource deleted successfully' });
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

// Health check endpoint (safe for public monitoring, zero secrets exposed)
app.get('/api/health', async (req, res) => {
  try {
    await db.testConnection();
    res.json({
      status: 'ok',
      database: USE_PG ? 'postgresql' : 'json',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: USE_PG ? 'postgresql' : 'json',
      message: 'Database check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Centralized Error Handling
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('Not allowed by CORS')) {
    return res.status(403).json({ error: 'CORS access denied: Origin not allowed' });
  }
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
