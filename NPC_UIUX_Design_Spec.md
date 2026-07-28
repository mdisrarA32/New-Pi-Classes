# UI/UX Design Specification
## New Pi Classes (NPC) — Coaching Center Platform

**Version:** 1.0
**Based on:** NPC_PRD.md, NPC_SRS.md, NPC_Architecture.md, NPC_API_Specification.md, and the "Deep Focus Glass" theme direction
**Status:** Draft for approval before development

---

## 1. Purpose of This Document

This translates the theme direction and Stitch reference screens into concrete, buildable tokens — colors, type scale, spacing, component states — so every screen an Antigravity agent builds looks like it belongs to the same product, instead of drifting screen to screen. Every value here maps to something the API Specification already returns; no screen in Section 8 asks for data that doesn't exist.

**Guiding rule from earlier discussion, restated as a hard constraint:** glass/glow effects are **heavy on the marketing site**, **toned down on content-heavy dashboard screens** (study material, test-taking) in favor of higher-contrast, less-blurred panels — same color family, less blur — because students read dense text there for long stretches and legibility must win over drama.

---

## 2. Design Tokens

### 2.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-navy-start` | `#0A1128` | Background gradient start (marketing site, auth pages) |
| `--bg-navy-end` | `#16204A` | Background gradient end |
| `--glass-fill` | `rgba(255,255,255,0.08)` | Default glass panel fill (marketing/hero context) |
| `--glass-fill-strong` | `rgba(255,255,255,0.14)` | Glass panel fill for dashboard content areas (higher opacity = more contrast, per legibility rule) |
| `--glass-border` | `rgba(255,255,255,0.15)` | 1px glass panel border |
| `--gold` | `#E8B84A` | Primary accent — CTAs, crowns, active states, "Admissions Open" |
| `--gold-glow` | `rgba(232,184,74,0.35)` | Box-shadow glow behind gold elements |
| `--blue-accent` | `#4DA8FF` | Secondary accent — links, hover states, charts, secondary buttons |
| `--emerald` | `#1FAE7A` | Success — correct answers, growth indicators |
| `--rose` | `#E5556B` | Error — incorrect answers, destructive actions, alerts |
| `--text-primary-dark-bg` | `#F7F7F5` | Body text on navy/glass backgrounds |
| `--text-secondary-dark-bg` | `rgba(247,247,245,0.7)` | Muted/secondary text on navy/glass |
| `--text-primary-light-bg` | `#0F1B3D` | Body text on light dashboard panels |
| `--content-bg-light` | `#F7F7F5` | Solid light background for dense dashboard content (study material, test-taking) |
| `--content-panel-light` | `#FFFFFF` | Card fill on light dashboard screens |

### 2.2 Typography

| Token | Font | Usage |
|---|---|---|
| `--font-display` | Fraunces (or equivalent bold serif) | Headlines, hero text, section titles — white or gold on dark backgrounds |
| `--font-body` | Inter | Body copy, dashboard UI, forms |
| `--font-mono` | IBM Plex Mono | Scores, ranks, test timers, numeric stats — gives an "exam scorecard" precision feel |

**Scale (rem, mobile-first — desktop scales up via clamp() rather than separate breakpoint values):**
- `--text-h1`: clamp(2rem, 5vw, 3.5rem) — hero headline only
- `--text-h2`: clamp(1.5rem, 3vw, 2.25rem) — section titles
- `--text-h3`: 1.25rem — card titles, dashboard section headers
- `--text-body`: 1rem — default body
- `--text-small`: 0.875rem — captions, meta text
- `--text-mono-score`: 1.5rem — result scores, rank numbers

### 2.3 Spacing & Radius

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px — standard 8px-based rhythm
- `--radius-card`: 16px (glass cards, marketing)
- `--radius-panel`: 12px (dashboard content panels — slightly less rounded, reads more "functional tool" than "marketing card")
- `--radius-button`: 999px (pill buttons) for primary CTAs, 8px for secondary/utility buttons
- `--blur-glass`: backdrop-filter blur(16px) for marketing/hero, blur(8px) for dashboard glass elements (banner, sidebar only — see Section 4)

### 2.4 Elevation

