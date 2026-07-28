# API Specification
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.1
**Based on:** NPC_PRD.md, NPC_SRS.md, NPC_Architecture.md, NPC_Database_Schema.md, NPC_Security_Privacy.md
**Status:** Draft for approval before development

---

## 1. Purpose of This Document

This is the contract between backend and frontend — and, since this project is being built through Antigravity agent prompts, it's also the contract between different agent runs. Every endpoint below states its **method, path, auth requirement, request shape, response shape, and error cases**, so an agent building the frontend doesn't have to guess what an agent-built backend returns, and vice versa.

**Conventions used throughout:**
- Base URL: `/api`
- All request/response bodies are JSON unless noted (file uploads use `multipart/form-data`)
- Auth is via JWT stored and transmitted exclusively in an `httpOnly` cookie set server-side on login and sent automatically by the browser on subsequent requests
- `role` is one of `student` | `admin`, enforced server-side per Security doc Section 3 — every protected route below states which role(s) may call it
- Standard error shape for all endpoints:
```json
{
  "success": false,
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human-readable message"
  }
}
```
- Standard success shape:
```json
{
  "success": true,
  "data": { }
}
```
- Timestamps are ISO 8601 strings
- IDs are MongoDB ObjectId strings

---

## 2. Auth Module

### 2.1 `POST /api/auth/login`
Single login endpoint for both students and admin — role is determined by the account, not by the request. Sets `httpOnly` cookie upon successful authentication.

**Auth:** None (public)

**Request:**
```json
{ "username": "string", "password": "string" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "role": "student | admin",
      "batchId": "string | null"
    }
  }
}
```

**Errors:**
- `401 INVALID_CREDENTIALS` — wrong username/password
- `429 RATE_LIMITED` — too many failed attempts (per Security doc Section 3, AUTH-4)

### 2.2 `POST /api/auth/logout`
**Auth:** Student or Admin
Clears the `httpOnly` authentication cookie.

**Response `200`:** `{ "success": true }`

### 2.3 `GET /api/auth/me`
Returns the currently logged-in user, for session rehydration on page load.

**Auth:** Student or Admin

**Response `200`:**
```json
{ "success": true, "data": { "id": "string", "name": "string", "role": "student | admin", "batchId": "string | null" } }
```

> Note: there is intentionally **no** `/api/auth/register`, `/api/auth/forgot-password`, or `/api/auth/reset-password` endpoint. Per SRS AUTH-1 and AUTH-5, accounts are created only by admin, and password resets are an admin action (Section 3 below) — this is a deliberate scope decision, not a gap.

---

## 3. Admin — Student Management

All endpoints in this section: **Auth: Admin only**

### 3.1 `POST /api/admin/students`
Creates a student account. Username is auto-generated server-side using the convention: lowercase `npc` + first 4 letters of student's first name + 2-digit batch year + 2-digit sequence number (e.g. `npcrahu2601`); admin sets the initial password.

**Request:**
```json
{
  "name": "string",
  "class": "XI | XII",
  "batchId": "string",
  "password": "string"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": { "id": "string", "name": "string", "username": "string", "class": "XI | XII", "batchId": "string" }
}
```

### 3.2 `GET /api/admin/students`
List/search students, filterable and paginated.

