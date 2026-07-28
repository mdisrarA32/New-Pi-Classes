# Architecture Document
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.0
**Based on:** NPC_PRD.md v1.0, NPC_SRS.md v1.0
**Status:** Draft for approval before development

---

## 1. Guiding Principles

- Reuse a stack Alam already knows well (Next.js + Node/Express + MongoDB, from Aura 3.0) — faster agent-assisted build, fewer unknowns.
- Free-tier/low-cost hosting suitable for a small regional coaching center, not enterprise-scale infrastructure.
- Clear module boundaries matching the SRS sections, so Antigravity agents can build/verify one module at a time without breaking others.
- Server-side enforcement of every rule that matters (grading, role access, negative marking) — the frontend is presentation only, never a source of truth.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SEO-friendly public pages (PUB-3) + same framework serves the dashboards; Alam has direct prior experience |
| Backend | Node.js + Express + TypeScript | Matches Aura 3.0 experience; typed contracts reduce agent-introduced bugs |
| Database | MongoDB Atlas (free/shared tier to start) | Flexible schema fits nested Class→Subject→Chapter hierarchy; free tier acceptable at this scale |
| Auth | JWT (access token) + bcrypt password hashing | Simple, no third-party auth cost, matches AUTH-6/AUTH-7 |
| File storage | Cloudinary (free tier) | PDFs/images; direct upload API, avoids storing binary blobs in Mongo |
| Video hosting | YouTube (unlisted embeds) — **default recommendation** | Zero storage cost, reliable streaming/CDN, easy admin workflow (paste a link); revisit only if NPC wants fully private/non-YouTube hosting later |
| AI Chatbot | Groq API (LLaMA models) | Same proven approach as Aura 3.0; free/cheap tier, fast inference suitable for a scoped doubt-solving assistant |
| Hosting (frontend) | Vercel | Free tier, native Next.js support, fast global CDN for the public site's SEO needs |
| Hosting (backend) | Render | Free/low-cost tier, straightforward Express deployment |
| Email/SMS | **Not used in v1** | No forgot-password flow (AUTH-5) and no auto-notification of credentials (STU-4) means no transactional email/SMS provider is required yet |

---

## 3. System Diagram (described)

```
                         ┌─────────────────────────┐
                         │        Visitors          │
                         │   (Parents/Students)     │
                         └────────────┬─────────────┘
                                      │ HTTPS
                         ┌────────────▼─────────────┐
                         │   Next.js Frontend        │
                         │   (Vercel)                │
                         │  - Public site (SSR/SEO)  │
                         │  - Student dashboard       │
                         │  - Admin dashboard         │
                         └────────────┬─────────────┘
                                      │ REST API calls (JWT in headers)
                         ┌────────────▼─────────────┐
                         │  Express Backend (Render) │
                         │  - Auth module             │
                         │  - Batch/Student module     │
                         │  - Material/PYQ module     │
                         │  - Test/Grading module      │
                         │  - Ranking module           │
                         │  - Notice/Enquiry module    │
                         │  - Chatbot proxy module      │
                         └───┬───────┬────────┬───────┘
                             │       │        │
                 ┌───────────▼─┐ ┌───▼────┐ ┌─▼─────────────┐
                 │ MongoDB Atlas│ │Cloudinary│ │  Groq API      │
                 │ (all app data)│ │(PDF/img) │ │ (chatbot only) │
                 └──────────────┘ └─────────┘ └────────────────┘
```

Notes:
- The chatbot module in the backend acts as a **proxy**: student messages go through the backend (which enforces the subject-scope system prompt and rate limiting per BOT-2/BOT-5), never directly frontend-to-Groq. This keeps the API key server-side and lets us enforce rate limits (STU privacy, cost control).
- Video links (YouTube) are stored as plain URL fields in MongoDB, embedded client-side — no separate video infrastructure needed.

---

## 4. Module Breakdown (mirrors SRS structure)

