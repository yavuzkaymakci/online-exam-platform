-- Online Exam Platform - PostgreSQL Schema
-- Bu dosyayı veritabanınızı oluşturduktan sonra çalıştırın:
--   psql -U postgres -d online_exam -f schema.sql

-- 1. Kullanıcılar (Eğitmen / Öğrenci)
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' | 'instructor'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Sınavlar
CREATE TABLE IF NOT EXISTS exams (
  exam_id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  rules JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  access_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Sorular
CREATE TABLE IF NOT EXISTS questions (
  question_id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
  question_text TEXT,
  question_image TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 4. Şıklar
CREATE TABLE IF NOT EXISTS options (
  option_id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

-- 5. Sınav Sonuçları / Katılımlar
CREATE TABLE IF NOT EXISTS submissions (
  submission_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS', -- IN_PROGRESS | COMPLETED | TERMINATED
  score NUMERIC(10, 4) DEFAULT 0,
  violation_count INTEGER DEFAULT 0,
  student_answers JSONB DEFAULT '[]',
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  UNIQUE (user_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_exams_instructor ON exams(instructor_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam ON submissions(exam_id);
