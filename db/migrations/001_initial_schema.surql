-- EdGame Phase 1 Data Model (SurrealDB)
-- Reconciles spec-v1.0.md §2.3 with issue #9 requirements
-- Uses SurrealQL schema definitions with permissions

-- ============================================================
-- NAMESPACE & DATABASE
-- ============================================================

DEFINE NAMESPACE edgame;
USE NS edgame;
DEFINE DATABASE production;
USE DB production;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- School / organization model
DEFINE TABLE schools SCHEMAFULL
  PERMISSIONS
    FOR select WHERE $auth.role = 'admin' OR school = $auth.school
    FOR create, update, delete WHERE $auth.role = 'admin';

DEFINE FIELD name         ON schools TYPE string ASSERT $value != NONE;
DEFINE FIELD type         ON schools TYPE option<string> ASSERT $value INSIDE ['private', 'public', 'charter', 'international'];
DEFINE FIELD country      ON schools TYPE option<string>;
DEFINE FIELD region       ON schools TYPE option<string>;
DEFINE FIELD license_type ON schools TYPE option<string> ASSERT $value INSIDE ['trial', 'standard', 'premium'];
DEFINE FIELD license_expires_at ON schools TYPE option<datetime>;
DEFINE FIELD created_at   ON schools TYPE datetime DEFAULT time::now();

-- Users with role-based access
DEFINE TABLE users SCHEMAFULL
  PERMISSIONS
    FOR select WHERE id = $auth.id OR $auth.role = 'admin'
    FOR update WHERE id = $auth.id
    FOR create, delete WHERE $auth.role = 'admin';

DEFINE FIELD email        ON users TYPE string ASSERT string::is::email($value);
DEFINE FIELD role         ON users TYPE string ASSERT $value INSIDE ['teacher', 'student', 'admin'];
DEFINE FIELD first_name   ON users TYPE option<string>;
DEFINE FIELD last_name    ON users TYPE option<string>;
DEFINE FIELD school       ON users TYPE option<record<schools>>;
DEFINE FIELD avatar_url   ON users TYPE option<string>;
DEFINE FIELD password_hash ON users TYPE option<string>;
DEFINE FIELD created_at   ON users TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at   ON users TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_users_email ON users FIELDS email UNIQUE;

-- Teacher class groups with join codes
DEFINE TABLE classes SCHEMAFULL
  PERMISSIONS
    FOR select WHERE teacher = $auth.id
      OR (SELECT * FROM class_members WHERE class = $parent.id AND student = $auth.id)
    FOR create, update, delete WHERE $auth.role = 'teacher' AND teacher = $auth.id;

DEFINE FIELD teacher      ON classes TYPE record<users>;
DEFINE FIELD name         ON classes TYPE string ASSERT $value != NONE;
DEFINE FIELD subject      ON classes TYPE option<string>;
DEFINE FIELD grade_level  ON classes TYPE option<int>;
DEFINE FIELD join_code    ON classes TYPE string ASSERT $value != NONE;
DEFINE FIELD is_active    ON classes TYPE bool DEFAULT true;
DEFINE FIELD created_at   ON classes TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_classes_join_code ON classes FIELDS join_code UNIQUE;

-- Student ↔ Class many-to-many
DEFINE TABLE class_members SCHEMAFULL
  PERMISSIONS
    FOR select WHERE student = $auth.id
      OR (SELECT * FROM classes WHERE id = $parent.class AND teacher = $auth.id)
    FOR create WHERE $auth.role = 'teacher'
    FOR delete WHERE $auth.role = 'teacher';

DEFINE FIELD class        ON class_members TYPE record<classes>;
DEFINE FIELD student      ON class_members TYPE record<users>;
DEFINE FIELD joined_at    ON class_members TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_class_members_unique ON class_members FIELDS class, student UNIQUE;

-- Game environments catalog
DEFINE TABLE game_environments SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true  -- readable by all authenticated users
    FOR create, update, delete WHERE $auth.role = 'admin';

