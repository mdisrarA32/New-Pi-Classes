# Agent Build Plan / Prompt Sequence
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.1
**Based on:** NPC_PRD.md, NPC_SRS.md, NPC_Architecture.md, NPC_Database_Schema.md, NPC_Security_Privacy.md, NPC_API_Specification.md, NPC_UIUX_Design_Spec.md
**Status:** Draft — updated per user decisions

---

## 1. Purpose of This Document

Antigravity agents build best when each prompt has a **narrow, well-bounded scope** and can reference documents you've already locked, rather than trying to re-explain the whole vision every time. This document breaks the build into ordered phases, each with a ready-to-paste prompt, so dependencies are respected (e.g., auth exists before anything protected by auth is built) and no phase re-does work an earlier phase already did.

**How to use this doc:** run phases in order. Don't start Phase N+1 until Phase N is working — Antigravity agents (like most coding agents) build more reliably on a foundation that already runs, rather than stacking unverified layers. After each phase, do a quick manual check (a short checklist is included per phase) before moving on.

**Before Phase 1:** upload the six prior documents (PRD, SRS, Architecture, Database Schema, Security & Privacy, API Specification, UI/UX Design Spec) into the Antigravity project/workspace context if it supports persistent project docs — this means every prompt below can say "per the API Specification" instead of re-pasting endpoint shapes each time.

---

## 2. Phase Overview

| Phase | What gets built | Depends on |
|---|---|---|
| 0 | Project scaffold + shared design tokens | — |
| 1 | Backend: DB models + Auth | 0 |
| 2 | Backend: Admin Student & Batch management | 1 |
| 3 | Backend: Materials, PYQ, Notices, Enquiries, Testimonials, Courses | 1 |
| 4 | Backend: Tests, Results, Rankings | 2, 3 |
| 5 | Backend: Chatbot proxy | 1 |
| 6 | Frontend: Public marketing site | 0, 3 |
| 7 | Frontend: Sign-in + auth wiring | 1, 6 |
| 8 | Frontend: Student dashboard (material, PYQ, notices) | 3, 7 |
| 9 | Frontend: Student dashboard (tests, results, rankings) | 4, 8 |
| 10 | Frontend: Chatbot widget | 5, 8 |
| 11 | Frontend: Admin dashboard (all modules) | 2–5, 7 |
| 12 | Polish, mobile QA, deploy | all above |

---

## 3. Phase Prompts

### Phase 0 — Project Scaffold + Design Tokens

```
Set up a monorepo-style project with two folders: /backend (Node.js + Express + 
TypeScript + MongoDB via Mongoose) and /frontend (Next.js 14 App Router + 
TypeScript + Tailwind CSS).

Backend: initialize with TypeScript config, folder structure (src/models, 
src/controllers, src/routes, src/middleware, src/config), .env.example with 
placeholders for MONGO_URI, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, 
CLOUDINARY_API_SECRET, GROQ_API_KEY. Set up CORS to only allow a configurable 
frontend origin. Do not implement any routes yet — just the scaffold, health 
check endpoint (GET /api/health), and error-handling middleware that returns 
the standard { success, error: { code, message } } shape.

Frontend: initialize with Tailwind, and create a global theme file (CSS 
variables or Tailwind config extension) implementing exactly the design tokens 
from the UI/UX Design Specification Section 2 — colors, font families (Fraunces, 
Inter, IBM Plex Mono via next/font), spacing scale, radius values, and shadow 
values. Do not build any pages yet beyond a placeholder home page that visually 
confirms the theme (a dark navy background with one glass card showing the 
gold button style and one light dashboard-style card, side by side, just to 
verify tokens render correctly).

Do not add authentication, database models, or any business logic yet — this 
phase is scaffold and design tokens only.
```

**Checklist before Phase 1:** backend health check responds, frontend renders with correct navy/gold/glass token preview, `.env.example` has all keys, no route logic exists yet.

