# Database Schema Document
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.1
**Based on:** NPC_PRD.md, NPC_SRS.md, NPC_Architecture.md
**Database:** MongoDB Atlas (Mongoose ODM recommended for schema enforcement in an otherwise schema-less DB)

---

## 1. Conventions

- All collections include `createdAt` / `updatedAt` timestamps (Mongoose `timestamps: true`).
- All `_id` references below are MongoDB ObjectIds unless noted.
- Soft-delete pattern used where the SRS requires preserving history (e.g., `isActive: false` instead of hard delete) — specifically for Students (STU-5) and Batches (BATCH-2).
- Field names are illustrative; agents should treat types/relationships as authoritative, exact naming can be adjusted for code-style consistency as long as it matches this structure.

---

## 2. Collections

### 2.1 `users` (covers both student and admin — single collection, discriminated by role)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `role` | enum: `student`, `admin` | Set at creation, not user-editable |
| `fullName` | String | |
| `username` | String, unique, indexed | Auto-generated for students (STU-2, formula: `npc` + first 4 letters of name + 2-digit batch year + 2-digit sequence); admin username set manually |
| `passwordHash` | String | bcrypt hash, never plaintext (AUTH-6) |
| `batchId` | ObjectId → `batches` | **Required for `student` role only**; null/absent for admin |
| `class` | enum: `XI`, `XII` | Student only |
| `isActive` | Boolean, default `true` | Deactivation flag (STU-5), not deletion |
| `lastPasswordResetAt` | Date | For admin audit trail (STU-4) |
| `createdAt`, `updatedAt` | Date | |

**Indexes:** unique index on `username`; index on `batchId` for fast batch-scoped queries.

---

### 2.2 `batches`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | e.g., "XI-NEET Evening 2026" |
| `class` | enum: `XI`, `XII` | |
| `stream` | enum: `JEE`, `NEET`, `Foundation` | Determines default subject set (MAT-2) |
| `timingLabel` | String | Free text, e.g., "Morning", "Evening" |
| `isActive` | Boolean, default `true` | Archive flag (BATCH-2), not deletion |
| `createdAt`, `updatedAt` | Date | |

---

### 2.3 `subjects`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | e.g., "Physics", "Chemistry", "Biology", "Mathematics" |
| `applicableStreams` | Array of enum (`JEE`,`NEET`,`Foundation`) | Determines which batches see this subject (MAT-2) |

Note: kept as its own small collection (rather than a hardcoded enum) so admin can adjust the subject set for Foundation batches without a code change.

---

### 2.4 `chapters`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `subjectId` | ObjectId → `subjects` | |
| `class` | enum: `XI`, `XII` | A chapter belongs to a specific class + subject combination |
| `name` | String | e.g., "Kinematics" |
| `order` | Number | For sequencing chapters in the UI |

---

### 2.5 `materials`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `chapterId` | ObjectId → `chapters` | Implements the Class→Subject→Chapter→Item hierarchy (MAT-1) via chapter's own class/subject linkage |
| `title` | String | |
| `type` | enum: `pdf`, `video`, `note` | (MAT-3) |
| `fileUrl` | String | Cloudinary URL for `pdf`; YouTube URL for `video`; null for `note` |
| `noteContent` | String | Plain text/markdown, only for `type: note` |
| `uploadedBy` | ObjectId → `users` (admin) | |
| `createdAt`, `updatedAt` | Date | |

---

### 2.6 `pyqs`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `class` | enum: `XI`, `XII` | Class target |
| `examType` | enum: `JEE`, `NEET` | Exam target |
| `subjectId` | ObjectId → `subjects` | |
| `chapterId` | ObjectId → `chapters`, optional | Optional tagging per PYQ-1 |
| `year` | Number | e.g., 2024 |
| `title` | String | e.g., "NEET 2024 Physics — Full Paper" |
| `fileUrl` | String | Cloudinary URL |
| `uploadedBy` | ObjectId → `users` (admin) | |

---

### 2.7 `tests`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `title` | String | |
| `subjectIds` | Array of ObjectId → `subjects` | A test may span one or more subjects |
| `batchIds` | Array of ObjectId → `batches` | Target batch(es) (BATCH-4) |
| `questions` | Array of embedded `Question` objects (see below) | Embedded, not a separate collection — questions don't need independent querying outside their test |
| `scheduledAt` | Date | Scheduled start time |
| `durationMinutes` | Number | Duration in minutes (end time computed as scheduledAt + durationMinutes) |
| `negativeMarkingRatio` | Number, default `0.25` | Configurable per test (TEST-5), e.g. 0.25 for -25% |
| `isReopened` | Boolean, default `false` | Set true if admin explicitly allows retake (TEST-7 exception) |
| `createdBy` | ObjectId → `users` (admin) | |
| `createdAt`, `updatedAt` | Date | |

