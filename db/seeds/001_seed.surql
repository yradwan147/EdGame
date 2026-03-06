-- EdGame Seed Data for Development
-- Run after 001_initial_schema.surql

USE NS edgame DB production;

-- ============================================================
-- SCHOOL
-- ============================================================

CREATE schools:demo SET
  name = 'Demo International School',
  type = 'international',
  country = 'Saudi Arabia',
  region = 'Riyadh',
  license_type = 'premium',
  created_at = time::now();

-- ============================================================
-- USERS (1 teacher, 5 students)
-- ============================================================

CREATE users:teacher_01 SET
  email = 'teacher@demo.edgame.com',
  role = 'teacher',
  first_name = 'Sarah',
  last_name = 'Johnson',
  school = schools:demo,
  created_at = time::now(),
  updated_at = time::now();

CREATE users:student_01 SET
  email = 'maria@demo.edgame.com',
  role = 'student',
  first_name = 'Maria',
  last_name = 'Santos',
  school = schools:demo,
  created_at = time::now(),
  updated_at = time::now();

CREATE users:student_02 SET
  email = 'ahmed@demo.edgame.com',
  role = 'student',
  first_name = 'Ahmed',
  last_name = 'Khan',
  school = schools:demo,
  created_at = time::now(),
  updated_at = time::now();

CREATE users:student_03 SET
  email = 'lina@demo.edgame.com',
  role = 'student',
  first_name = 'Lina',
  last_name = 'Chen',
  school = schools:demo,
  created_at = time::now(),
  updated_at = time::now();

CREATE users:student_04 SET
  email = 'omar@demo.edgame.com',
  role = 'student',
  first_name = 'Omar',
  last_name = 'Ali',
  school = schools:demo,
  created_at = time::now(),
  updated_at = time::now();

CREATE users:student_05 SET
  email = 'sofia@demo.edgame.com',
  role = 'student',
  first_name = 'Sofia',
  last_name = 'Petrov',
  school = schools:demo,
  created_at = time::now(),
  updated_at = time::now();

-- ============================================================
-- CLASS + MEMBERS
-- ============================================================

CREATE classes:math_p3 SET
  teacher = users:teacher_01,
  name = 'Period 3 Math',
  subject = 'math',
  grade_level = 7,
  join_code = 'MATH-P3-2026',
  is_active = true,
  created_at = time::now();

CREATE class_members:cm01 SET class = classes:math_p3, student = users:student_01, joined_at = time::now();
CREATE class_members:cm02 SET class = classes:math_p3, student = users:student_02, joined_at = time::now();
CREATE class_members:cm03 SET class = classes:math_p3, student = users:student_03, joined_at = time::now();
CREATE class_members:cm04 SET class = classes:math_p3, student = users:student_04, joined_at = time::now();
CREATE class_members:cm05 SET class = classes:math_p3, student = users:student_05, joined_at = time::now();

-- ============================================================
-- GAME ENVIRONMENT
-- ============================================================

CREATE game_environments:pulse_realms SET
  slug = 'pulse-realms',
  name = 'Pulse Realms',
  subject = 'mixed',
  grade_min = 3,
  grade_max = 8,
  description = '3v3 team arena where every attack, heal, and shield is gated behind a subject question.',
  config = {
    matchDurationSec: 300,
    questionTimeLimitSec: 8,
    baseXpPerQuestion: 25,
    respawnEnabled: false
  },
  is_active = true,
  created_at = time::now();

-- ============================================================
-- SAMPLE QUESTIONS (from PulseRealms question banks)
-- ============================================================

-- Math questions
CREATE questions:math_001 SET subject = 'math', topic = 'arithmetic', difficulty = 1, question_text = 'What is 9 + 6?', options = [{text: '13', isCorrect: false}, {text: '15', isCorrect: true}, {text: '16', isCorrect: false}, {text: '14', isCorrect: false}], correct_answer = '15', grade_level = 3, tags = ['addition'], created_at = time::now();

CREATE questions:math_002 SET subject = 'math', topic = 'arithmetic', difficulty = 1, question_text = 'What is 7 x 8?', options = [{text: '54', isCorrect: false}, {text: '56', isCorrect: true}, {text: '64', isCorrect: false}, {text: '48', isCorrect: false}], correct_answer = '56', grade_level = 3, tags = ['multiplication'], created_at = time::now();

CREATE questions:math_003 SET subject = 'math', topic = 'arithmetic', difficulty = 2, question_text = 'What is 144 divided by 12?', options = [{text: '10', isCorrect: false}, {text: '11', isCorrect: false}, {text: '12', isCorrect: true}, {text: '13', isCorrect: false}], correct_answer = '12', grade_level = 4, tags = ['division'], created_at = time::now();

CREATE questions:math_004 SET subject = 'math', topic = 'percentages', difficulty = 2, question_text = 'What is 15% of 200?', options = [{text: '20', isCorrect: false}, {text: '25', isCorrect: false}, {text: '30', isCorrect: true}, {text: '35', isCorrect: false}], correct_answer = '30', grade_level = 5, tags = ['percentages'], created_at = time::now();