**Query params:** `?batchId=&class=&search=&page=&limit=`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "students": [ { "id": "string", "name": "string", "username": "string", "class": "string", "batchId": "string", "batchName": "string" } ],
    "total": 0, "page": 1, "limit": 20
  }
}
```

### 3.3 `GET /api/admin/students/:id`
Single student detail (for admin's student profile view).

### 3.4 `PATCH /api/admin/students/:id`
Edit name, class, or batch assignment.

**Request:** any subset of `{ "name": "string", "class": "string", "batchId": "string" }`

### 3.5 `POST /api/admin/students/:id/reset-password`
Regenerates/resets a student's password. Per Security doc Section 3, the plaintext password is returned **once**, in this response only, for the admin to note down/share — it is never stored or logged in plaintext, and never retrievable again after this response.

**Request:** `{ "newPassword": "string" }` (optional — if omitted, server auto-generates one)

**Response `200`:**
```json
{ "success": true, "data": { "username": "string", "newPassword": "string" } }
```

### 3.6 `DELETE /api/admin/students/:id`
Deactivates (soft-delete recommended over hard delete, to preserve historical test results/rankings integrity) a student account.

---

## 4. Admin — Batch Management

**Auth: Admin only** for all writes; batches are also read by students (Section 8).

### 4.1 `POST /api/admin/batches`
```json
{ "name": "string (e.g. XI-NEET Morning)", "class": "XI | XII", "stream": "JEE | NEET | Foundation" }
```

### 4.2 `GET /api/admin/batches`
Returns all batches with student counts.

### 4.3 `PATCH /api/admin/batches/:id`
Edit batch name/details.

### 4.4 `DELETE /api/admin/batches/:id`
Only permitted if no students/tests reference it, or cascades per Database Schema doc rules — confirm behavior in that doc rather than assuming here.

---

## 5. Study Material (Class → Subject → Chapter)

### 5.1 `POST /api/admin/materials` — **Auth: Admin only**
Uploads a file (multipart) to Cloudinary and creates the material record.

**Request (multipart/form-data):**
```
file: <binary>
class: "XI | XII"
subject: "Physics | Chemistry | Biology | Mathematics"
chapter: "string"
title: "string"
type: "pdf | video-link"
videoUrl: "string (if type=video-link)"
```

**Response `201`:**
```json
{ "success": true, "data": { "id": "string", "title": "string", "class": "string", "subject": "string", "chapter": "string", "fileUrl": "string", "type": "string" } }
```

**Errors:** `400 INVALID_FILE_TYPE`, `413 FILE_TOO_LARGE` (per Security doc Section 6 — server-side MIME validation and size limit, not just extension check)

### 5.2 `GET /api/materials` — **Auth: Student or Admin**
Students see only material for their own class; admin can filter freely.

**Query params:** `?class=&subject=&chapter=`

**Response `200`:**
```json
{ "success": true, "data": { "materials": [ { "id": "string", "title": "string", "subject": "string", "chapter": "string", "fileUrl": "string", "type": "string" } ] } }
```

### 5.3 `DELETE /api/admin/materials/:id` — **Auth: Admin only**

---

## 6. PYQ Bank

Mirrors the Study Material shape but tagged by year, class, and exam type.

### 6.1 `POST /api/admin/pyqs` — **Auth: Admin only**
```
file: <binary>
class: "XI | XII"
subject: "string"
year: "number"
examType: "JEE | NEET"
```

### 6.2 `GET /api/pyqs` — **Auth: Student or Admin**
**Query params:** `?class=&subject=&year=&examType=`

### 6.3 `DELETE /api/admin/pyqs/:id` — **Auth: Admin only**

---

## 7. Tests

### 7.1 `POST /api/admin/tests` — **Auth: Admin only**
Creates a test shell and its questions in one call.

**Request:**
```json
{
  "title": "string",
  "batchId": "string",
  "subject": "string",
  "scheduledAt": "ISO 8601",
  "durationMinutes": 60,
  "negativeMarkingRatio": 0.25,
  "questions": [
    {
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0,
      "marks": 4
    }
  ]
}
```

**Response `201`:** returns the created test with its `id`, without exposing `correctOptionIndex` in any endpoint students can call (enforced by using separate response serializers for admin vs student views — see 7.3).

### 7.2 `GET /api/admin/tests` — **Auth: Admin only**
List all tests, filterable by batch/status (`scheduled | live | completed`).

### 7.3 `GET /api/tests` — **Auth: Student**
Returns tests scheduled for the logged-in student's batch **only** — status computed server-side (`upcoming | active | completed`) based on `scheduledAt` + `durationMinutes` vs current server time. Question `correctOptionIndex` and `marks`-per-question breakdown are **never** included in this response before the student has submitted (prevents answer leakage via API inspection).

### 7.4 `GET /api/tests/:id/attempt` — **Auth: Student**
Fetches test questions for an active test the student is eligible to take (batch-scoped, time-window-checked server-side, not just client-side).

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "string", "title": "string", "durationMinutes": 60,
    "questions": [ { "id": "string", "text": "string", "options": ["string"] } ]
  }
}
```
(No `correctOptionIndex` in this response.)

### 7.5 `POST /api/tests/:id/submit` — **Auth: Student**
```json
{ "answers": [ { "id": "string", "selectedOptionIndex": 0 } ] }
```

Server computes score using `negativeMarkingRatio`, persists a `Result` record, and rejects late/duplicate submissions server-side (a student cannot submit twice, or submit after the time window closes, regardless of what the client sends).

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "score": 0, "maxScore": 0, "correctCount": 0, "wrongCount": 0, "unattemptedCount": 0,
    "review": [ { "id": "string", "selectedOptionIndex": 0, "correctOptionIndex": 0, "isCorrect": true } ]
  }
}
```

### 7.6 `GET /api/tests/:id/result` — **Auth: Student**
Fetch own result + answer review for a completed test (own record only — enforced server-side, not by hiding the button client-side).

### 7.7 `GET /api/admin/tests/:id/results` — **Auth: Admin only**
All students' results for a given test, for admin review.

---

## 8. Rankings

### 8.1 `GET /api/tests/:id/rankings` — **Auth: Student**
Batch-scoped leaderboard for one test (per Security doc Section 4 — never exposed publicly, only within the student's own batch).

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "top10": [ { "rank": 1, "name": "string", "score": 0, "badge": "gold | silver | bronze | null" } ],
    "myRank": { "rank": 0, "score": 0 }
  }
}
```