---

### Phase 1 — Backend: DB Models + Auth

```
Using the Database Schema Document and Security & Privacy Document as the 
source of truth, implement the following Mongoose models: User (with role 
enum student/admin, hashed password via bcrypt, username, name, class, 
batchId reference), Batch (name, class, stream).

Implement auth per the API Specification Section 2 exactly: POST /api/auth/login, 
POST /api/auth/logout, GET /api/auth/me. Passwords must be bcrypt-hashed, never 
stored or logged in plaintext except the transient case in the password-reset 
response (not built yet, that's Phase 2). JWTs expire in 7 days and are signed 
with JWT_SECRET from env. Store the token in an httpOnly cookie.

Implement login rate limiting (lockout after 5 failed attempts per username 
within 15 minutes) per Security & Privacy Section 3.

Implement RBAC middleware (requireAuth, requireRole('admin')) that will be 
reused by every future protected route — this middleware must check the role 
server-side from the verified JWT payload, never from any client-supplied 
field.

Seed one admin account directly via a one-time seed script (not through any 
API route) per Security & Privacy Section 8 — do not expose any "create admin" 
endpoint anywhere.

Do not build any other routes yet.
```

**Checklist:** can log in as seeded admin via API client (Postman/curl), receive a valid JWT/cookie, `GET /api/auth/me` returns correct role, a 6th failed login attempt within 15 minutes is rate-limited, no admin-creation route exists in the codebase.

---

### Phase 2 — Backend: Admin Student & Batch Management

```
Implement all endpoints in API Specification Sections 3 and 4 exactly as 
specified: admin student CRUD including auto-generated usernames on creation, 
password reset that returns the plaintext password once in the response only, 
and batch CRUD. All routes in this phase require the admin role via the 
requireRole('admin') middleware from Phase 1 — verify a student-role JWT gets 
403 FORBIDDEN on every route here.

Username generation convention: lowercase "npc" + first 4 letters of student's 
first name (lowercase) + 2-digit batch year + 2-digit sequence number (e.g., 
Rahul enrolling in 2026 gets npcrahu2601) — implement a uniqueness check with 
sequence increment on collision.

Student deactivation (DELETE /api/admin/students/:id) should be a soft delete 
(isActive: false field) rather than a hard delete, to preserve result/ranking 
history integrity for later phases.
```

**Checklist:** admin can create a student and receive back a valid username; resetting a password returns it once and it's genuinely not retrievable via any other endpoint afterward; a student JWT gets 403 on all `/api/admin/*` routes tested so far.

---

### Phase 3 — Backend: Materials, PYQ, Notices, Enquiries, Testimonials, Courses

```
Implement API Specification Sections 5, 6, 9, 10, 12, and 13. File uploads 
(materials, PYQ) go to Cloudinary — never stored on the app server's own disk. 
Validate uploaded file type server-side by actual MIME type/magic bytes, not 
just file extension, and enforce a 20MB size limit server-side (not just in 
frontend). Reject any file type outside PDF/image, and accept an external URL 
field for video-type material instead of file upload.

Enquiries endpoint (POST /api/enquiries) is the one fully public write route 
in the system — add basic IP-based rate limiting to it as spam protection.

Testimonials must be their own collection, never auto-derived from student 
Result records, per Security & Privacy Section 4 — do not build any code path 
that reads from the results collection to populate testimonials.

All GET endpoints in this phase that are student-facing (materials, PYQ, 
notices) must filter server-side by the logged-in student's own class/batch — 
do not rely on frontend filtering for this.
```

**Checklist:** uploading a disguised non-PDF file as a "PDF" is rejected server-side; a student calling `GET /api/materials` only ever sees their own class's material even if they try changing the query param to another class; testimonials have no relationship field to the results collection in the schema.

---

### Phase 4 — Backend: Tests, Results, Rankings

