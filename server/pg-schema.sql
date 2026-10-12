CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'student',
  profile_completed BOOLEAN DEFAULT FALSE,
  first_login_at TIMESTAMP,
  last_login_at TIMESTAMP,
  name VARCHAR,
  mobile VARCHAR,
  dob VARCHAR,
  branch VARCHAR,
  gender VARCHAR,
  college VARCHAR,
  semester VARCHAR
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  type VARCHAR,
  description TEXT,
  file_path VARCHAR,
  reference_url VARCHAR,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT,
  marks NUMERIC DEFAULT 1.0,
  negative_marks NUMERIC DEFAULT 0.0,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  type VARCHAR,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  duration_minutes INTEGER DEFAULT 60,
  scheduled_start_time TIMESTAMP,
  scheduled_end_time TIMESTAMP,
  status VARCHAR DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS test_questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  answers JSONB,
  score NUMERIC,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR,
  exam_year INTEGER,
  paper_id INTEGER REFERENCES resources(id) ON DELETE SET NULL,
  file_path VARCHAR,
  published BOOLEAN DEFAULT FALSE,
  internal_id VARCHAR UNIQUE
);