**Embedded `Question` object:**

| Field | Type | Notes |
|---|---|---|
| `id` | String (short local id within the test, e.g. `q1`) | Question identifier |
| `text` | String | |
| `options` | Array of 4 Strings | |
| `correctOptionIndex` | Number (0–3) | Never sent to frontend before submission |
| `marks` | Number | Full marks for this question when answered correctly |

---

### 2.8 `results`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `testId` | ObjectId → `tests` | |
| `studentId` | ObjectId → `users` | |
| `answers` | Array of { `id`: String, `selectedOptionIndex`: Number or null } | Raw submission |
| `score` | Number | Computed server-side (TEST-8) |
| `correctCount`, `incorrectCount`, `unattemptedCount` | Number | |
| `submittedAt` | Date | |
| `autoSubmitted` | Boolean | True if submitted via timer expiry (TEST-4) rather than manually |

**Indexes:** compound index on `(testId, studentId)` — unique, enforcing one attempt per student per test (TEST-7), and enabling fast ranking computation per test.

---

### 2.9 `notices`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `title` | String | |
| `body` | String | |
| `scope` | enum: `global`, `batch` | |
| `batchIds` | Array of ObjectId → `batches` | Only populated if `scope: batch` |
| `postedBy` | ObjectId → `users` (admin) | |
| `createdAt`, `updatedAt` | Date | |

---

### 2.10 `enquiries`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | |
| `phone` | String | |
| `classInterested` | enum: `XI`, `XII` | |
| `streamInterested` | enum: `JEE`, `NEET`, `Foundation` | |
| `message` | String, optional | Free-text message or details |
| `status` | enum: `new`, `contacted`, `closed`, default `new` | Lightweight CRM-style tracking for admin |
| `createdAt` | Date | |

---

### 2.11 `courses` (public-site course & fee offerings)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | e.g., "Class XI JEE Preparation" |
| `class` | enum: `XI`, `XII` | |
| `stream` | enum: `JEE`, `NEET`, `Foundation` | |
| `fee` | Number | Course fee amount |
| `description` | String | Course details/bullet points |
| `isActive` | Boolean, default `true` | |
| `createdAt`, `updatedAt` | Date | |

---

### 2.12 `testimonials` (public-site content, admin-curated — distinct from live student data per PUB-4)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `studentName` | String | Manually entered by admin, not linked to a live `users` record |
| `resultText` | String | e.g., "AIR 1200, NEET 2025" |
| `quote` | String | |
| `photoUrl` | String, optional | Cloudinary URL |
| `isPublished` | Boolean, default `true` | |

---

## 3. Relationship Summary

```
users (student) ──belongs to──> batches
batches ──has default subject set via──> stream (JEE/NEET/Foundation)
chapters ──belongs to──> subjects, scoped by class
materials ──belongs to──> chapters
pyqs ──tagged by──> class, examType, subjects (+ optional chapters)
tests ──targets──> batches, ──spans──> subjects, ──contains──> embedded questions
results ──references──> tests + users (student), unique per pair
notices ──targets──> batches or global
enquiries ──standalone, admin-only visibility──
courses ──standalone, public-facing, admin-editable──
testimonials ──standalone, public-facing, admin-curated──
```

---

## 4. Ranking Computation (derived, not stored redundantly)

Rankings (RANK-1 through RANK-5) are **computed on read**, not stored as a persistent leaderboard collection, to avoid data getting stale:

1. Query all `results` for a given `testId`.
2. Join with `users` to confirm each result's student is still in one of the test's assigned `batchIds` (handles edge case of a student moved batches after a test).
3. Sort by `score` descending; tiebreaker: fewer `incorrectCount`, then earlier `submittedAt`.
4. Assign rank position; top 3 flagged for crown badge styling, 4–10 flagged for plain listing, 11+ computed but only returned to that specific student (never in the general leaderboard payload) — enforcing RANK-4 at the API layer, not just the UI layer.

---

## 5. Dependencies Forward

This schema directly informs:
- **API Specification** — CRUD/query endpoints per collection above
- **Security & Data Privacy Document** — which fields are sensitive (passwordHash, phone, personal names) and how access is restricted per role
- **Agent Build Plan** — models/collections should be scaffolded first, in the order: `users`+`batches` → `subjects`+`chapters` → `materials`+`pyqs` → `tests`+`results` → `notices`+`enquiries` → `courses`+`testimonials`

---

*End of Database Schema Document v1.1 — updated per user decisions.*