```
Implement API Specification Section 7 (Tests) and Section 8 (Rankings) exactly. 
This is the most sensitive module — pay close attention to:

1. GET /api/tests and GET /api/tests/:id/attempt must never include 
   correctOptionIndex in the response to a student before submission.
2. The test time window (scheduledAt + durationMinutes) must be validated 
   server-side on both the attempt-fetch and submit endpoints — a student 
   must not be able to fetch or submit a test outside its window even by 
   calling the API directly with a valid token.
3. A student must not be able to submit the same test twice — enforce this 
   server-side with a uniqueness constraint or existence check on 
   (studentId, testId) in the results collection, not just a frontend 
   "already submitted" UI state.
4. Score calculation must apply the test's own negativeMarkingRatio exactly 
   as specified when the test was created — unattempted questions score zero, 
   not negative.
5. Rankings (GET /api/tests/:id/rankings) must be scoped to the requesting 
   student's own batch only, and must never be exposed via any endpoint 
   reachable without a valid student JWT.

Write these as the highest-scrutiny endpoints in the whole backend — this is 
where a determined student could try to cheat via direct API calls, so 
validate everything server-side regardless of what the frontend already 
prevents.
```

**Checklist:** manually attempt to call `/api/tests/:id/attempt` before `scheduledAt` and confirm rejection; manually POST a second submission to the same test as the same student and confirm rejection; manually inspect the `attempt` response payload and confirm no answer key is present; confirm a student in Batch A cannot fetch Batch B's rankings by changing the test ID in the URL to a test scheduled for Batch B (should 404, not just filter empty).

---

### Phase 5 — Backend: Chatbot Proxy

```
Implement API Specification Section 11. This is a server-side proxy to Groq — 
the GROQ_API_KEY must never be sent to or readable from the frontend/browser 
in any response, network payload, or client-side code. 

System prompt must scope the assistant strictly to Physics, Chemistry, 
Biology, and Mathematics topics relevant to Class XI/XII JEE/NEET/Foundation 
syllabus, per Security & Privacy Section 7 — write the system prompt to 
politely redirect off-topic questions back to academic subjects rather than 
answering them.

Implement per-student daily rate limiting (a reasonable cap — e.g., 50 messages/
day, adjust as needed) to control cost and reduce misuse.

Do not persist full conversation transcripts long-term or expose any admin-
facing endpoint to read a student's chatbot conversations, per Security & 
Privacy Section 4 — this is a study tool, not a monitoring tool. If any 
logging is added for rate-limit tracking, keep it to message counts/
timestamps only, not message content.
```

**Checklist:** confirm the Groq API key never appears in any network response inspectable from the browser; ask the chatbot a clearly off-topic question and confirm it redirects rather than answering; confirm no route exists anywhere that lets admin read a specific student's chat content.

---

### Phase 6 — Frontend: Public Marketing Site

```
Build the public marketing site per UI/UX Design Specification Section 8.1 and 
the full glass/glow treatment from Section 4 (this is the one part of the app 
that should be visually maximal per our theme). Pages: Home (navbar, hero with 
demo-request form wired to POST /api/enquiries, stats strip, course/batch 
cards from GET /api/courses, testimonials from GET /api/testimonials, fee 
cards, footer), Courses, Faculty, About.

Use the exact design tokens from the theme file built in Phase 0 — do not 
introduce new colors or fonts. Implement the navy gradient background with 
blurred glow orbs, full glass panels with 16px backdrop blur, gold shimmer 
CTA buttons, and section fade-in-on-scroll per UI/UX Design Spec Section 6.

Make this fully mobile-responsive and mobile-first per Section 5 — reduce 
backdrop blur to 8px on mobile viewports for performance. Include a WhatsApp 
click-to-chat button in the hero and footer (link format: 
https://wa.me/[NPC's WhatsApp number]).

Add basic on-page SEO: descriptive title/meta tags per page, semantic heading 
structure, targeting local search terms like "JEE NEET coaching Sheohar."
```

