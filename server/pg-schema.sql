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
  semester VARCHAR,
  CONSTRAINT check_user_role CHECK (role IN ('student', 'admin', 'superadmin'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  section_code VARCHAR DEFAULT 'BE-01',
  section_name VARCHAR DEFAULT 'Basics of Science & Engineering',
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS chapters (
  id BIGSERIAL PRIMARY KEY,
  subject_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_number INTEGER,
  name VARCHAR NOT NULL,
  weightage VARCHAR,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS topics (
  id BIGSERIAL PRIMARY KEY,
  chapter_id BIGINT REFERENCES chapters(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  important_points JSONB,
  description TEXT,
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

-- Admin Security & Two-Admin Maximum Enforcement Trigger
CREATE OR REPLACE FUNCTION enforce_admin_constraints()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'superadmin' OR LOWER(OLD.email) = 'dhruvmistry0511@gmail.com' THEN
      RAISE EXCEPTION 'Super Admin account cannot be deleted.';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.role = 'superadmin' AND LOWER(NEW.email) != 'dhruvmistry0511@gmail.com' THEN
    RAISE EXCEPTION 'Only the primary account can be Super Admin.';
  END IF;

  IF TG_OP = 'UPDATE' AND (OLD.role = 'superadmin' OR LOWER(OLD.email) = 'dhruvmistry0511@gmail.com') THEN
    IF NEW.role != 'superadmin' THEN
      RAISE EXCEPTION 'Super Admin account cannot be demoted.';
    END IF;
  END IF;

  IF NEW.role IN ('admin', 'superadmin') THEN
    SELECT COUNT(*) INTO admin_count
    FROM users
    WHERE role IN ('admin', 'superadmin')
      AND id != COALESCE(NEW.id, -1);
    
    IF admin_count >= 2 THEN
      RAISE EXCEPTION 'Security Policy: Maximum of 2 administrator accounts allowed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_admin_constraints ON users;
CREATE TRIGGER trg_enforce_admin_constraints
BEFORE INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION enforce_admin_constraints();