- `--shadow-glass`: `0 8px 32px rgba(0,0,0,0.25)` — standard glass panel shadow
- `--shadow-gold-glow`: `0 0 24px var(--gold-glow)` — applied to primary CTAs and rank-1 crown card on hover/emphasis
- `--shadow-panel-light`: `0 2px 8px rgba(15,27,61,0.08)` — subtle shadow for light dashboard cards (no glow, keeps content screens calm)

---

## 3. Component States (apply everywhere a component is used)

### 3.1 Buttons
- **Primary (gold):** solid `--gold` fill, `--text-primary-light-bg` text, `--radius-button`. Hover: gold shimmer sweep (left-to-right gradient animation, ~600ms) + `--shadow-gold-glow`. Active: scale(0.98). Disabled: 40% opacity, no hover effects.
- **Secondary (glass outline):** transparent fill, `--glass-border`, `--text-primary-dark-bg` text (dark-bg contexts) or `--text-primary-light-bg` (light-bg contexts). Hover: fill becomes `--glass-fill`.
- **Destructive:** `--rose` border/text, transparent fill; hover: `--rose` fill at 10% opacity. Used for admin delete actions only.

### 3.2 Cards
- **Marketing glass card:** `--glass-fill`, `--glass-border`, `--blur-glass` (16px), `--shadow-glass`. Hover: lift (translateY(-4px)) + border brightens to `rgba(255,255,255,0.25)`.
- **Dashboard content card (light):** `--content-panel-light` fill, `--radius-panel`, `--shadow-panel-light`, 1px `rgba(15,27,61,0.08)` border. No blur, no hover-lift — these are functional, not promotional.

### 3.3 Form Inputs
- Dark-bg context (login): `rgba(255,255,255,0.06)` fill, `--glass-border`, `--text-primary-dark-bg` text, focus ring `--blue-accent`.
- Light-bg context (admin forms, test-taking): white fill, `rgba(15,27,61,0.15)` border, focus ring `--gold`.
- Error state: `--rose` border + small `--rose` helper text below field.

### 3.4 Badges (Rank Crowns — Section 8's Rankings screen)
- Rank 1: gold crown icon, `--gold` glow ring around avatar/name, `--font-mono` score in gold.
- Rank 2: silver (`#B8C0C8`) crown icon, subtler glow.
- Rank 3: bronze (`#C08552`) crown icon, subtler glow.
- Rank 4–10: no icon, plain row, `--font-mono` score in `--text-primary-light-bg` or `--text-primary-dark-bg` depending on context.

---

## 4. Where Glass/Glow Applies vs. Where It's Toned Down

This is the single most important rule in this document for the Agent Build Plan to enforce consistently:

| Screen | Background | Panel style |
|---|---|---|
| Landing page (hero, stats, courses, testimonials, fees) | Navy gradient + blurred glow orbs | Full glass (`--glass-fill`, 16px blur) |
| Sign-in page | Navy gradient | Full glass card, centered |
| Student dashboard — quote banner, sidebar nav | Navy or glass | Full glass |
| Student dashboard — study material browser, PYQ bank, test list | `--content-bg-light` | Light solid panels (`--content-panel-light`), no blur |
| Test-taking screen (active exam) | `--content-bg-light` | Light solid panels, **zero decorative glow/animation** — this screen needs to be as calm and distraction-free as possible, timer and question only |
| Test result/review screen | `--content-bg-light` | Light panels, `--emerald`/`--rose` used only on the specific correct/incorrect indicators, not as a background wash |
| Rankings screen | Navy or glass (this is a "moment," treat like marketing) | Full glass, crown glow effects |
| Admin dashboard — all screens | `--content-bg-light` | Light solid panels throughout — admin is a working tool used for hours, prioritize function over drama entirely |

---

## 5. Responsive Breakpoints

- Mobile: 0–639px (default, mobile-first — most parents/students browse on phone per earlier discussion)
- Tablet: 640–1023px
- Desktop: 1024px+

**Mobile-specific adjustments:**
- Sidebar nav (student/admin dashboard) collapses to a bottom tab bar or hamburger drawer — do not shrink a desktop sidebar, redesign the pattern for touch
- Glass blur radius reduced (`blur(8px)` instead of `16px`) on mobile for performance — heavy backdrop-filter blur is expensive on lower-end Android devices common in tier-2/3 towns
- Hero headline uses the lower end of its `clamp()` range
- Test-taking screen: question navigator becomes a horizontal scroll strip instead of a sidebar grid

---

## 6. Motion Guidelines

