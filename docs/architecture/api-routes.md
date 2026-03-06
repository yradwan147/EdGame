# Phase 1 API Routes

All endpoints are Next.js Route Handlers deployed on Vercel Edge Functions.
Authentication via Supabase JWT (passed as `Authorization: Bearer <token>`).

## Auth

### `POST /api/auth/callback`
Supabase Auth callback handler (OAuth, magic link confirmation).

- **Auth:** Public
- **Response:** Redirect to dashboard or game

---

## Environments

### `GET /api/environments`
List available game environments.

- **Auth:** Teacher+
- **Response:**
```json
{
  "environments": [
    {
      "id": "uuid",
      "slug": "pulse-realms",
      "name": "Pulse Realms",
      "subject": "math",
      "gradeRange": [3, 8],
      "description": "3v3 team arena...",
      "thumbnailUrl": "/assets/pulse-realms-thumb.png",
      "config": {},
      "isActive": true
    }
  ]
}
```

---

## Assignments

### `GET /api/assignments`
List assignments for the authenticated teacher, or assigned-to for students.

- **Auth:** Teacher (own assignments) | Student (assigned to them)
- **Query:** `?classId=uuid&status=active`
- **Response:**
```json
{
  "assignments": [
    {
      "id": "uuid",
      "title": "Fractions Practice",
      "environmentId": "uuid",
      "environmentName": "Pulse Realms",
      "classId": "uuid",
      "className": "Period 3 Math",
      "instructions": "Complete 3 matches",
      "dueAt": "2026-03-14T23:59:00Z",
      "config": { "subject": "math", "difficulty": 3 },
      "createdAt": "2026-03-06T10:00:00Z"
    }
  ]
}
```

### `POST /api/assignments`
Create a new assignment.

- **Auth:** Teacher
- **Request:**
```json
{
  "title": "Fractions Practice",
  "environmentId": "uuid",
  "classId": "uuid",
  "instructions": "Complete 3 matches focusing on fractions",
  "dueAt": "2026-03-14T23:59:00Z",
  "config": { "subject": "math", "difficulty": 3, "matchCount": 3 }
}
```
- **Response:** `201` with created assignment object

### `GET /api/assignments/:id`
Get single assignment details.

- **Auth:** Teacher (owner) | Student (assigned)
- **Response:** Single assignment object (same shape as list item)

### `PUT /api/assignments/:id`
Update an assignment.

- **Auth:** Teacher (owner)
- **Request:** Partial assignment fields
- **Response:** Updated assignment object

### `DELETE /api/assignments/:id`
Delete an assignment.

- **Auth:** Teacher (owner)
- **Response:** `204 No Content`

---

## Sessions

### `POST /api/sessions`
Start a new game session.

- **Auth:** Student
- **Request:**
```json
{
  "assignmentId": "uuid",
  "environmentId": "uuid"
}
```
- **Response:**
```json
{
  "sessionId": "uuid",
  "startedAt": "2026-03-06T14:30:00Z"
}
```

### `PATCH /api/sessions/:id`
Update session with completion status. Called when game ends.

- **Auth:** Student (session owner)
- **Request:**
```json
{
  "completed": true,
  "score": 850,
  "durationSeconds": 312
}
```
- **Response:** Updated session object

### `GET /api/sessions/:id/metrics`
Get computed metrics for a session.

- **Auth:** Teacher (class owner)
- **Response:**
```json
{
  "sessionId": "uuid",
  "studentId": "uuid",
  "environmentId": "uuid",
  "metrics": {
    "d1_cognitive": {
      "correctnessRate": 0.75,
      "avgResponseTimeMs": 3200,
      "speedAccuracyProfile": "deliberate",
      "questionsAttempted": 12,
      "questionsCorrect": 9
    },
    "d2_engagement": {
      "totalTimeSeconds": 312,
      "actionCount": 28,
      "completionRate": 1.0
    },
    "d3_strategic": {
      "strategyClassification": "healer",
      "actionVariationIndex": 0.6,
      "roleChosen": "healer"
    },
    "d4_social": {
      "teammateInteractions": 8,
      "healActions": 5,
      "shieldActions": 3
    },
    "d5_sel": {
      "persistenceAfterFailure": 0.9,
      "frustrationScore": 0.2
    },
    "d6_temporal": {
      "responseConsistency": 450,
      "learningVelocity": 0.12
    }
  },
  "computedAt": "2026-03-06T14:36:00Z"
}
```

