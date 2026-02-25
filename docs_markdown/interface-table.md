# EdGame – Interface Table v2.0

**Document Version:** 2.0  
**Status:** Phase 1 Complete, Phase 2+ Marked  
**Last Updated:** February 2026

This document specifies all system interfaces including data formats, timing requirements, and failure handling. **Phase 1 interfaces are required for MVP; Phase 2+ interfaces are planned but not implemented initially.**

---

## 1. Authentication APIs (Supabase-Managed)

Supabase Auth handles authentication. These endpoints are managed by Supabase — we configure, not implement.

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `/auth/v1/signup` | POST | **P1** | Register new user | `{ email, password, data: { role, first_name, last_name } }` | `{ user, session }` | <300ms | 400 Validation, 422 Duplicate |
| `/auth/v1/token?grant_type=password` | POST | **P1** | Login with password | `{ email, password }` | `{ access_token, refresh_token, user }` | <200ms | 400 Invalid credentials |
| `/auth/v1/token?grant_type=refresh_token` | POST | **P1** | Refresh access token | `{ refresh_token }` | `{ access_token, refresh_token }` | <100ms | 401 Invalid/expired token |
| `/auth/v1/logout` | POST | **P1** | Logout user | `{ }` (requires auth header) | `{ }` | <100ms | 204 always |
| `/auth/v1/recover` | POST | **P1** | Request password reset | `{ email }` | `{ }` | <200ms | 200 always (no email enumeration) |
| `/auth/v1/otp` | POST | **P1** | Magic link login | `{ email }` | `{ }` | <300ms | 200 always |
| `/auth/v1/authorize?provider=google` | GET | **P1** | Google OAuth redirect | Query params | 302 Redirect | <100ms | 400 Invalid provider |
| `/auth/v1/authorize?provider=microsoft` | GET | **P2** | Microsoft OAuth redirect | Query params | 302 Redirect | <100ms | 400 Invalid provider |

---

## 2. Game Environment APIs

### 2.1 Environment Management

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/environments` | GET | **P1** | List available environments | Query: `?subject=math&grade=6` | `{ environments: [...] }` | <150ms | 200 always (empty array if none) |
| `GET /api/environments/[slug]` | GET | **P1** | Get environment details | Path param: slug | `{ id, slug, name, subject, config, ... }` | <100ms | 404 Not found |
| `GET /api/environments/[slug]/config` | GET | **P1** | Get game configuration | Path param: slug | `{ levels, assets, standards, ... }` | <150ms | 404 Not found |
| `POST /api/environments` | POST | **P3** | Create custom environment (admin) | `{ name, subject, config }` | `{ id, slug }` | <300ms | 403 Forbidden, 400 Validation |
| `PUT /api/environments/[slug]` | PUT | **P3** | Update environment (admin) | `{ name, config, is_active }` | `{ environment }` | <200ms | 404 Not found, 403 Forbidden |

### 2.2 Game Sessions

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `POST /api/sessions` | POST | **P1** | Start new game session | `{ environment_id, assignment_id? }` | `{ session_id, config, resume_state? }` | <200ms | 403 If no access, 404 Environment not found |
| `PATCH /api/sessions/[id]` | PATCH | **P1** | Update session (events, completion) | `{ events: [...], completed?, score? }` | `{ status: 'ok', events_received }` | <150ms | 404 Not found, 400 Invalid events |
| `POST /api/sessions/[id]/end` | POST | **P1** | End session, trigger metrics computation | `{ final_score, completed }` | `{ session_id, computed_metrics }` | <500ms | 404 Not found |
| `GET /api/sessions/[id]` | GET | **P1** | Get session details | Path param: id | `{ session, events, metrics }` | <200ms | 404 Not found, 403 Not authorized |
| `GET /api/sessions` | GET | **P1** | List user's sessions | Query: `?limit=20&offset=0` | `{ sessions: [...], total }` | <200ms | 200 always |

---

## 3. Assignment APIs

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/assignments` | GET | **P1** | List assignments (teacher: own, student: assigned) | Query: `?status=active` | `{ assignments: [...] }` | <200ms | 200 always |
| `POST /api/assignments` | POST | **P1** | Create assignment | `{ environment_id, class_id, title, due_at?, config? }` | `{ assignment }` | <200ms | 403 Not teacher, 400 Validation |
| `GET /api/assignments/[id]` | GET | **P1** | Get assignment details | Path param: id | `{ assignment, submissions_summary }` | <150ms | 404 Not found |
| `PUT /api/assignments/[id]` | PUT | **P1** | Update assignment | `{ title?, due_at?, config? }` | `{ assignment }` | <200ms | 404 Not found, 403 Not owner |
| `DELETE /api/assignments/[id]` | DELETE | **P1** | Delete assignment | Path param: id | `{ status: 'deleted' }` | <150ms | 404 Not found, 403 Not owner |
| `GET /api/assignments/[id]/submissions` | GET | **P1** | Get all student submissions | Path param: id | `{ submissions: [...] }` | <300ms | 403 Not teacher |
| `POST /api/assignments/[id]/duplicate` | POST | **P2** | Duplicate assignment | `{ new_class_id? }` | `{ assignment }` | <200ms | 403 Not owner |

