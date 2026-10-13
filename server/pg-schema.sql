CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
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
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS chapters (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS topics (
  id BIGSERIAL PRIMARY KEY,
  chapter_id BIGINT REFERENCES chapters(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS materials (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  type VARCHAR,
  description TEXT,
  file_path VARCHAR,
  reference_url VARCHAR,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id BIGINT REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id BIGINT REFERENCES topics(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS questions (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT,
  marks NUMERIC DEFAULT 1.0,
  negative_marks NUMERIC DEFAULT 0.0,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id BIGINT REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id BIGINT REFERENCES topics(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tests (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  type VARCHAR,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id BIGINT REFERENCES chapters(id) ON DELETE SET NULL,
  duration_minutes INTEGER DEFAULT 60,
  scheduled_start_time TIMESTAMP,
  scheduled_end_time TIMESTAMP,
  status VARCHAR DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS test_questions (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT REFERENCES tests(id) ON DELETE CASCADE,
  question_id BIGINT REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  test_id BIGINT REFERENCES tests(id) ON DELETE CASCADE,
  answers JSONB,
  score NUMERIC,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR,
  exam_year INTEGER,
  paper_id BIGINT REFERENCES resources(id) ON DELETE SET NULL,
  file_path VARCHAR,
  external_url TEXT,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id BIGINT REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id BIGINT REFERENCES topics(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  file_size BIGINT,
  published BOOLEAN DEFAULT FALSE,
  internal_id VARCHAR UNIQUE
);

CREATE TABLE IF NOT EXISTS student_topic_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  topic_id BIGINT,
  completed BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR,
  topic_id BIGINT,
  time_spent_seconds INTEGER DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
