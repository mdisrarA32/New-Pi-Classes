# Security & Data Privacy Document
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.0
**Based on:** NPC_PRD.md, NPC_SRS.md, NPC_Architecture.md, NPC_Database_Schema.md
**Status:** Draft for approval before development

---

## 1. Why This Document Matters Here

All enrolled students are minors (Class XI/XII, typically ages 15–18). While NPC is a small regional coaching center and not subject to enterprise compliance regimes, the system still collects and stores minors' personal data (names, batch info, test scores) — so security and privacy get a dedicated document rather than being an afterthought bolted onto the SRS. This is good practice regardless of legal obligation, and it's the kind of thing that matters if a parent ever asks "who can see my child's data?"

---

## 2. Data Classification

| Data | Sensitivity | Who can access |
|---|---|---|
| Student full name, username | Sensitive (minor's PII) | Admin (full), student (own record only) |
| Password (hashed) | Highly sensitive | Never exposed to anyone, including admin — only hashes stored, admin resets rather than views |
| Test scores, rankings | Sensitive | Student (own + batch-scoped leaderboard), admin (full) |
| Batch assignment | Low sensitivity | Student (own), admin (full) |
| Enquiry data (parent/visitor name, phone) | Sensitive (contact PII) | Admin only |
| Public testimonials | Public by design | Anyone — but admin-curated, not pulled from live student records (per PUB-4) |
| Chatbot conversation content | Sensitive (may reveal academic struggles) | Not persisted long-term beyond what's needed for rate-limiting/abuse detection (see Section 6) |

---

## 3. Authentication & Access Control

- **AUTH-6 (from SRS):** Passwords are hashed with bcrypt (or equivalent, e.g., argon2) before storage. Plaintext passwords exist only transiently in memory during creation/reset, and in the one-time admin-facing display modal (STU-4) — never logged, never stored.
- **Role-based access control (RBAC)** is enforced **server-side** on every route, not just hidden via frontend routing. A student JWT must never be able to call an admin-only endpoint, even if the URL is guessed/typed directly.
- **JWT expiry** is set (e.g., 7 days) — no indefinite sessions. Tokens are signed with a strong secret stored only in environment variables (Render dashboard), never committed to the repository.
- **No client-side storage of sensitive data** beyond the JWT itself (in an httpOnly cookie where possible, or secure localStorage as a fallback if the Antigravity-built frontend requires it — httpOnly cookie is the stronger recommendation).
- **Login rate limiting** (AUTH-4): lockout after repeated failed attempts (5 failed attempts per username/IP within 15 minutes), to blunt brute-force attempts against student accounts. *Architecture Note:* In v1, the rate limiter operates in-memory (`Map` store), meaning lockout counters reset on server process restarts and do not synchronize across horizontally scaled multi-instance deployments. This is an intentional tradeoff for v1's single-instance deployment scale; if NPC scales to multi-instance deployments in future phases, migrate the counter store to Redis.

---

## 4. Data Minimization & Minor-Specific Precautions

- The system collects **only what's operationally necessary**: name, class, batch, scores. No collection of home address, parent contact details, health information, or other sensitive categories beyond what's already listed — if NPC later wants to add parent contact info (e.g., for the "parent report link" feature mentioned as a future phase in the PRD), that should trigger a revisit of this document, not a silent schema addition.
- **No public exposure of student data.** Rankings are visible only within a logged-in student's own batch context (RANK-5) — never on the public marketing site. Public testimonials are a separate, admin-curated collection (`testimonials`), intentionally decoupled from live student records, so a real student's actual test performance is never inadvertently displayed publicly.
- **Enquiry data** (from prospective students/parents on the public form) is visible to admin only, and should have a defined retention approach — recommend admin periodically clearing old/closed enquiries (e.g., older than one academic year), though this is a manual admin action in v1, not an automated deletion job.
- **Chatbot interactions:** since students may ask doubts that reveal where they're struggling academically, conversation logs (if kept at all, e.g., for abuse monitoring or rate-limit tracking) should be retained minimally and not surfaced to admin as a "read my student's chat" feature — this isn't a surveillance tool, it's a study aid. If any logging exists, it should be for system health/abuse detection only.

---

## 5. Transport & Infrastructure Security

- **HTTPS-only** across the entire platform (public site, student dashboard, admin dashboard, API) — enforced via Vercel/Render defaults, no plaintext HTTP fallback.
- **Environment variables** (Mongo connection string, JWT secret, Cloudinary API keys, Groq API key) stored in Render/Vercel's environment configuration, never in the codebase or version control. `.env.example` files in the repo contain only placeholder keys/names, matching the original Aura-3.0-style scaffold pattern.
- **Database access**: MongoDB Atlas user credentials scoped to only the permissions the backend needs (read/write on the app's own database, not admin-level cluster access). IP allowlisting used where practical given Render's egress IP behavior.
- **CORS** configured on the backend to only accept requests from the known frontend origin(s) (production Vercel URL + local dev origin during development) — not a wildcard `*` in production.

---

## 6. File Upload Security

- **Type validation server-side**, not just by file extension (MAT-6) — e.g., verifying actual MIME type/magic bytes for PDF uploads, to prevent disguised executable uploads.
- **Size limits enforced** (e.g., 20MB per file) both client-side (UX) and server-side (actual enforcement) — client-side limits alone are not security, only convenience.
- **Cloudinary as the storage layer** means uploaded files are not stored on the application server's own filesystem/disk, reducing the blast radius of a malicious upload.
- **No user-uploaded executable content** of any kind — the system only accepts PDF, image, and (for video) external link types; no arbitrary file type uploads permitted anywhere in the platform.

---

## 7. AI Chatbot-Specific Safeguards

- **Server-side proxy only** (per Architecture doc) — the Groq API key never reaches the frontend/browser, preventing key theft via browser dev tools or network inspection.
- **System-prompt scoping** (BOT-2) restricts the assistant to Physics/Chemistry/Biology/Mathematics academic content — this is a content-safety measure as much as a product-scope one, reducing the chance of the chatbot being misused for unrelated or inappropriate conversations by a minor user.
- **Rate limiting per student per day** (BOT-5) both controls cost and limits potential misuse (e.g., attempts to jailbreak the scoping via repeated adversarial prompts).
- **No chatbot access from the public site** — it's a benefit reserved for enrolled, authenticated students only, consistent with the platform's closed-access model.

---

## 8. Admin Account Security

- Since the admin account controls all student data and can reset any student's password, the **admin account itself deserves stronger protection** than a typical student account:
  - Recommend a strong, unique admin password (not auto-generated the same lightweight way as student passwords).
  - Recommend the admin account be set up once, directly (not through the public-facing flow), during initial deployment — e.g., seeded directly in the database or via a one-time setup script, not a "create admin" button exposed anywhere in the UI.
  - If NPC ever has more than one staff member needing admin access, each should have their own login (no shared admin credentials) — supported naturally since `users` already supports multiple `role: admin` records.

---

## 9. What This Platform Deliberately Does NOT Do (and why that's a security positive)

- No public self-registration (AUTH-1) — eliminates an entire class of spam/fake-account risk.
- No student-facing password recovery via email/SMS (AUTH-5) — eliminates email/SMS account-takeover vectors entirely, at the cost of admin convenience (an accepted tradeoff per the confirmed PRD/SRS decisions).
- No payment processing in v1 — eliminates PCI-DSS-level compliance concerns entirely for this phase.
- No third-party social login — reduces dependency on external identity providers and their own security postures.

---

## 10. Incident Response (lightweight, appropriate to scale)

- If a student's credentials are suspected compromised (e.g., shared/leaked), admin resets the password immediately via STU-4's reset action — no separate "lock account" flow needed since a password reset alone invalidates the old credential.
- If the admin account itself is suspected compromised, recommend rotating the JWT secret (which invalidates all active sessions platform-wide) as an emergency measure, then resetting the admin password directly in the database.

---

## 11. Dependencies Forward

This document informs:
- **API Specification** — every endpoint's auth/role requirement is derived from Sections 3 and 5 here
- **Agent Build Plan** — security requirements (hashing, RBAC middleware, rate limiting, CORS, file validation) should be built into the Auth and file-handling modules from the start, not retrofitted after
- **Test Plan** — dedicated manual QA checks for: attempting admin routes as a student, attempting to bypass file type validation, verifying rate limits trigger correctly

---

*End of Security & Data Privacy Document v1.0 — ready for review before proceeding to the API Specification.*