---

## 4. Analytics APIs

### 4.1 Teacher Analytics

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/analytics/class/[id]` | GET | **P1** | Class-level analytics | Query: `?date_range=7d` | `{ summary, student_rankings, struggling, excelling }` | <400ms | 403 Not class teacher |
| `GET /api/analytics/class/[id]/insights` | GET | **P1** | Top 3 insights per student | Path param: class_id | `{ insights: [...] }` | <500ms | 403 Not class teacher |
| `GET /api/analytics/student/[id]` | GET | **P1** | Individual student analytics | Query: `?date_range=30d` | `{ metrics, concept_mastery, trends }` | <300ms | 403 Not student's teacher |
| `GET /api/analytics/student/[id]/timeline` | GET | **P2** | Detailed activity timeline | Query: `?start&end` | `{ events: [...] }` | <400ms | 403 Not authorized |
| `GET /api/analytics/environment/[slug]/class/[id]` | GET | **P2** | Class performance in specific environment | Path params | `{ summary, distribution }` | <400ms | 403 Not class teacher |

### 4.2 Student Analytics (Self-View)

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/me/progress` | GET | **P1** | Student's own progress | Query: `?environment=math-arena` | `{ mastery, recent_sessions, achievements }` | <200ms | 200 always |
| `GET /api/me/achievements` | GET | **P2** | Student badges/achievements | None | `{ achievements: [...] }` | <150ms | 200 always |

### 4.3 Admin Analytics

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/admin/school/[id]/analytics` | GET | **P2** | School-wide analytics | Query: `?date_range=30d` | `{ summary, class_comparison, trends }` | <800ms | 403 Not school admin |
| `GET /api/admin/school/[id]/talent` | GET | **P3** | Top performers for competitions | Query: `?subject=math&count=20` | `{ students: [...] }` | <600ms | 403 Not school admin |
| `GET /api/admin/district/[id]/analytics` | GET | **P3** | District-level analytics | Query: `?schools=[...]` | `{ summary, school_comparison }` | <1500ms | 403 Not district admin |

### 4.4 Parent Analytics

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/parent/child/[id]/summary` | GET | **P2** | Child's learning summary | Query: `?date_range=7d` | `{ summary, highlights, concerns }` | <300ms | 403 Not linked parent |
| `GET /api/parent/child/[id]/behavior` | GET | **P2** | Behavioral insights | Query: `?date_range=30d` | `{ collaboration, persistence, engagement }` | <400ms | 403 Not linked parent |

---

## 5. Class/Roster Management APIs

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/classes` | GET | **P1** | List teacher's classes | None | `{ classes: [...] }` | <150ms | 200 always |
| `POST /api/classes` | POST | **P1** | Create a class | `{ name, grade, subject }` | `{ class, join_code }` | <200ms | 403 Not teacher, 400 Validation |
| `GET /api/classes/[id]` | GET | **P1** | Get class details | Path param: id | `{ class, students, stats }` | <200ms | 404 Not found |
| `PUT /api/classes/[id]` | PUT | **P1** | Update class | `{ name?, archived? }` | `{ class }` | <150ms | 404 Not found, 403 Not owner |
| `DELETE /api/classes/[id]` | DELETE | **P1** | Archive class | Path param: id | `{ status: 'archived' }` | <150ms | 404 Not found |
| `POST /api/classes/[id]/students` | POST | **P1** | Add student to class | `{ email } or { join_code }` | `{ student }` | <200ms | 404 Student not found, 409 Already in class |
| `DELETE /api/classes/[id]/students/[student_id]` | DELETE | **P1** | Remove student from class | Path params | `{ status: 'removed' }` | <150ms | 404 Not found |
| `POST /api/classes/join` | POST | **P1** | Student joins via code | `{ join_code }` | `{ class }` | <200ms | 404 Invalid code, 409 Already member |

---

## 6. User Management APIs

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/me` | GET | **P1** | Get current user profile | None | `{ user, school?, subscription? }` | <100ms | 401 Not authenticated |
| `PUT /api/me` | PUT | **P1** | Update profile | `{ first_name?, last_name?, preferences? }` | `{ user }` | <150ms | 400 Validation |
| `GET /api/me/subscription` | GET | **P1** | Get subscription status | None | `{ plan, expires_at, features }` | <100ms | 200 always |
| `DELETE /api/me` | DELETE | **P1** | Delete account (GDPR) | `{ confirm: true }` | `{ status: 'scheduled' }` | <200ms | 400 Missing confirmation |
| `POST /api/me/export` | POST | **P2** | Request data export (GDPR) | None | `{ job_id, estimated_completion }` | <150ms | 429 Too many requests |