**Checklist:** site loads and looks correct on both desktop and a real mobile device (not just browser resize); enquiry form actually creates a record retrievable via the admin enquiries endpoint; WhatsApp button opens correctly on mobile.

---

### Phase 7 — Frontend: Sign-In + Auth Wiring

```
Build the sign-in page per UI/UX Design Spec Section 8.2 — centered glass card 
on the navy background, no signup link/option anywhere on this page or 
reachable from it. Wire it to POST /api/auth/login. On success, redirect to 
/student/dashboard or /admin/dashboard based on the returned role. Store the 
session via the httpOnly cookie set by the backend (no manual token handling 
in frontend JS needed if using httpOnly cookies as decided in Phase 1).

Implement a route-protection pattern (middleware or layout-level check) for 
all /student/* and /admin/* routes that calls GET /api/auth/me on load and 
redirects to /signin if unauthenticated, or to the other role's dashboard if 
a student tries to access /admin/* URLs directly (defense in depth — the 
backend already blocks this, but the frontend shouldn't even render an admin 
shell for a student).
```

**Checklist:** logging in as a student and manually navigating to an admin URL redirects away rather than flashing admin UI first; logging out and hitting a protected URL redirects to sign-in; no signup UI exists anywhere.

---

### Phase 8 — Frontend: Student Dashboard (Material, PYQ, Notices)

```
Build the student dashboard shell (sidebar nav, quote-of-the-day banner) and 
the Study Material, PYQ Bank, and Notices screens per UI/UX Design Spec 
Sections 8.3 and 8.4. Use the LIGHT panel style (Section 4 table) for these 
content screens, not the marketing glass treatment — no backdrop blur, solid 
white panels on the light content background.

Study material displays as nested Class > Subject > Chapter navigation (the 
student's own class is pre-selected/locked based on their account, not a free 
picker into other classes). Wire to GET /api/materials and GET /api/pyqs.

Quote banner: implement a curated quote bank (JSON array in the frontend, 
mixed English and Hindi/Hinglish per earlier discussion) that shows once per 
day using session/localStorage-based tracking of last-shown date, with a 
manual refresh button for a new quote within the same day.

Notices: fetch and display via GET /api/notices, most recent first.
```

**Checklist:** a logged-in student only ever sees their own class's materials, with no way via the UI to browse another class's folder; quote banner shows once on first login of the day and doesn't reappear on a second login same day unless refreshed manually; content panels are visibly higher-contrast/less blurred than the marketing site.

---

### Phase 9 — Frontend: Student Dashboard (Tests, Results, Rankings)

```
Build the Tests list, test-taking screen, result/review screen, and rankings 
screen per UI/UX Design Spec Sections 8.5–8.6.

Test-taking screen must follow the "zero decorative glow/animation" rule from 
Section 4 exactly — light panels, static mono-font countdown timer (color 
shifts to rose only in the final 5 minutes, no jitter/animation on the number 
itself per Section 6), question navigator, and answer selection. Wire to 
GET /api/tests/:id/attempt and POST /api/tests/:id/submit. Handle the 
TEST_WINDOW_CLOSED and ALREADY_SUBMITTED error codes gracefully with clear 
user-facing messages, since the backend enforces these regardless of frontend 
state.

Result/review screen shows score, correct/wrong/unattempted counts, and 
per-question review using emerald/rose only on the specific indicators (not 
as a background wash), per API Specification Section 7.6.

Rankings screen treats the top-10 list as a "moment" — full glass treatment 
per Section 4, with gold/silver/bronze crown badges per Design Spec Section 
3.4, and accessible non-color-only badge indicators per Section 7's 
accessibility notes.
```

**Checklist:** starting a test after its window has closed shows a clear message rather than a broken/blank screen; refreshing mid-test doesn't allow a second submission; rank badges are distinguishable without relying on color alone (verify with a grayscale screenshot).

