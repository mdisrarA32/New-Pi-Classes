# Software Requirements Specification (SRS)
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.0
**Based on:** NPC_PRD.md v1.0
**Status:** Draft for approval before development

---

## 1. Purpose & Scope

This document translates the PRD into precise functional and non-functional requirements, module by module, so that development (via Antigravity agents) has an unambiguous contract to build against. Every requirement below is numbered for traceability (e.g., referenced later in the Agent Build Plan and Test Plan).

Confirmed assumptions carried forward from the PRD:
- One batch per student (v1).
- Tests are MCQ-only.
- Video material hosting method: to be finalized in the Architecture Document (default recommendation: YouTube unlisted embeds, lowest cost/complexity).

---

## 2. System Roles

| Role | Access |
|---|---|
| `visitor` | Public site only, no auth |
| `student` | Student dashboard only, scoped to own batch/class data |
| `admin` | Full admin dashboard, all batches/students/content/tests |

No role escalation path exists in the UI — role is set at account creation time and only changeable directly in the database (manual, rare operation).

---

## 3. Functional Requirements

### 3.1 Authentication (AUTH)

- **AUTH-1**: The system shall provide a single Sign In page accepting username + password. No public registration page or link shall exist anywhere on the public site or student/admin dashboards.
- **AUTH-2**: On successful login, the system shall issue a JWT and redirect the user based on role: `student` → Student Dashboard, `admin` → Admin Dashboard.
- **AUTH-3**: On failed login, the system shall display a generic error ("Invalid username or password") without indicating whether the username exists, to avoid username enumeration.
- **AUTH-4**: The system shall rate-limit login attempts per username/IP (e.g., lock out after 5 failed attempts within 15 minutes) to mitigate brute-force attempts.
- **AUTH-5**: There shall be no student-facing "forgot password" flow. Password resets are performed exclusively by an admin via the Admin Dashboard (see ADM-4).
- **AUTH-6**: Passwords shall be stored hashed (bcrypt or equivalent), never in plaintext, including in logs.
- **AUTH-7**: JWT tokens shall have a defined expiry (e.g., 7 days) requiring re-login; no indefinite sessions.

### 3.2 Batch Management (BATCH)

- **BATCH-1**: Admin shall be able to create a batch with: name, class (XI/XII), stream (JEE/NEET/Foundation), timing/shift label (free text, e.g., "Morning").
- **BATCH-2**: Admin shall be able to edit or archive (not hard-delete) a batch.
- **BATCH-3**: Each student record shall reference exactly one batch (v1 constraint, per confirmed assumption).
- **BATCH-4**: Tests and Notices shall support targeting: a specific batch, multiple selected batches, or all batches ("global").

### 3.3 Student Management (STU)

- **STU-1**: Admin shall be able to create a student record with: full name, class, batch assignment.
- **STU-2**: On student creation, the system shall auto-generate a unique username (e.g., derived from name + numeric suffix to guarantee uniqueness) and either auto-generate or allow admin to set an initial password.
- **STU-3**: Admin shall be able to view a table of all students with columns: name, username, batch, status (active/inactive), and an action to reset password.
- **STU-4**: Password reset (STU-3 action) shall generate a new password immediately, displayed once to the admin (e.g., in a modal/toast), for the admin to relay to the student manually (WhatsApp/verbal) — the system shall not email/SMS it automatically in v1.
- **STU-5**: Admin shall be able to deactivate a student (e.g., left the institute) without deleting their historical test results.
- **STU-6**: Students shall not be able to self-edit their username; students may optionally be allowed to change their own password after login (open question — default: **not allowed in v1**, admin-only control, for simplicity and to match the confirmed access model).

### 3.4 Study Material (MAT)