DEFINE FIELD slug         ON game_environments TYPE string ASSERT $value != NONE;
DEFINE FIELD name         ON game_environments TYPE string ASSERT $value != NONE;
DEFINE FIELD subject      ON game_environments TYPE string ASSERT $value INSIDE ['math', 'science', 'language_arts', 'mixed'];
DEFINE FIELD grade_min    ON game_environments TYPE option<int>;
DEFINE FIELD grade_max    ON game_environments TYPE option<int>;
DEFINE FIELD description  ON game_environments TYPE option<string>;
DEFINE FIELD thumbnail_url ON game_environments TYPE option<string>;
DEFINE FIELD config       ON game_environments FLEXIBLE TYPE option<object> DEFAULT {};
DEFINE FIELD is_active    ON game_environments TYPE bool DEFAULT true;
DEFINE FIELD created_at   ON game_environments TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_environments_slug ON game_environments FIELDS slug UNIQUE;

-- Teacher-created assignments
DEFINE TABLE assignments SCHEMAFULL
  PERMISSIONS
    FOR select WHERE teacher = $auth.id
      OR (SELECT * FROM class_members WHERE class = $parent.class AND student = $auth.id)
    FOR create, update, delete WHERE $auth.role = 'teacher' AND teacher = $auth.id;

DEFINE FIELD teacher      ON assignments TYPE record<users>;
DEFINE FIELD environment  ON assignments TYPE record<game_environments>;
DEFINE FIELD class        ON assignments TYPE option<record<classes>>;
DEFINE FIELD title        ON assignments TYPE string ASSERT $value != NONE;
DEFINE FIELD instructions ON assignments TYPE option<string>;
DEFINE FIELD due_at       ON assignments TYPE option<datetime>;
DEFINE FIELD config       ON assignments FLEXIBLE TYPE option<object> DEFAULT {};
DEFINE FIELD created_at   ON assignments TYPE datetime DEFAULT time::now();

-- ============================================================
-- GAME DATA TABLES
-- ============================================================

-- Individual play sessions
DEFINE TABLE game_sessions SCHEMAFULL
  PERMISSIONS
    FOR select WHERE student = $auth.id
      OR $auth.role = 'teacher'
    FOR create WHERE $auth.role = 'student' AND student = $auth.id
    FOR update WHERE student = $auth.id;

DEFINE FIELD student      ON game_sessions TYPE record<users>;
DEFINE FIELD assignment   ON game_sessions TYPE option<record<assignments>>;
DEFINE FIELD environment  ON game_sessions TYPE record<game_environments>;
DEFINE FIELD started_at   ON game_sessions TYPE datetime DEFAULT time::now();
DEFINE FIELD ended_at     ON game_sessions TYPE option<datetime>;
DEFINE FIELD duration_seconds ON game_sessions TYPE option<int>;
DEFINE FIELD completed    ON game_sessions TYPE bool DEFAULT false;
DEFINE FIELD score        ON game_sessions TYPE option<float>;
DEFINE INDEX idx_sessions_student ON game_sessions FIELDS student;

-- Raw telemetry events
DEFINE TABLE game_events SCHEMAFULL
  PERMISSIONS
    FOR create WHERE $auth.role = 'student'
    FOR select WHERE $auth.role = 'teacher' OR $auth.role = 'admin';

DEFINE FIELD session      ON game_events TYPE record<game_sessions>;
DEFINE FIELD event_type   ON game_events TYPE string ASSERT $value != NONE;
DEFINE FIELD payload      ON game_events FLEXIBLE TYPE object DEFAULT {};
DEFINE FIELD ts           ON game_events TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_events_session ON game_events FIELDS session;
DEFINE INDEX idx_events_type ON game_events FIELDS event_type;

-- Aggregated metrics per session across 6 dimensions
DEFINE TABLE computed_metrics SCHEMAFULL
  PERMISSIONS
    FOR select WHERE student = $auth.id OR $auth.role = 'teacher'
    FOR create, update WHERE $auth.role = 'admin' OR $auth.role = 'teacher';