CREATE questions:math_005 SET subject = 'math', topic = 'algebra', difficulty = 3, question_text = 'Solve: 3(x + 2) = 18', options = [{text: 'x = 2', isCorrect: false}, {text: 'x = 4', isCorrect: true}, {text: 'x = 6', isCorrect: false}, {text: 'x = 8', isCorrect: false}], correct_answer = 'x = 4', grade_level = 6, tags = ['algebra', 'equations'], created_at = time::now();

CREATE questions:math_006 SET subject = 'math', topic = 'roots', difficulty = 3, question_text = 'The square root of 169 is:', options = [{text: '11', isCorrect: false}, {text: '12', isCorrect: false}, {text: '13', isCorrect: true}, {text: '14', isCorrect: false}], correct_answer = '13', grade_level = 6, tags = ['square roots'], created_at = time::now();

CREATE questions:math_007 SET subject = 'math', topic = 'geometry', difficulty = 4, question_text = 'What is the slope of a line through (1,2) and (5,10)?', options = [{text: '1', isCorrect: false}, {text: '2', isCorrect: true}, {text: '3', isCorrect: false}, {text: '4', isCorrect: false}], correct_answer = '2', grade_level = 7, tags = ['slope', 'geometry'], created_at = time::now();

CREATE questions:math_008 SET subject = 'math', topic = 'geometry', difficulty = 4, question_text = 'What is the area of a triangle with base 10 and height 6?', options = [{text: '60', isCorrect: false}, {text: '30', isCorrect: true}, {text: '16', isCorrect: false}, {text: '20', isCorrect: false}], correct_answer = '30', grade_level = 7, tags = ['area', 'triangles'], created_at = time::now();

CREATE questions:math_009 SET subject = 'math', topic = 'functions', difficulty = 5, question_text = 'If f(x)=2x^2-3x+1, what is f(3)?', options = [{text: '8', isCorrect: false}, {text: '10', isCorrect: true}, {text: '12', isCorrect: false}, {text: '14', isCorrect: false}], correct_answer = '10', grade_level = 8, tags = ['functions', 'quadratic'], created_at = time::now();

CREATE questions:math_010 SET subject = 'math', topic = 'calculus', difficulty = 5, question_text = 'What is the derivative of x^3?', options = [{text: 'x^2', isCorrect: false}, {text: '2x', isCorrect: false}, {text: '3x^2', isCorrect: true}, {text: '3x', isCorrect: false}], correct_answer = '3x^2', grade_level = 8, tags = ['derivatives', 'calculus'], created_at = time::now();

-- Science questions (sample)
CREATE questions:sci_001 SET subject = 'science', topic = 'biology', difficulty = 1, question_text = 'What gas do plants absorb from the air?', options = [{text: 'Oxygen', isCorrect: false}, {text: 'Carbon dioxide', isCorrect: true}, {text: 'Nitrogen', isCorrect: false}, {text: 'Hydrogen', isCorrect: false}], correct_answer = 'Carbon dioxide', grade_level = 4, tags = ['photosynthesis'], created_at = time::now();

CREATE questions:sci_002 SET subject = 'science', topic = 'physics', difficulty = 2, question_text = 'What is the unit of force?', options = [{text: 'Watt', isCorrect: false}, {text: 'Joule', isCorrect: false}, {text: 'Newton', isCorrect: true}, {text: 'Pascal', isCorrect: false}], correct_answer = 'Newton', grade_level = 6, tags = ['forces', 'units'], created_at = time::now();

CREATE questions:sci_003 SET subject = 'science', topic = 'chemistry', difficulty = 3, question_text = 'What is the chemical symbol for gold?', options = [{text: 'Go', isCorrect: false}, {text: 'Gd', isCorrect: false}, {text: 'Au', isCorrect: true}, {text: 'Ag', isCorrect: false}], correct_answer = 'Au', grade_level = 7, tags = ['elements', 'periodic table'], created_at = time::now();

-- General questions (sample)
CREATE questions:gen_001 SET subject = 'general', topic = 'logic', difficulty = 2, question_text = 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?', options = [{text: 'Yes', isCorrect: true}, {text: 'No', isCorrect: false}, {text: 'Maybe', isCorrect: false}, {text: 'Cannot determine', isCorrect: false}], correct_answer = 'Yes', grade_level = 5, tags = ['logic', 'reasoning'], created_at = time::now();

-- ============================================================
-- SAMPLE ASSIGNMENT
-- ============================================================

CREATE assignments:assign_01 SET
  teacher = users:teacher_01,
  environment = game_environments:pulse_realms,
  class = classes:math_p3,
  title = 'Fractions Practice — Week 1',
  instructions = 'Complete at least 3 matches to practice fractions.',
  due_at = '2026-03-21T23:59:00Z',
  config = { subject: 'math', difficulty: 3, matchCount: 3 },
  created_at = time::now();