- **MAT-1**: Study material shall be organized strictly as Class → Subject → Chapter → Material Item.
- **MAT-2**: Subjects available per class/stream: Physics, Chemistry, Mathematics (JEE-relevant batches), Biology (NEET-relevant batches). A Foundation batch may have a simplified subject set — configurable by admin, not hardcoded.
- **MAT-3**: Each Material Item shall have a type (PDF, external video link/embed, or plain note/text) and belong to exactly one chapter.
- **MAT-4**: Admin shall be able to upload/add, edit, and remove material items.
- **MAT-5**: Students shall only see material belonging to their own class (and appropriate subject set per their batch's stream).
- **MAT-6**: PDF uploads shall be size-limited (e.g., 20MB per file, exact limit set in Architecture doc) and validated for file type server-side (not just by extension).

### 3.5 PYQ Bank (PYQ)

- **PYQ-1**: PYQs shall be tagged by subject and year at minimum; chapter tagging optional but recommended.
- **PYQ-2**: PYQs shall be browsable/filterable by year and subject, separate from (or clearly distinguished within) the regular study material section.
- **PYQ-3**: Upload/management follows the same admin-only model as MAT-4.

### 3.6 Tests & Auto-Grading (TEST)

- **TEST-1**: Admin shall be able to create a test with: title, subject(s), a set of MCQ questions (each with 4 options and one correct answer), assigned batch(es), scheduled start time, end time/window, and duration (minutes).
- **TEST-2**: A test shall only become visible/attemptable to a student when the current time falls within its scheduled window and the student's batch is assigned to it.
- **TEST-3**: During an attempt, the system shall display a running countdown timer and allow navigation between questions (mark for review, skip, jump to question).
- **TEST-4**: The system shall auto-submit the test when the timer expires, saving whatever has been answered at that point.
- **TEST-5**: Each test shall have a configurable negative marking scheme (default: full marks for correct, 0 for unattempted, -25% of the question's marks for incorrect — matching NEET/JEE convention), set at test-creation time by admin, not hardcoded globally.
- **TEST-6**: Upon submission (manual or auto), the system shall immediately compute and display: total score, correct/incorrect/unattempted counts, and a per-question answer review (student's answer vs. correct answer).
- **TEST-7**: A student shall be able to attempt a given test only once (v1 constraint, unless admin explicitly reopens it).
- **TEST-8**: All grading shall be computed server-side; the frontend shall never be trusted to self-report a score.

### 3.7 Rankings (RANK)

- **RANK-1**: For each completed test, the system shall compute a ranking of all students in the assigned batch(es) who attempted it, ordered by score (ties broken by, e.g., fewer wrong answers or earlier submission time — exact tiebreaker confirmed in Architecture/DB doc).
- **RANK-2**: Rank 1, 2, and 3 shall be visually distinguished with gold, silver, and bronze crown badges respectively.
- **RANK-3**: Ranks 4–10 shall be listed with plain name + score, no badge.
- **RANK-4**: Ranks beyond 10 shall not appear on the visible leaderboard, but the system shall always show the logged-in student their own exact rank and score, regardless of position.
- **RANK-5**: Rankings shall be scoped to the student's own batch only — no cross-batch or cross-class comparison.

### 3.8 AI Doubt-Solving Chatbot (BOT)

- **BOT-1**: The chatbot shall be accessible only from the student dashboard (a floating action button, not present on the public site or admin dashboard).
- **BOT-2**: The chatbot shall be scoped via system prompt to Physics, Chemistry, Biology, and Mathematics at XI/XII (JEE/NEET-relevant) level; it shall politely decline unrelated topics.
- **BOT-3**: The chatbot shall support two functions at minimum: answering a subject doubt, and generating a study note/summary on a requested topic.
- **BOT-4**: Chatbot conversations shall not be used to expose other students' data, admin data, or system internals under any prompt.
- **BOT-5**: The chatbot shall have reasonable rate limits per student per day to control API cost (exact number set in Architecture doc based on chosen provider's pricing).

### 3.9 Motivational Quote Banner (QUOTE)

- **QUOTE-1**: A curated quote bank (stored in DB or config, not hardcoded per-component) shall be maintained, mixing English and Hindi/Hinglish quotes themed around consistency, effort, and comebacks.
- **QUOTE-2**: On dashboard entry, the system shall show one quote, selected once per day per student (not re-randomized on every navigation within the same day).
- **QUOTE-3**: A manual "show another quote" action shall be available, without affecting the "once per day" default on next day's login.

### 3.10 Notices (NOTICE)

- **NOTICE-1**: Admin shall be able to post a notice with a title, body text, and target scope (global or specific batch(es)).
- **NOTICE-2**: Students shall see notices targeted to "global" or to their own batch, in reverse-chronological order.
- **NOTICE-3**: Admin shall be able to edit or delete a notice.

### 3.11 Public Site & Enquiries (PUB)

- **PUB-1**: The public Home page shall include: hero section, about NPC, batch/course listing, stats strip, results/testimonials, fee structure display, a demo-class request form, and a WhatsApp click-to-chat link.
- **PUB-2**: The demo-class request form shall capture at minimum: name, phone number, class/stream of interest — and store this as an Enquiry record visible in the Admin Dashboard.
- **PUB-3**: The public site shall be built with SEO best practices for local search intent (e.g., "JEE NEET coaching Sheohar") — semantic HTML, meta tags, appropriate heading structure — detailed further in the Architecture doc.
- **PUB-4**: No student or admin data (names, scores, personal info) shall be exposed on the public site — testimonials/results shown publicly must be pre-approved, admin-curated entries, separate from live student records.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1**: Dashboard pages should load within 2–3 seconds on a typical 4G mobile connection.
- **NFR-2**: The system should support at minimum concurrent access by a full batch (assume ~50–100 students) taking a scheduled test simultaneously without timeouts or grading errors.

### 4.2 Availability
- **NFR-3**: Target uptime is best-effort (this is a small regional deployment, not requiring formal SLA), but scheduled test windows should have no planned downtime/deployments during active hours.

### 4.3 Usability
- **NFR-4**: All screens must be mobile-first responsive; dashboard and test-taking screens must remain fully usable on small phone screens (assume majority of usage is mobile, not desktop).
- **NFR-5**: Glassmorphism/glow effects shall be reduced (higher contrast, less blur) on content-dense screens (study material, test-taking, chatbot) to preserve readability, per the PRD's design direction.

### 4.4 Security
- Detailed fully in the separate Security & Data Privacy Document. Summary requirements carried here for traceability:
- **NFR-6**: All traffic served over HTTPS only.
- **NFR-7**: Role-based access control enforced server-side on every protected route, not just hidden in the UI.
- **NFR-8**: All file uploads validated and scanned for type/size before storage.
- **NFR-9**: No personally identifiable student information exposed via public-facing API endpoints.

### 4.5 Maintainability
- **NFR-10**: Codebase organized by module (auth, batches, students, materials, tests, rankings, chatbot, notices, enquiries) mirroring this SRS's structure, to keep Antigravity agent build tasks cleanly separable.

---

## 5. Traceability Note

Each requirement ID above (e.g., `TEST-5`, `RANK-4`) will be referenced directly in:
- The **Database Schema** (which entities/fields satisfy which requirement)
- The **API Specification** (which endpoint satisfies which requirement)
- The **Agent Build Plan** (which build step implements which requirement, in what order)
- The **Test Plan** (what to manually verify before go-live)

---

*End of SRS v1.0 — ready for review before proceeding to the Architecture Document.*