`badge` is `gold` for rank 1, `silver` for rank 2, `bronze` for rank 3, `null` for ranks 4–10 — computed server-side so frontend just renders whatever is sent, no client-side rank-to-badge logic to keep in sync.

---

## 9. Notices

### 9.1 `POST /api/admin/notices` — **Auth: Admin only**
```json
{ "title": "string", "body": "string", "batchId": "string | null" }
```
`batchId: null` means the notice is visible to all batches.

### 9.2 `GET /api/notices` — **Auth: Student or Admin**
Students see notices where `batchId` matches their own or is `null`.

### 9.3 `DELETE /api/admin/notices/:id` — **Auth: Admin only**

---

## 10. Public Site — Enquiries

### 10.1 `POST /api/enquiries` — **Auth: None (public)**
```json
{
  "name": "string",
  "phone": "string",
  "classInterested": "XI | XII",
  "streamInterested": "JEE | NEET | Foundation",
  "message": "string (optional)"
}
```
Basic server-side validation (non-empty name/phone, phone format) — this is the one fully public write endpoint in the system, so it should also carry basic spam protection (e.g., simple rate-limit by IP) per Security doc principles.

### 10.2 `GET /api/admin/enquiries` — **Auth: Admin only**
List/search enquiries, filterable by status (`new | contacted | closed`).

### 10.3 `PATCH /api/admin/enquiries/:id` — **Auth: Admin only**
```json
{ "status": "new | contacted | closed" }
```

---

## 11. AI Chatbot

### 11.1 `POST /api/chatbot/message` — **Auth: Student only**
Server-side proxy to Groq — API key never reaches the browser (Security doc Section 7).

**Request:**
```json
{ "message": "string", "conversationId": "string | null" }
```

**Response `200`:**
```json
{ "success": true, "data": { "conversationId": "string", "reply": "string" } }
```

**Errors:**
- `429 RATE_LIMITED` — daily per-student cap exceeded (BOT-5)
- `403 OUT_OF_SCOPE` (optional) — system prompt handles scoping to Physics/Chem/Bio/Maths.

---

## 12. Testimonials (Public, Admin-Curated)

Per Security doc Section 4 (PUB-4), this is a **separate collection** from live student records — never auto-pulled from `results`.

### 12.1 `POST /api/admin/testimonials` — **Auth: Admin only**
```json
{ "studentName": "string", "achievement": "string (e.g. AIR 342, NEET 2026)", "quote": "string", "photoUrl": "string (optional)" }
```

### 12.2 `GET /api/testimonials` — **Auth: None (public)**
Returns published testimonials for the homepage.

### 12.3 `PATCH /api/admin/testimonials/:id` / `DELETE /api/admin/testimonials/:id` — **Auth: Admin only**

---

## 13. Courses/Fees (Public Marketing Content)

Simple content endpoints for the marketing site's course and fee display.

### 13.1 `GET /api/courses` — **Auth: None**
Returns batch/stream cards with fee info for the public Courses page.

### 13.2 `POST /api/admin/courses` / `PATCH /api/admin/courses/:id` — **Auth: Admin only**
```json
{ "name": "string", "class": "XI | XII", "stream": "JEE | NEET | Foundation", "fee": "number", "description": "string" }
```

---

## 14. Error Code Reference

| Code | HTTP Status | Meaning |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `UNAUTHORIZED` | 401 | Missing/invalid token cookie |
| `FORBIDDEN` | 403 | Valid token, wrong role for this route |
| `NOT_FOUND` | 404 | Resource doesn't exist or isn't accessible to this user |
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `INVALID_FILE_TYPE` | 400 | Upload failed server-side MIME check |
| `FILE_TOO_LARGE` | 413 | Upload exceeds size limit |
| `RATE_LIMITED` | 429 | Too many requests (login attempts or chatbot messages) |
| `TEST_WINDOW_CLOSED` | 400 | Attempt/submit outside the test's scheduled time window |
| `ALREADY_SUBMITTED` | 400 | Duplicate test submission attempt |
| `SERVER_ERROR` | 500 | Unhandled error |

---

## 15. Dependencies Forward

This document informs:
- **UI/UX Design Spec** — every screen's data needs map to a `GET` endpoint above
- **Agent Build Plan** — natural build order: Auth → Admin Student/Batch Management → Materials/PYQ → Tests/Rankings → Notices/Enquiries/Testimonials/Courses → Chatbot
- **Test Plan** — QA cases for error codes and role protection

---

*End of API Specification v1.1 — updated per user decisions.*