DEFINE FIELD session      ON computed_metrics TYPE record<game_sessions>;
DEFINE FIELD student      ON computed_metrics TYPE record<users>;
DEFINE FIELD environment  ON computed_metrics TYPE record<game_environments>;

-- D1: Cognitive Knowledge
DEFINE FIELD correctness_rate       ON computed_metrics TYPE option<float>;
DEFINE FIELD avg_response_time_ms   ON computed_metrics TYPE option<int>;
DEFINE FIELD speed_accuracy_profile ON computed_metrics TYPE option<string>;
DEFINE FIELD questions_attempted    ON computed_metrics TYPE int DEFAULT 0;
DEFINE FIELD questions_correct      ON computed_metrics TYPE int DEFAULT 0;

-- D2: Behavioral Engagement
DEFINE FIELD total_time_seconds     ON computed_metrics TYPE option<int>;
DEFINE FIELD action_count           ON computed_metrics TYPE int DEFAULT 0;
DEFINE FIELD completion_rate        ON computed_metrics TYPE option<float>;

-- D3: Strategic Behavior
DEFINE FIELD strategy_classification ON computed_metrics TYPE option<string>;
DEFINE FIELD action_variation_index  ON computed_metrics TYPE option<float>;
DEFINE FIELD role_chosen             ON computed_metrics TYPE option<string>;

-- D4: Social & Collaborative
DEFINE FIELD teammate_interactions   ON computed_metrics TYPE int DEFAULT 0;
DEFINE FIELD heal_actions            ON computed_metrics TYPE int DEFAULT 0;
DEFINE FIELD shield_actions          ON computed_metrics TYPE int DEFAULT 0;

-- D5: Affective & SEL
DEFINE FIELD persistence_after_failure ON computed_metrics TYPE option<float>;
DEFINE FIELD frustration_score         ON computed_metrics TYPE option<float>;

-- D6: Temporal & Longitudinal
DEFINE FIELD response_consistency    ON computed_metrics TYPE option<float>;
DEFINE FIELD learning_velocity       ON computed_metrics TYPE option<float>;

DEFINE FIELD computed_at             ON computed_metrics TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_metrics_session ON computed_metrics FIELDS session UNIQUE;

-- Daily aggregation of metrics per student
DEFINE TABLE student_metrics_daily SCHEMAFULL
  PERMISSIONS
    FOR select WHERE student = $auth.id OR $auth.role = 'teacher'
    FOR create, update WHERE $auth.role = 'admin';

DEFINE FIELD student      ON student_metrics_daily TYPE record<users>;
DEFINE FIELD date         ON student_metrics_daily TYPE datetime;
DEFINE FIELD environment  ON student_metrics_daily TYPE option<record<game_environments>>;

-- Engagement
DEFINE FIELD total_time_minutes     ON student_metrics_daily TYPE option<float>;
DEFINE FIELD session_count          ON student_metrics_daily TYPE option<int>;
DEFINE FIELD completion_rate        ON student_metrics_daily TYPE option<float>;

-- Performance
DEFINE FIELD accuracy               ON student_metrics_daily TYPE option<float>;
DEFINE FIELD avg_response_time_ms   ON student_metrics_daily TYPE option<int>;
DEFINE FIELD concepts_practiced     ON student_metrics_daily TYPE option<array<string>>;
DEFINE FIELD concepts_mastered      ON student_metrics_daily TYPE option<array<string>>;

-- Behavioral
DEFINE FIELD help_requests          ON student_metrics_daily TYPE option<int>;
DEFINE FIELD retry_count            ON student_metrics_daily TYPE option<int>;
DEFINE FIELD strategy_changes       ON student_metrics_daily TYPE option<int>;

DEFINE INDEX idx_daily_unique ON student_metrics_daily FIELDS student, date, environment UNIQUE;