---

## 7. School/Organization APIs

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/schools/[id]` | GET | **P1** | Get school details | Path param: id | `{ school, license, stats }` | <150ms | 404 Not found |
| `PUT /api/schools/[id]` | PUT | **P2** | Update school info (admin) | `{ name?, config? }` | `{ school }` | <200ms | 403 Not admin |
| `GET /api/schools/[id]/teachers` | GET | **P2** | List school teachers | Path param: id | `{ teachers: [...] }` | <200ms | 403 Not admin |
| `POST /api/schools/[id]/invite` | POST | **P2** | Invite teacher to school | `{ email, role }` | `{ invitation }` | <300ms | 403 Not admin |

---

## 8. Integration APIs

### 8.1 LTI 1.3 (Google Classroom, Canvas, Schoology)

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/lti/jwks` | GET | **P1** | LTI public key set | None | `{ keys: [...] }` | <50ms | 200 always |
| `POST /api/lti/login` | POST | **P1** | LTI OIDC login initiation | LTI login params | 302 Redirect | <100ms | 400 Invalid params |
| `POST /api/lti/launch` | POST | **P1** | LTI resource launch | LTI launch params | 302 Redirect to game | <300ms | 400 Invalid JWT, 403 Unauthorized |
| `POST /api/lti/deep-link` | POST | **P1** | LTI deep linking (assignment creation) | LTI params | Deep link response | <200ms | 400 Invalid params |
| `POST /api/lti/grades` | POST | **P1** | Submit grade back to LMS | `{ session_id }` | `{ status }` | <500ms | 400 No LTI context, 502 LMS error |

### 8.2 Clever Integration

| Endpoint | Method | Phase | Description | Request | Response | Timing | Failure Handling |
|---|---|---|---|---|---|---|---|
| `GET /api/integrations/clever/callback` | GET | **P2** | Clever OAuth callback | Query params | 302 Redirect | <200ms | 400 Invalid state |
| `POST /api/integrations/clever/sync` | POST | **P2** | Sync rosters from Clever | `{ school_id }` | `{ synced_count, errors }` | <5000ms | 502 Clever API error |

### 8.3 Webhooks (Outbound)

| Event | Phase | Payload | Target |
|---|---|---|---|
| `session.completed` | **P2** | `{ session_id, student_id, score, metrics }` | School webhook URL |
| `assignment.due` | **P2** | `{ assignment_id, incomplete_students }` | Teacher notification |
| `student.struggling` | **P3** | `{ student_id, concept, recommendation }` | Parent notification |

---

## 9. WebSocket / Real-time APIs

### 9.1 Supabase Realtime (Phase 1)

| Channel | Phase | Events | Use Case |
|---|---|---|---|
| `class:{id}:activity` | **P1** | `{ student_id, action, timestamp }` | Live teacher dashboard |
| `session:{id}:progress` | **P1** | `{ progress, score }` | Parent watching child play |
| `assignment:{id}:submissions` | **P1** | `{ student_id, completed, score }` | Teacher sees submissions |

### 9.2 SpacetimeDB (Phase 2 - Multiplayer)

