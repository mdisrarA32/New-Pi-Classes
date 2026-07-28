# Product Requirements Document (PRD)
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.0
**Prepared for:** Antigravity agent build (via Alam)
**Status:** Draft for approval before development

---

## 1. Product Overview

### 1.1 What we're building
A two-part web platform for New Pi Classes, a coaching institute in Sheohar, Bihar, preparing Class XI and XII students for JEE, NEET, and Foundation courses:

1. **Public marketing site** — brings in new admissions by showcasing the institute, its results, and its offerings.
2. **Student + Admin portal** — a closed, admin-controlled system where enrolled students access study material, take tests, see rankings, and get AI-assisted doubt-solving; and where the admin (Alam's brother) manages batches, students, content, and tests.

### 1.2 Why it exists
NPC currently relies on word-of-mouth and physical posters for admissions, and has no digital system for distributing study material, running tests, or tracking student progress. This platform solves both problems: it's a professional online presence to attract more students, and an operational tool that makes running the coaching center (tests, materials, results) far less manual.

### 1.3 Non-goals (explicitly out of scope for v1)
- Public self-registration — accounts are **only** created by the admin.
- Payment processing / online fee collection (fees are only *displayed*, not collected online).
- Classes below XI or above XII (no 8th–10th, despite earlier discussion — confirmed scope is XI/XII only).
- Parent login accounts (parent visibility, if added later, is a shareable report link, not a full account).
- Native mobile apps (mobile-first responsive web only).

---

## 2. Users & Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Visitor/Parent** | Discovering NPC online, comparing coaching centers | Trust signals (results, faculty, fees), easy way to ask for a demo class or contact via WhatsApp |
| **Prospective Student** | Considering enrollment | Course/batch clarity, sense of outcomes (results/testimonials) |
| **Enrolled Student** | Has admin-issued login | Study material, tests, rankings, doubt-solving, motivation |
| **Admin (Alam's brother / staff)** | Runs the coaching center | Manage batches & students, distribute credentials, upload material, schedule tests, view results, handle enquiries |

Note: All enrolled students are minors (Class XI/XII, typically ages 15–18). This has direct implications for the Security & Data Privacy documents — flagged here for awareness.

---

## 3. Information Architecture

### 3.1 Public Site (no login required)
- **Home** — Hero, About NPC, Batches offered, Stats strip, Results/testimonials, Fee structure, Demo class request form, WhatsApp CTA, Footer (address, phone, quick links)
- **Courses** — Detail by class (XI/XII) × stream (JEE/NEET/Foundation) × batch
- **Faculty** — Faculty profiles/photos
- **About** — Institute story, mission
- **Sign In** — top-right corner nav, leads directly to a single sign-in page (no public signup, no separate signup link)

### 3.2 Student Dashboard (post-login, role = student)
- **Home/Dashboard landing** — daily motivational quote banner (once per session/day, refresh option)
- **My Batch** — batch info, faculty, schedule
- **Study Material** — hierarchy: Class → Subject → Chapter → Notes/PDFs/Videos
- **PYQ Bank** — previous year questions, tagged by year and subject
- **Tests** — scheduled tests appear here (per batch), attempt flow, auto-scored results with answer review
- **Rankings** — top 3 with gold/silver/bronze crown badges, ranks 4–10 shown plainly, student's own rank always visible privately
- **Notices** — admin announcements (schedule changes, holidays, etc.)
- **AI Doubt Chatbot** — floating icon, bottom-right, scoped to Physics/Chem/Bio/Maths (XI-XII syllabus)

### 3.3 Admin Dashboard (post-login, role = admin)
- **Batches** — create/edit batches (e.g., XI-JEE Morning, XII-NEET Evening), assign students
- **Students** — student management table: create student (auto-generate username), set/regenerate password, assign to batch, view profile
- **Study Material Upload** — upload by Class → Subject → Chapter
- **PYQ Upload** — upload tagged by year/subject
- **Test Scheduler** — create test (question set, batch assignment, date/time, duration), view submissions
- **Results & Rankings** — per-test and cumulative views
- **Notices** — post announcements (global or per-batch)
- **Enquiries** — incoming demo-class requests from the public site

---

## 4. Core Features (Detailed)

### 4.1 Authentication & Access Control
- **No public self-registration.** The only public-facing auth entry point is Sign In.
- Admin creates student accounts: enters student name (and batch); system auto-generates a username. Admin sets an initial password or has the system auto-generate one.
- Admin can **regenerate/reset** a student's password at any time (for lost-credential cases) — this is the *only* password-recovery mechanism; there is no student-facing "forgot password" self-service flow, since students don't have registered emails/phones tied to the account by default.
- Two roles only: `student`, `admin`. No separate "faculty" or "parent" login roles in v1.
- Session handled via JWT; role-based route protection on both frontend (redirect if wrong role) and backend (middleware-enforced).

### 4.2 Batches
- A batch groups students by class + stream + timing (e.g., "XI-NEET Evening 2026").
- Tests and notices can target a specific batch, all batches, or a class-wide group.
- A student belongs to exactly one batch at a time (v1 assumption — flag if NPC ever needs a student in multiple batches simultaneously).

### 4.3 Study Material
- Strict hierarchy: **Class (XI/XII) → Subject (Physics/Chemistry/Biology/Maths, Bio only for NEET-relevant batches, Maths only for JEE-relevant batches) → Chapter → Material items (PDF notes, links, video embeds)**.
- Admin uploads/organizes; students only browse/download within their own class scope.

### 4.4 PYQ Bank
- Previous year questions, tagged by subject and year, browsable separately from regular study material (but may visually live under the same section).

### 4.5 Tests & Auto-Grading
- Admin creates a test: selects/enters questions (MCQ format, consistent with JEE/NEET style), assigns to one or more batches, sets a date/time window and duration.
- Test appears to assigned students only within their dashboard once scheduled/active.
- Timed attempt flow: timer visible, question navigation, submit (manual or auto-submit on time expiry).
- Auto-grading on submission: correct/incorrect/unattempted scoring, with **NEET/JEE-style negative marking** (e.g., -25% per wrong answer, exact scheme confirmed in SRS).
- Result shown immediately: score, correct/incorrect breakdown, answer review.

### 4.6 Rankings
- Computed per test (and optionally cumulative across a batch/term).
- Display rule: **Rank 1 = gold badge + crown icon, Rank 2 = silver, Rank 3 = bronze**, ranks 4–10 shown as plain name + marks. Beyond rank 10, not publicly listed on the leaderboard — but **every student can always see their own rank and score privately**, regardless of position.
- Rankings are scoped to the student's own batch (not cross-batch/cross-class), so comparisons stay fair (a Foundation student isn't ranked against a JEE-batch student).

### 4.7 AI Doubt-Solving Chatbot
- Floating chat icon on student dashboard only (not on public site, not on admin side).
- Scoped strictly to Physics, Chemistry, Biology, Mathematics — XI/XII syllabus level (JEE/NEET relevant depth).
- Capabilities: answer subject doubts, help generate study notes/summaries on a topic.
- Out of scope for chatbot: non-academic conversation, other subjects, admin-level data access.

### 4.8 Motivational Quote Banner
- Shown once per day/session on student dashboard entry (not on every page load/click).
- Curated quote bank (not generic scraped internet quotes) — themes: consistency, failure/comebacks, effort vs. rank, some Hindi/Hinglish quotes mixed with English, inclusion of respected figures (e.g., APJ Abdul Kalam) relevant to this student audience.
- Optional manual "new quote" refresh button.

### 4.9 Notices
- Admin posts text announcements, optionally scoped to a batch or global; students see them in a dedicated Notices section.

### 4.10 Public Enquiry / Demo Request
- Simple form on the public site (name, phone, class/stream interested in) — submissions land in the admin's Enquiries view.
- WhatsApp click-to-chat button as a parallel, higher-response-rate contact channel.

---

## 5. Branding & Design Direction

- **Theme:** "Deep Focus Glass" — deep navy (`#0A1128`→`#16204A` gradient) background with glassmorphism panels, gold (`#E8B84A`) as the achievement/CTA accent, soft electric blue (`#4DA8FF`) as secondary accent, emerald/rose for success/error states.
- Glass/glow/blur effects used prominently on the **public marketing site** for visual impact; **toned down** (higher contrast, less blur) on **content-heavy dashboard screens** (study material, test-taking) to preserve readability during long study/test sessions.
- Recurring motif: glowing π (pi) symbol, subtle geometric/crystal shapes, faint math/graph textures — echoes the existing printed poster for brand continuity.
- Typography: bold serif/display for headlines, clean sans-serif for body and dashboard UI.
- Mobile-first responsive design — majority of NPC's audience (students and parents in Sheohar) will browse primarily on phones.
- Full detail lives in the separate **UI/UX Design Spec**, derived from Stitch-generated reference screens.

---

## 6. Success Metrics (v1)

Since this is a small regional coaching center (not a VC-scale product), success is measured practically:

- Admin can fully onboard a new batch of students (create batch → create accounts → distribute credentials) in under 15 minutes.
- Students can find and open relevant study material within 3 clicks of login.
- A scheduled test can be created, taken by a full batch, and auto-graded with rankings visible — with zero manual grading by admin.
- Public site generates measurably more demo-class enquiries than the current poster-only approach (qualitative, tracked via the Enquiries log over the first term).
- No student-reported inability to access their account (password reset by admin resolves this within one admin session).

---

## 7. Assumptions & Open Questions

Flagging these so they're decided before or during build, not discovered mid-way:

1. **Question format for tests:** Assumed MCQ-only (standard for JEE/NEET). Confirm if any subjective/numerical-answer-type questions are needed (JEE Advanced-style).
2. **Negative marking scheme:** Assumed a configurable percentage (default matching NEET/JEE conventions) rather than hardcoded — confirmed in SRS.
3. **One batch per student:** Confirm this holds true, or if a student could need to belong to more than one batch.
4. **Media hosting for videos:** Study material may include "video embeds" — confirm whether these are self-hosted, YouTube-embedded (unlisted), or another provider.
5. **Chatbot provider:** Consistent with Alam's prior project (Aura 3.0), assumed Groq/LLaMA-based, but confirmed in the Architecture Document.
6. **Data retention for minors:** Since all students are minors, retention/visibility rules are detailed in the Security & Data Privacy Note — admin-only visibility of personal data, no public exposure of full names beyond top-10 ranking display (which uses names/usernames the admin has already made semi-public within the batch context).

---

## 8. Document Dependencies

This PRD is the source document for:
- **SRS** — translates each feature above into functional + non-functional requirements
- **Architecture Document** — tech stack and system design to support this scope
- **Database Schema** — entities implied above (User, Batch, Course, Subject, Chapter, Material, PYQ, Test, Question, Result, Notice, Enquiry)
- **Security & Data Privacy Note** — access control and minor-data handling implied in 4.1 and 7.6
- **API Specification** — endpoints per module above
- **UI/UX Design Spec** — theme in Section 5, expanded with component-level detail
- **Agent Build Plan / Prompt Sequence** — build order respecting dependencies (auth → batches → students → study material → tests → rankings → chatbot → polish)

---

*End of PRD v1.0 — ready for review before proceeding to SRS.*
