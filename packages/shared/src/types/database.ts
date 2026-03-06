// TypeScript types matching SurrealDB schema (docs/architecture/data-model.surql)

export type UserRole = "teacher" | "student" | "admin";
export type SchoolType = "private" | "public" | "charter" | "international";
export type LicenseType = "trial" | "standard" | "premium";
export type Subject = "math" | "science" | "language_arts" | "mixed";
export type QuestionSubject = "math" | "science" | "general";
export type RoleId = "attacker" | "healer" | "builder";
export type ActionId = "attack" | "powerStrike" | "heal" | "shield" | "buildBarrier" | "deployTurret";
export type SpeedAccuracyProfile = "fluent" | "deliberate" | "guessing" | "struggling";
export type StrategyClassification = "attacker" | "healer" | "builder" | "mixed";

export interface School {
  id: string;
  name: string;
  type?: SchoolType;
  country?: string;
  region?: string;
  license_type?: LicenseType;
  license_expires_at?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  school?: string; // record link to schools
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  teacher: string; // record link to users
  name: string;
  subject?: string;
  grade_level?: number;
  join_code: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassMember {
  id: string;
  class: string; // record link to classes
  student: string; // record link to users
  joined_at: string;
}

export interface GameEnvironment {
  id: string;
  slug: string;
  name: string;
  subject: Subject;
  grade_min?: number;
  grade_max?: number;
  description?: string;
  thumbnail_url?: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface Assignment {
  id: string;
  teacher: string;
  environment: string;
  class?: string;
  title: string;
  instructions?: string;
  due_at?: string;
  config: Record<string, unknown>;
  created_at: string;
}

export interface GameSession {
  id: string;
  student: string;
  assignment?: string;
  environment: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  completed: boolean;
  score?: number;
}

export interface GameEvent {
  id: string;
  session: string;
  event_type: string;
  payload: Record<string, unknown>;
  ts: string;
}

export interface ComputedMetrics {
  id: string;
  session: string;
  student: string;
  environment: string;
  // D1
  correctness_rate?: number;
  avg_response_time_ms?: number;
  speed_accuracy_profile?: SpeedAccuracyProfile;
  questions_attempted: number;
  questions_correct: number;
  // D2
  total_time_seconds?: number;
  action_count: number;
  completion_rate?: number;
  // D3
  strategy_classification?: StrategyClassification;
  action_variation_index?: number;
  role_chosen?: string;
  // D4
  teammate_interactions: number;
  heal_actions: number;
  shield_actions: number;
  // D5
  persistence_after_failure?: number;
  frustration_score?: number;
  // D6
  response_consistency?: number;
  learning_velocity?: number;
  computed_at: string;
}

export interface StudentMetricsDaily {
  id: string;
  student: string;
  date: string;
  environment?: string;
  total_time_minutes?: number;
  session_count?: number;
  completion_rate?: number;
  accuracy?: number;
  avg_response_time_ms?: number;
  concepts_practiced?: string[];
  concepts_mastered?: string[];
  help_requests?: number;
  retry_count?: number;
  strategy_changes?: number;
}

export interface StudentInsight {
  id: string;
  student: string;
  class?: string;
  period_start: string;
  period_end: string;
  insights: Array<{
    dimension: string;
    title: string;
    description: string;
    action: string;
    severity: string;
  }>;
  generated_at: string;
}

export interface Question {
  id: string;
  subject: QuestionSubject;
  topic?: string;
  difficulty: number;
  question_text: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  correct_answer: string;
  explanation?: string;
  grade_level?: number;
  tags?: string[];
  created_at: string;
}
