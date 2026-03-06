-- EdGame Phase 1 Data Model
-- Reconciles spec-v1.0.md §2.3 with issue #9 requirements
-- Supabase PostgreSQL with Row-Level Security

-- ============================================================
-- CORE TABLES
-- ============================================================

-- School / organization model (from spec §2.3)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('private', 'public', 'charter', 'international')),
  country TEXT,
  region TEXT,
  license_type TEXT CHECK (license_type IN ('trial', 'standard', 'premium')),
  license_expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users with role-based access (spec §2.3 + issue #9)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
  first_name TEXT,
  last_name TEXT,
  school_id UUID REFERENCES schools(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher class groups with join codes (issue #9)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  subject TEXT,
  grade_level INTEGER,
  join_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student ↔ Class many-to-many (issue #9)
CREATE TABLE class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Game environments catalog (spec §2.3 + issue #9)
CREATE TABLE game_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,        -- e.g. 'pulse-realms'
  name TEXT NOT NULL,               -- e.g. 'Pulse Realms'
  subject TEXT NOT NULL CHECK (subject IN ('math', 'science', 'language_arts', 'mixed')),
  grade_range INT4RANGE,
  description TEXT,
  thumbnail_url TEXT,
  config JSONB DEFAULT '{}',        -- default game settings
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher-created assignments (spec §2.3 + issue #9)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  environment_id UUID NOT NULL REFERENCES game_environments(id),
  class_id UUID REFERENCES classes(id),
  title TEXT NOT NULL,
  instructions TEXT,
  due_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',        -- assignment-specific overrides (difficulty, time limit, subject)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GAME DATA TABLES
-- ============================================================

-- Individual play sessions (spec §2.3 + issue #9)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  assignment_id UUID REFERENCES assignments(id),
  environment_id UUID NOT NULL REFERENCES game_environments(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Raw telemetry events (issue #9: replaces spec's raw_events JSONB column)
-- Normalized for query performance and RLS
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,         -- e.g. 'question_answered', 'action_performed', 'damage_taken'
  payload JSONB NOT NULL DEFAULT '{}',
  ts TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_game_events_session ON game_events(session_id);
CREATE INDEX idx_game_events_type ON game_events(event_type);

-- Aggregated metrics per session across 6 dimensions (issue #9)
CREATE TABLE computed_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  environment_id UUID NOT NULL REFERENCES game_environments(id),

  -- D1: Cognitive Knowledge
  correctness_rate NUMERIC,
  avg_response_time_ms INTEGER,
  speed_accuracy_profile TEXT,      -- 'fluent', 'deliberate', 'guessing', 'struggling'
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,

  -- D2: Behavioral Engagement
  total_time_seconds INTEGER,
  action_count INTEGER DEFAULT 0,
  completion_rate NUMERIC,

  -- D3: Strategic Behavior
  strategy_classification TEXT,     -- e.g. 'attacker', 'healer', 'builder', 'mixed'
  action_variation_index NUMERIC,   -- diversity of actions taken (0-1 scale)
  role_chosen TEXT,

  -- D4: Social & Collaborative
  teammate_interactions INTEGER DEFAULT 0,
  heal_actions INTEGER DEFAULT 0,
  shield_actions INTEGER DEFAULT 0,

  -- D5: Affective & SEL
  persistence_after_failure NUMERIC,  -- ratio of continued play after wrong answers
  frustration_score NUMERIC,          -- derived from behavioral patterns

  -- D6: Temporal & Longitudinal
  response_consistency NUMERIC,     -- std dev of response times
  learning_velocity NUMERIC,        -- correctness rate change across session

  computed_at TIMESTAMPTZ DEFAULT now()
);

-- Daily aggregation of metrics per student (spec §2.3 + issue #9)
CREATE TABLE student_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  environment_id UUID REFERENCES game_environments(id),

  -- Engagement metrics
  total_time_minutes NUMERIC,
  session_count INTEGER,
  completion_rate NUMERIC,

  -- Performance metrics
  accuracy NUMERIC,
  avg_response_time_ms INTEGER,
  concepts_practiced TEXT[],
  concepts_mastered TEXT[],

  -- Behavioral metrics
  help_requests INTEGER,
  retry_count INTEGER,
  strategy_changes INTEGER,

  UNIQUE(student_id, date, environment_id)
);

-- Question bank (issue #9)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL CHECK (subject IN ('math', 'science', 'general')),
  topic TEXT,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,           -- array of {text, isCorrect}
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  grade_level INTEGER,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE computed_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Users: see own profile
CREATE POLICY "Users see own profile"
  ON users FOR SELECT
  USING (auth_id = auth.uid());

-- Classes: teachers see own classes
CREATE POLICY "Teachers see own classes"
  ON classes FOR SELECT
  USING (teacher_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Teachers manage own classes"
  ON classes FOR ALL
  USING (teacher_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Class members: teachers see their class members, students see own memberships
CREATE POLICY "Teachers see class members"
  ON class_members FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes
      WHERE teacher_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Students see own memberships"
  ON class_members FOR SELECT
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Game sessions: students see own, teachers see their class sessions
CREATE POLICY "Students see own sessions"
  ON game_sessions FOR SELECT
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Teachers see class sessions"
  ON game_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE a.id = game_sessions.assignment_id
      AND c.teacher_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Game events: insert-only from authenticated students
CREATE POLICY "Students insert own events"
  ON game_events FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM game_sessions
      WHERE student_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Teachers read class events"
  ON game_events FOR SELECT
  USING (
    session_id IN (
      SELECT gs.id FROM game_sessions gs
      JOIN assignments a ON gs.assignment_id = a.id
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Computed metrics: read-only for teachers
CREATE POLICY "Teachers read class metrics"
  ON computed_metrics FOR SELECT
  USING (
    student_id IN (
      SELECT cm.student_id FROM class_members cm
      JOIN classes c ON cm.class_id = c.id
      WHERE c.teacher_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Students read own metrics"
  ON computed_metrics FOR SELECT
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Questions: readable by all authenticated users
CREATE POLICY "Authenticated users read questions"
  ON questions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- DATABASE FUNCTIONS (issue #9)
-- ============================================================

-- Compute session metrics from raw events
CREATE OR REPLACE FUNCTION compute_session_metrics(p_session_id UUID)
RETURNS VOID AS $$
DECLARE
  v_student_id UUID;
  v_environment_id UUID;
  v_total_questions INTEGER;
  v_correct_questions INTEGER;
  v_avg_rt INTEGER;
BEGIN
  SELECT student_id, environment_id INTO v_student_id, v_environment_id
  FROM game_sessions WHERE id = p_session_id;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE (payload->>'correct')::boolean),
    AVG((payload->>'responseTimeMs')::integer)
  INTO v_total_questions, v_correct_questions, v_avg_rt
  FROM game_events
  WHERE session_id = p_session_id AND event_type = 'question_answered';

  INSERT INTO computed_metrics (session_id, student_id, environment_id,
    correctness_rate, avg_response_time_ms, questions_attempted, questions_correct)
  VALUES (
    p_session_id, v_student_id, v_environment_id,
    CASE WHEN v_total_questions > 0
      THEN v_correct_questions::numeric / v_total_questions
      ELSE 0 END,
    v_avg_rt, v_total_questions, v_correct_questions
  )
  ON CONFLICT (session_id) DO UPDATE SET
    correctness_rate = EXCLUDED.correctness_rate,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    questions_attempted = EXCLUDED.questions_attempted,
    questions_correct = EXCLUDED.questions_correct,
    computed_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily rollup job
CREATE OR REPLACE FUNCTION daily_rollup_job()
RETURNS VOID AS $$
BEGIN
  INSERT INTO student_metrics_daily (student_id, date, environment_id,
    total_time_minutes, session_count, accuracy, avg_response_time_ms)
  SELECT
    gs.student_id,
    CURRENT_DATE,
    gs.environment_id,
    SUM(gs.duration_seconds) / 60.0,
    COUNT(gs.id),
    AVG(cm.correctness_rate),
    AVG(cm.avg_response_time_ms)
  FROM game_sessions gs
  LEFT JOIN computed_metrics cm ON cm.session_id = gs.id
  WHERE gs.started_at::date = CURRENT_DATE
  GROUP BY gs.student_id, gs.environment_id
  ON CONFLICT (student_id, date, environment_id) DO UPDATE SET
    total_time_minutes = EXCLUDED.total_time_minutes,
    session_count = EXCLUDED.session_count,
    accuracy = EXCLUDED.accuracy,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