- Section fade-in-on-scroll: opacity 0→1 + translateY(16px→0), 400ms ease-out, marketing site only
- Button hover/press: 150–200ms ease, no motion longer than this anywhere in the UI (keeps the dashboard feeling responsive, not sluggish)
- Chatbot bubble: soft pulse glow loop (2s cycle) only when a new unread reply exists — stops pulsing once opened, doesn't pulse constantly (avoid nagging/attention-fatigue for a study tool)
- Test timer: no animation on the number itself (a jittering timer during an exam is actively harmful to focus) — static mono-font countdown, color shifts to `--rose` only in the final 5 minutes

---

## 7. Accessibility Notes

- Minimum contrast ratio 4.5:1 for body text against its background — verify `--text-secondary-dark-bg` against `--glass-fill` specifically, as low-opacity glass is the highest risk of failing this
- All interactive elements have a visible focus state (not just hover) — required for keyboard navigation in the admin dashboard especially, since admin will use this as a daily work tool
- Crown/rank badges (Section 3.4) must not rely on color alone — gold/silver/bronze icons are differently shaped or labeled (e.g., a small "1st/2nd/3rd" text alongside the icon), so colorblind students aren't excluded from the ranking moment
- Form errors are announced via both color (`--rose`) and text, never color alone

---

## 8. Screen-by-Screen Component Map

For each screen, the components needed and the API endpoint(s) (per API Specification) that feed it.

### 8.1 Landing Page
- Navbar (glass) — static, no API call
- Hero — static content + `POST /api/enquiries` (demo request form)
- Stats strip — static or admin-editable content (future enhancement, not in v1 API)
- Course/batch cards — `GET /api/courses`
- Testimonials — `GET /api/testimonials`
- Fee cards — from `GET /api/courses` (fee field)
- Footer — static

### 8.2 Sign-In Page
- Glass form card — `POST /api/auth/login`

### 8.3 Student Dashboard — Home
- Quote banner — static curated quote bank (client-side rotation, once-per-day logic using localStorage-equivalent session check — see Architecture doc for exact mechanism since artifacts/agents may differ in storage approach)
- Sidebar nav — static
- Notices preview — `GET /api/notices`

### 8.4 Student Dashboard — Study Material
- Class → Subject → Chapter nested folder cards (light panels) — `GET /api/materials`
- PYQ tab — `GET /api/pyqs`

### 8.5 Student Dashboard — Tests
- Test list (upcoming/active/completed tabs) — `GET /api/tests`
- Test-taking screen — `GET /api/tests/:id/attempt`, `POST /api/tests/:id/submit`
- Result/review screen — `GET /api/tests/:id/result`

### 8.6 Student Dashboard — Rankings
- Top 10 with crowns — `GET /api/tests/:id/rankings`

### 8.7 Student Dashboard — Chatbot
- Floating bubble + chat panel — `POST /api/chatbot/message`

### 8.8 Admin Dashboard — Students
- Table + create/edit/reset-password modals — `POST/GET/PATCH /api/admin/students`, `POST /api/admin/students/:id/reset-password`

### 8.9 Admin Dashboard — Batches
- Table + create/edit — `POST/GET/PATCH/DELETE /api/admin/batches`

### 8.10 Admin Dashboard — Materials & PYQ Upload
- Upload form (drag-drop) — `POST /api/admin/materials`, `POST /api/admin/pyqs`

### 8.11 Admin Dashboard — Test Scheduler
- Multi-step form (batch → questions → schedule) — `POST /api/admin/tests`
- Results view — `GET /api/admin/tests/:id/results`

### 8.12 Admin Dashboard — Enquiries
- Table with status filter — `GET/PATCH /api/admin/enquiries`

### 8.13 Admin Dashboard — Notices & Testimonials
- CRUD forms — `POST/DELETE /api/admin/notices`, `POST/PATCH/DELETE /api/admin/testimonials`

---

## 9. Dependencies Forward

This document informs:
- **Agent Build Plan** — component tokens (Section 2–3) should be scaffolded as a shared theme/CSS-variables file *first*, before any screen is built, so every subsequent agent run references the same tokens instead of re-inventing values per screen
- **Test Plan** — dedicated QA pass for the light-vs-glass rule (Section 4) holding consistently, plus the accessibility checks in Section 7

---

*End of UI/UX Design Specification v1.0 — ready for review before proceeding to the Agent Build Plan.*