-- Top-3 generated insights per student (issue #9)
DEFINE TABLE student_insights SCHEMAFULL
  PERMISSIONS
    FOR select WHERE student = $auth.id OR $auth.role = 'teacher'
    FOR create, update, delete WHERE $auth.role = 'admin' OR $auth.role = 'teacher';

DEFINE FIELD student      ON student_insights TYPE record<users>;
DEFINE FIELD class        ON student_insights TYPE option<record<classes>>;
DEFINE FIELD period_start ON student_insights TYPE datetime;
DEFINE FIELD period_end   ON student_insights TYPE datetime;
DEFINE FIELD insights     ON student_insights FLEXIBLE TYPE array DEFAULT [];
-- Each insight: { dimension: string, title: string, description: string, action: string, severity: string }
DEFINE FIELD generated_at ON student_insights TYPE datetime DEFAULT time::now();

-- Question bank
DEFINE TABLE questions SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true  -- readable by all authenticated users
    FOR create, update, delete WHERE $auth.role = 'admin' OR $auth.role = 'teacher';

DEFINE FIELD subject       ON questions TYPE string ASSERT $value INSIDE ['math', 'science', 'general'];
DEFINE FIELD topic         ON questions TYPE option<string>;
DEFINE FIELD difficulty    ON questions TYPE int ASSERT $value >= 1 AND $value <= 5;
DEFINE FIELD question_text ON questions TYPE string ASSERT $value != NONE;
DEFINE FIELD options       ON questions FLEXIBLE TYPE array ASSERT $value != NONE;
DEFINE FIELD correct_answer ON questions TYPE string ASSERT $value != NONE;
DEFINE FIELD explanation   ON questions TYPE option<string>;
DEFINE FIELD grade_level   ON questions TYPE option<int>;
DEFINE FIELD tags          ON questions TYPE option<array<string>>;
DEFINE FIELD created_at    ON questions TYPE datetime DEFAULT time::now();

-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- Compute session metrics from raw events
DEFINE FUNCTION fn::compute_session_metrics($session_id: record<game_sessions>) {
  LET $session = (SELECT student, environment FROM game_sessions WHERE id = $session_id)[0];

  LET $question_events = SELECT * FROM game_events
    WHERE session = $session_id AND event_type = 'question_answered';

  LET $total = count($question_events);
  LET $correct = count(SELECT * FROM $question_events WHERE payload.correct = true);
  LET $avg_rt = math::mean(SELECT VALUE payload.responseTimeMs FROM $question_events);

  UPSERT computed_metrics SET
    session = $session_id,
    student = $session.student,
    environment = $session.environment,
    correctness_rate = IF $total > 0 THEN $correct / $total ELSE 0 END,
    avg_response_time_ms = $avg_rt,
    questions_attempted = $total,
    questions_correct = $correct,
    computed_at = time::now()
  WHERE session = $session_id;
};

-- Daily rollup job
DEFINE FUNCTION fn::daily_rollup() {
  LET $today = time::now();

  LET $sessions_today = SELECT student, environment,
    math::sum(duration_seconds) AS total_seconds,
    count() AS session_count
  FROM game_sessions
  WHERE started_at >= time::floor($today, 1d)
  GROUP BY student, environment;

  FOR $row IN $sessions_today {
    LET $metrics = SELECT
      math::mean(correctness_rate) AS accuracy,
      math::mean(avg_response_time_ms) AS avg_rt
    FROM computed_metrics
    WHERE student = $row.student AND environment = $row.environment;

    UPSERT student_metrics_daily SET
      student = $row.student,
      date = time::floor($today, 1d),
      environment = $row.environment,
      total_time_minutes = $row.total_seconds / 60,
      session_count = $row.session_count,
      accuracy = $metrics[0].accuracy,
      avg_response_time_ms = $metrics[0].avg_rt
    WHERE student = $row.student
      AND date = time::floor($today, 1d)
      AND environment = $row.environment;
  };
};