| Table/Reducer | Phase | Description | Sync Rate |
|---|---|---|---|
| `PlayerState` | **P2** | Real-time player position, score, status | 60 fps |
| `GameRoom` | **P2** | Room state, players, game phase | On change |
| `ChatMessage` | **P2** | In-game chat messages | Immediate |
| `move_player` | **P2** | Reducer: player movement | Client-triggered |
| `submit_answer` | **P2** | Reducer: answer submission | Client-triggered |
| `use_powerup` | **P2** | Reducer: power-up activation | Client-triggered |

---

## 10. Event Schema (Game Telemetry)

### 10.1 Base Event Structure

```typescript
interface GameEvent {
  id: string;                    // UUID
  session_id: string;            // Reference to session
  timestamp: number;             // Unix ms
  type: EventType;
  data: Record<string, unknown>;
}

type EventType =
  | 'session_start'
  | 'session_end'
  | 'question_presented'
  | 'question_answered'
  | 'hint_requested'
  | 'hint_viewed'
  | 'level_started'
  | 'level_completed'
  | 'achievement_earned'
  | 'error_made'
  | 'retry_attempted'
  | 'idle_detected'
  | 'focus_lost'
  | 'focus_regained';
```

### 10.2 Specific Event Examples

```typescript
// Question answered
{
  id: "evt_abc123",
  session_id: "sess_xyz789",
  timestamp: 1708444800000,
  type: "question_answered",
  data: {
    question_id: "q_001",
    concept: "fractions",
    standard: "CCSS.MATH.4.NF.A.1",
    presented_at: 1708444795000,
    answered_at: 1708444800000,
    response_time_ms: 5000,
    answer: "3/4",
    correct_answer: "3/4",
    is_correct: true,
    attempt_number: 1,
    hints_used: 0
  }
}

// Level completed
{
  id: "evt_def456",
  session_id: "sess_xyz789",
  timestamp: 1708445400000,
  type: "level_completed",
  data: {
    level_id: "level_3",
    duration_seconds: 180,
    questions_total: 10,
    questions_correct: 8,
    accuracy: 0.8,
    hints_used: 2,
    retries: 1,
    score: 850
  }
}
```

---

## 11. Error Response Format

All API errors follow consistent format:

```typescript
interface APIError {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: unknown;      // Additional context
    request_id: string;     // For support/debugging
  }
}
```

### 11.1 Standard Error Codes

| HTTP Status | Code | Description |
|---|---|---|
| 400 | `validation_error` | Request body/params invalid |
| 401 | `unauthorized` | Missing or invalid auth token |
| 403 | `forbidden` | User lacks permission |
| 404 | `not_found` | Resource doesn't exist |
| 409 | `conflict` | Resource already exists (duplicate) |
| 422 | `unprocessable` | Valid syntax but semantically wrong |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server error (retry safe) |
| 502 | `upstream_error` | Third-party service failed |
| 503 | `service_unavailable` | Temporarily unavailable |

---

## 12. Rate Limits

| Endpoint Category | Limit | Window | Authenticated Multiplier |
|---|---|---|---|
| Authentication | 10 | 1 min | N/A |
| Read (GET) | 100 | 1 min | 2x |
| Write (POST/PUT/DELETE) | 30 | 1 min | 2x |
| Analytics | 20 | 1 min | 3x |
| Game events | 60 | 1 min | N/A (batched) |
| Webhooks (inbound) | 100 | 1 min | N/A |

Rate limit headers returned:
- `X-RateLimit-Limit`: Max requests in window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when window resets

---

## Summary: Phase 1 Endpoint Count

| Category | P1 Endpoints | P2+ Endpoints |
|---|---|---|
| Authentication | 8 | 1 |
| Game Environments | 3 | 2 |
| Game Sessions | 5 | 0 |
| Assignments | 6 | 1 |
| Analytics (Teacher) | 3 | 2 |
| Analytics (Student) | 1 | 1 |
| Analytics (Admin) | 0 | 3 |
| Analytics (Parent) | 0 | 2 |
| Classes/Roster | 8 | 0 |
| User Management | 4 | 1 |
| School Management | 1 | 3 |
| LTI Integration | 5 | 0 |
| Clever Integration | 0 | 2 |
| **Total** | **44** | **18** |

**Note:** Phase 1 includes ~44 endpoints. This is intentionally focused — enough for a fully functional MVP without over-engineering. Phase 2+ adds ~18 endpoints for multiplayer, parent portal, admin analytics, and additional integrations.

---

*This interface table reflects the phased architecture. Phase 1 endpoints are required for MVP launch. Phase 2+ endpoints are documented for planning but not implemented until usage patterns justify the investment.*