| Module | Backend responsibility | Frontend surfaces |
|---|---|---|
| Auth | Login, JWT issuance, role middleware, rate limiting | Sign In page, route guards |
| Batch | CRUD for batches | Admin: Batches screen |
| Student | CRUD for students, username generation, password reset | Admin: Students table; Student: profile view |
| Material | CRUD for Class→Subject→Chapter→Item hierarchy | Admin: upload UI; Student: browse UI |
| PYQ | CRUD, filter by year/subject | Admin: upload UI; Student: PYQ Bank |
| Test | CRUD tests, question bank, attempt tracking, grading engine | Admin: Test Scheduler; Student: attempt flow + results |
| Ranking | Computed on test completion (or on-demand), scoped per batch | Student: Rankings screen |
| Notice | CRUD, scoped targeting | Admin: Notices; Student: Notices feed |
| Enquiry | Store public form submissions | Public: demo request form; Admin: Enquiries list |
| Chatbot | Proxy to Groq with scoped system prompt, per-student rate limit | Student: floating chat widget |
| Quote | Serve daily quote (deterministic per student+date, or stored "last shown" pointer) | Student: dashboard banner |

---

## 5. Key Architectural Decisions & Rationale

1. **Monolith backend, not microservices.** At this scale (single coaching center, expected low-hundreds of students), a single Express app with clear module folders is simpler to build via agents and cheaper to host than splitting into services.
2. **Grading is 100% server-side.** TEST-8 requires this — the client submits raw answers only; the server holds the answer key and computes score, ensuring students can't tamper with results via browser dev tools.
3. **Chatbot proxied through backend, not called directly from frontend.** Protects the Groq API key, and is the only place BOT-2 (subject scoping) and BOT-5 (rate limiting) can be reliably enforced.
4. **No email/SMS provider in v1**, consistent with the SRS's admin-only credential distribution model (STU-4) — this simplifies both the architecture and ongoing cost, and can be added later without breaking existing structure if NPC wants auto-notifications eventually.
5. **MongoDB over a relational DB**, because the Class→Subject→Chapter→Item hierarchy and per-test question sets are naturally nested/document-shaped, and Alam already has MongoDB Atlas experience.
6. **Video via YouTube unlisted links rather than self-hosted video**, to avoid the cost/complexity of video storage and streaming infrastructure at this project's scale and budget.

---

## 6. Deployment Topology

- **Frontend:** Vercel project connected to the frontend repo/folder; auto-deploys on push to main branch.
- **Backend:** Render web service connected to the backend repo/folder; environment variables (Mongo URI, JWT secret, Cloudinary keys, Groq API key) set in Render's dashboard, never committed to the repo.
- **Database:** MongoDB Atlas free/shared cluster; IP allowlist configured for Render's egress (or 0.0.0.0/0 with strong DB user credentials, if IP allowlisting proves impractical on Render's free tier).
  > [!IMPORTANT]
  > **Phase 12 Deployment Security Checklist:**
  > 1. **MongoDB Atlas Network Access**: Currently set to `0.0.0.0/0` for development convenience. Before live production release (Phase 12), restrict Network Access strictly to the production backend's static IP or Render IP range.
  > 2. **CORS allowedOrigins**: Currently allows localhost dev ports (`3000`, `3001`, `3002`, `3003`). Before Phase 12 production release, lock down `backend/src/index.ts` strictly to `process.env.FRONTEND_URL`.
- **Environments:** A single production environment is sufficient for v1 given the scale; local `.env` files used for development, mirroring `.env.example` templates (as in the original Aura-3.0-style scaffold).

---

## 7. Scalability Considerations (light-touch, not over-engineered)

- Expected load: low hundreds of students, occasional full-batch concurrent test-taking (NFR-2, ~50–100 concurrent). Render/Vercel free-to-low-cost tiers are sufficient; no need for load balancers, caching layers, or queues at this stage.
- If NPC grows significantly (multiple centers, thousands of students), revisit: moving off free tiers, adding a caching layer (e.g., Redis) for rankings computation, and reconsidering video hosting if YouTube's public/unlisted model becomes limiting.

---

## 8. Dependencies Forward

This Architecture Document feeds directly into:
- **Database Schema Document** — concrete collections/fields per module above
- **API Specification** — REST endpoints per module, matching this module breakdown
- **Security & Data Privacy Document** — elaborates NFR-6 through NFR-9 and the minor-data handling flagged in the PRD
- **Agent Build Plan / Prompt Sequence** — build order will follow this module breakdown's natural dependency chain: Auth → Batch → Student → Material/PYQ → Test/Grading → Ranking → Notice/Enquiry → Chatbot/Quote → Public site polish

---

*End of Architecture Document v1.0 — ready for review before proceeding to the Database Schema.*