---

### Phase 10 — Frontend: Chatbot Widget

```
Build the floating chat bubble and chat panel per UI/UX Design Spec Section 
8.7, visible only within the student dashboard (not on the public site or 
admin dashboard). Bubble uses the soft pulse glow only when there's an unread 
reply, stopping once opened, per Section 6. Wire to POST /api/chatbot/message, 
maintaining conversationId client-side across messages in a session.

Handle the RATE_LIMITED error response with a clear, friendly message (e.g., 
"You've reached today's question limit — see you tomorrow!") rather than a 
generic error.
```

**Checklist:** chatbot is not reachable/visible from the public marketing site or admin dashboard; hitting the daily rate limit shows the friendly message rather than a raw error.

---

### Phase 11 — Frontend: Admin Dashboard

```
Build the full admin dashboard per UI/UX Design Spec Sections 8.8–8.13, using 
the light-panel style throughout per Section 4 (admin is a daily work tool — 
no glass/glow decoration anywhere in this dashboard).

Modules: Students (table, create modal, edit, reset-password modal that shows 
the returned plaintext password once with a clear "copy" action and a warning 
that it won't be shown again), Batches (CRUD), Materials & PYQ upload (drag-
drop forms), Test Scheduler (multi-step: pick batch → add questions → set 
schedule/duration/negative marking → publish), Test Results view, Enquiries 
(table with status filter/update), Notices (CRUD), Testimonials (CRUD), 
Courses/Fees (CRUD).

Every write action that's destructive (delete student, delete batch, delete 
material) needs a confirmation step before firing the request.
```

**Checklist:** the password-reset modal genuinely only shows the plaintext value once per reset action, not retrievable by reopening the modal; every destructive action requires confirmation; no glass/blur styling appears anywhere in this dashboard.

---

### Phase 12 — Polish, Mobile QA, Deploy

```
Final pass: verify every screen against UI/UX Design Spec Section 4 (correct 
glass-vs-light usage per screen), Section 5 (mobile breakpoints), and Section 
7 (accessibility — contrast ratios, focus states, non-color-only rank badges). 

Test the full flow end-to-end on an actual mobile device: enquiry submission, 
student login, viewing study material, taking a full test start-to-finish, 
viewing rankings, using the chatbot, and the full admin flow of creating a 
student, uploading material, and scheduling a test.

Prepare for deployment: frontend to Vercel, backend to Render, confirm all 
environment variables are set in each platform's dashboard (never committed 
to the repo), confirm CORS on the backend is locked to the production Vercel 
URL (not a wildcard), and confirm the admin seed script has been run once 
against the production database with a strong, unique admin password per 
Security & Privacy Section 8.
```

**Checklist:** a full manual run-through of every user flow works on a real phone; production environment variables are confirmed set and not present anywhere in the git history; CORS is locked down; production admin password is strong and not the same as any test/dev password used earlier.

---

## 4. Notes on Using This With Antigravity Specifically

- Paste one phase's prompt per agent run — resist the urge to combine phases even when it feels slow, since a narrower prompt gives the agent a much better chance of getting server-side validation details (Phase 4 especially) exactly right.
- If Antigravity supports referencing uploaded project docs directly, point each prompt at the specific document sections cited (e.g., "per API Specification Section 7") rather than re-pasting endpoint shapes — keeps prompts shorter and avoids drift between the docs and what the agent builds.
- After Phase 4 in particular, do the manual checklist yourself rather than trusting the agent's own "it works" summary — this phase is the one with real cheating/integrity risk if server-side checks are missed, and it's worth the extra ten minutes.
- If any phase's agent run produces something that doesn't match a prior spec document, treat the spec as the source of truth and re-prompt rather than accepting the drift — that's the whole point of having written these documents first.

---

*End of Agent Build Plan v1.0 — this completes the planning document set. You're ready to move into development.*