---

## Game Event Pipeline

### `POST /api/sessions/:id/events`
Batch-submit telemetry events from the game client. Called periodically during gameplay (every 10 seconds) and on session end.

- **Auth:** Student (session owner)
- **Request:**
```json
{
  "events": [
    {
      "type": "question_answered",
      "ts": 1741276200000,
      "payload": {
        "questionId": "q_frac_12",
        "subject": "math",
        "difficulty": 3,
        "correct": true,
        "responseTimeMs": 2800,
        "actionType": "attack",
        "powerMultiplier": 1.64
      }
    },
    {
      "type": "action_performed",
      "ts": 1741276201000,
      "payload": {
        "actionType": "attack",
        "role": "attacker",
        "targetId": "bot_enemy_1",
        "success": true,
        "value": 45,
        "effectType": "damage"
      }
    },
    {
      "type": "damage_taken",
      "ts": 1741276205000,
      "payload": {
        "amount": 30,
        "sourceId": "bot_enemy_2",
        "sourceRole": "attacker",
        "targetId": "player_1"
      }
    }
  ]
}
```
- **Response:** `202 Accepted` with count of events stored

---

## Analytics

### `GET /api/analytics/class/:id`
Class-level analytics dashboard data.

- **Auth:** Teacher (class owner)
- **Query:** `?from=2026-03-01&to=2026-03-07&environmentId=uuid`
- **Response:**
```json
{
  "classId": "uuid",
  "period": { "from": "2026-03-01", "to": "2026-03-07" },
  "summary": {
    "totalSessions": 142,
    "avgAccuracy": 0.72,
    "avgResponseTimeMs": 3400,
    "activeStudents": 28,
    "totalStudents": 30
  },
  "students": [
    {
      "studentId": "uuid",
      "name": "Maria S.",
      "sessionsCompleted": 5,
      "accuracy": 0.85,
      "avgResponseTimeMs": 2900,
      "trend": "improving"
    }
  ],
  "conceptBreakdown": [
    { "concept": "fractions", "classAccuracy": 0.68, "studentCount": 30 }
  ]
}
```

### `GET /api/analytics/student/:id`
Individual student analytics.

- **Auth:** Teacher (class owner)
- **Query:** `?from=2026-03-01&to=2026-03-07&classId=uuid`
- **Response:**
```json
{
  "studentId": "uuid",
  "name": "Maria S.",
  "period": { "from": "2026-03-01", "to": "2026-03-07" },
  "dimensions": {
    "d1_cognitive": {
      "overallAccuracy": 0.85,
      "avgResponseTimeMs": 2900,
      "profile": "deliberate",
      "conceptMastery": [
        { "concept": "fractions", "mastery": 0.9 },
        { "concept": "decimals", "mastery": 0.6 }
      ]
    },
    "d2_engagement": {
      "totalTimeMins": 45,
      "sessionCount": 5,
      "avgSessionMins": 9,
      "completionRate": 1.0,
      "trend": "stable"
    },
    "d3_strategic": {
      "preferredRole": "healer",
      "actionVariation": 0.6,
      "strategyShifts": 2
    },
    "d4_social": {
      "teammateInteractions": 42,
      "helpGiven": 12,
      "helpReceived": 3
    },
    "d5_sel": {
      "persistenceScore": 0.9,
      "frustrationLevel": "low",
      "growthMindsetIndicator": "strong"
    },
    "d6_temporal": {
      "learningVelocity": 0.12,
      "responseConsistency": "improving",
      "dailyAccuracy": [
        { "date": "2026-03-01", "accuracy": 0.7 },
        { "date": "2026-03-03", "accuracy": 0.8 },
        { "date": "2026-03-06", "accuracy": 0.85 }
      ]
    }
  }
}
```
