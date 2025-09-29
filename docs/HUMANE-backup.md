# ETHICAL DSP (Working title: **HUMANE**) — Vision & MVP Spec

> An artist‑first, transparency‑by‑default platform that blends fair streaming with direct patronage, built lean enough to ship as a web app in weeks, not months.

---

## Mock UI Concepts

### 1) **Fan Receipt (Web & PWA)**
```
┌───────────────────────────────────────────┐
│ HUMANE — Your Monthly Support Receipt     │
├───────────────────────────────────────────┤
│ Subscription: $9.00                       │
│ Platform fee: $1.08                       │
│ Processing: $0.27                         │
│                                           │
│ Net distributed to artists: $7.65         │
├───────────────────────────────────────────┤
│ 🎵 Artists you supported this month        │
│-------------------------------------------│
│ EL.WAV          46%   $3.52               │
│ Geneva          27%   $2.06               │
│ Pinto NYC       19%   $1.45               │
│ Suray Sertin     8%   $0.62               │
├───────────────────────────────────────────┤
│ 💡Tip sent to Geneva: $2.00                │
│                                            │
│ Total direct artist support: $9.65        │
└───────────────────────────────────────────┘
```

**Fan POV:** They instantly see where their money went. They can share this receipt with one click (social proof).  
**Artist POV:** They can download their CSV that matches this breakdown exactly.

---

### 2) **Artist Dashboard (Core Tabs)**
```
┌─────────────────────────────────────────────┐
│ [Logo] HUMANE Dashboard — Artist View       │
├─────────────────────────────────────────────┤
│ Catalog | Releases | Earnings | Splits | ⚙ │
├─────────────────────────────────────────────┤
│ Current Balance: $218.44 (↑ $32 since last) │
│ Next Payout: Feb 1, 2025 via Stripe         │
├─────────────────────────────────────────────┤
│ Recent Activity                             │
│---------------------------------------------│
│ + $12.00 Direct Unlock — "Shy City EP"      │
│ + $2.00 Tip from fan (Toronto)              │
│ + $38.20 Monthly Payout (UCPS)              │
├─────────────────────────────────────────────┤
│ Top Tracks (Jan 2025)                       │
│---------------------------------------------│
│ Violet                1,284 streams         │
│ Corny Love Song         912 streams         │
│ Fela                    740 streams         │
└─────────────────────────────────────────────┘
```

**Quick toggles:** Beside each release: `Public · Subs‑Only · Supporters‑Only · Unlock`.

---

### 3) **Public Player (Fan Side)**
```
┌───────────────────────────────────────────┐
│ HUMANE Player                             │
├───────────────────────────────────────────┤
│ [Cover Art]                               │
│ Track: Violet                             │
│ Artist: EL.WAV                            │
│                                           │
│ ▶ 00:00  ────────────────●───────── 03:42 │
│                                           │
│ ♥ Like   ↗ Share   💸 Support ($1-$10)     │
│                                           │
│ 🔓 Public  |  🔒 Subs‑Only  |  🔑 Unlock   │
└───────────────────────────────────────────┘
```

**Discovery transparency:** Each recommendation has a small info‑icon: “Why am I seeing this? → You follow Geneva · Similar tags: Deep House.”

---

## Placement
These mock UIs can be used as:
- Landing screenshots for early pitch decks.
- Frontend wireframes for Sprint‑1 implementation.
- Marketing collateral (the **fan receipt** is especially viral‑ready).

---

**Next step:** If you want, I can turn these into polished Figma/Tailwind mockups so your coders can implement pixel‑ready components directly.



---

# 🚀 HUMANE — Full Build Scaffolding & Agent Superprompt

> Drop-in repo layout, commands, epics → tickets, API contracts, rules, and CI you can paste straight into your tools. Use this with your AI dev agents + human team.

## 0) Project Identity
- **Code name:** HUMANE
- **Mission:** Ethical, artist‑first DSP blending fair streaming (UCPS) with direct patronage (tips, unlocks, memberships) and radical transparency.
- **Core V1:** **Switch** model (public/subscribers/supporters/unlock) + UCPS payouts + tips + direct unlocks + Stripe Connect.

---

## 1) Monorepo Structure (Vercel + Firebase + Stripe)
```
humane/
  apps/
    web/                  # Next.js 14 (app router, PWA), Tailwind, shadcn/ui
    admin/                # (optional, later) ops console
  packages/
    ui/                   # shared React components + design tokens
    config/               # ESLint, TS, Tailwind, Prettier configs
    lib/                  # shared ts libs (auth, api client, analytics)
  services/
    functions/            # Firebase/Cloud Run functions (TS)
    transcoder/           # ffmpeg HLS pipeline (Node wrapper + scripts)
    webhooks/             # Stripe webhooks handler (Cloud Run)
  infra/
    firebase/             # firestore.rules, storage.rules, indexes, emulators
    vercel/               # vercel.json, build settings
    github/               # CI workflows
  docs/
    product/              # PRD, UI flows, acceptance criteria
    api/                  # OpenAPI + event schemas
    ops/                  # runbooks, on-call, fraud playbooks
  .env.example
  package.json            # pnpm workspaces
  turbo.json              # Turborepo
  README.md
```

### Package managers & engines
- **pnpm** workspaces + **Turborepo** for caching
- Node 20 LTS

---

## 2) Quick Start Commands
```bash
# 0) prerequisites (macOS)
brew install pnpm ffmpeg
curl -sL https://firebase.tools | bash

# 1) clone & bootstrap
# Use GitHub Desktop to clone locally → then in Terminal:
pnpm i

# 2) env
cp .env.example .env.local
# (Values already filled for Firebase client config above.)

# 3) Firebase local emulators
firebase login
firebase use humane-io   # sets default project
firebase emulators:start --import=./infra/firebase/emulator-data --export-on-exit

# 4) web dev (Next.js + emulators)
pnpm dev

# 5) first deploy (hosting + functions to staging or prod)
firebase deploy --project humane-io
```

**.firebaserc**
```json
{
  "projects": { "default": "humane-io" }
}
```

**firebase.json** (snippet)
```json
{
  "hosting": { "public": "apps/web/out", "ignore": ["firebase.json","**/.*","**/node_modules/**"] },
  "functions": { "source": "services/functions" },
  "emulators": { "functions": { "port": 5001 }, "firestore": { "port": 8080 }, "auth": { "port": 9099 }, "storage": { "port": 9199 } }
}
```

---

## 3) Design System & UX Foundations
- **Type scale:** 12/14/16/18/24/32/48
- **Color tokens:**
  - `--brand: #0A84FF` (accessible variants A/B)
  - `--bg: #0B0B0C`, `--card: #141417`, `--text: #F4F5F7`, `--muted: #A0A3A8`
- **Components:** Button, Card, Badge, Table, Tabs, Drawer, Dialog
- **Layouts:** Dashboard (left nav), Player (bottom sticky), Receipt (card list)
- **Motion:** 150–200ms ease, prefers-reduced-motion respected
- **Accessibility:** WCAG AA, focus rings, full keyboard navigation

---

## 4) Firestore Data Model (finalized for MVP)
```
/users/{userId}
  displayName, photoURL, roles[], country, createdAt, consent{},
  stripeCustomerId, deviceHashes[]

/artists/{artistId}
  ownerUserId, name, bio, socials{}, verified, stripeConnectId

/releases/{releaseId}
  artistIds[], title, coverUrl, accessMode, windowFrom, windowTo,
  buyPrice, upc, publishedAt, splits[]

/tracks/{trackId}
  releaseId, artistIds[], title, isrc, durationMs,
  accessMode, explicit, tags[], bpm, key,
  storage{masterPath, hlsPath}

/plays_raw/{yyyymm}/{eventId}
  userId, trackId, artistIds[], msPlayed, durationMs, sessionId,
  deviceHash, ipHash, userAgent, heartbeatCount, createdAt, signed

/plays/{yyyymm}/{playId}
  userId, trackId, artistIds[], msPlayed, completed, weight, suspicious,
  createdAt

/tips/{tipId}
  fromUserId, toArtistId, trackId?, amount, currency, status, createdAt

/subscriptions/{subId}
  userId, plan, status, netMonthly, startedAt, currentPeriod

/payouts/{batchId}
  period, artistId, amount, breakdown{}, status, createdAt

/flags/{flagId}
  kind, subjectId, notes, status, evidence{}, createdAt
```

---

## 5) Security Rules (tight defaults)
**firestore.rules** (excerpt)
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function authed() { return request.auth != null; }
    function has(role) { return authed() && role in request.auth.token.roles; }

    match /users/{uid} {
      allow read: if authed() && (request.auth.uid == uid || has('admin'));
      allow write: if request.auth.uid == uid;
    }

    match /artists/{id} {
      allow read: if true; // public
      allow create, update: if has('artist') && request.auth.uid == resource.data.ownerUserId;
    }

    match /plays/{period}/{id} {
      allow read: if has('admin');
      allow write: if false; // server-only via CF
    }

    match /plays_raw/{period}/{id} {
      allow read: if has('admin');
      allow write: if authed(); // but validated server-side before materialization
    }
  }
}
```

**storage.rules** (excerpt)
```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function authed() { return request.auth != null; }
    match /masters/{uid}/{allPaths=**} {
      allow read: if false; // private
      allow write: if authed() && request.auth.uid == uid;
    }
    match /hls/{public=**} {
      allow read: if request.time < timestamp.date(9999,1,1); // served via signed URLs/CDN
      allow write: if false; // pipeline only
    }
  }
}
```

---

## 6) Cloud Functions / Jobs (TypeScript stubs)
```
functions/
  src/
    index.ts
    auth/onCreate.ts
    uploads/onFinalize.ts          // transcode to HLS, watermark tag
    plays/reportPlayBatch.ts       // validate tokens → /plays_raw
    plays/materializeRaw.ts        // rules + weights → /plays
    payouts/closeMonth.ts          // UCPS compute → /payouts
    payouts/issuePayouts.ts        // Stripe transfers
    webhooks/stripe.ts             // tips/subscriptions events
```

**reportPlayBatch.ts (sketch)**
```ts
export const reportPlayBatch = onCall(async (ctx, data) => {
  assertAuthed(ctx);
  validateSignature(data.token, ctx.auth!.uid);
  const events = sanitizeEvents(data.events);
  await writeRaw(events);           // /plays_raw/YYYYMM
  return { ok: true };
});
```

**materializeRaw.ts (sketch)**
```ts
export const materializeRaw = onDocumentCreated('/plays_raw/{period}/{id}', async (snap) => {
  const e = snap.data();
  const suspicious = isSuspicious(e);
  const weight = computeWeight(e);
  await db.collection(`plays/${snap.params.period}`).add({
    userId: e.userId, trackId: e.trackId, artistIds: e.artistIds,
    msPlayed: e.msPlayed, completed: e.msPlayed >= 0.85*e.durationMs,
    weight, suspicious, createdAt: serverTimestamp()
  });
});
```

**closeMonth.ts (UCPS)**
```ts
export const closeMonth = onSchedule('every month 00:05', async () => {
  const period = lastMonthYYYYMM();
  const subs = await activeSubs(period);
  const payouts = new Map<string, number>();
  for (const u of subs) {
    const Ru = netAllocatable(u, period);
    const plays = await qualifiedPlays(u.id, period); // suspicious=false
    const T  = sum(plays.map(p => p.weight * p.msPlayed));
    for (const p of plays) {
      const share = (p.weight * p.msPlayed) / T;
      for (const a of p.artistIds) payouts.set(a, (payouts.get(a)||0) + Ru*share);
    }
  }
  await writePayouts(period, payouts);
});
```

---

## 7) Stripe Integration (Connect Express)
- **Products/Prices:** `fan_monthly`, `supporter_monthly`, `global_pass` (later)
- **Flow:** Checkout → customer portal for upgrades/cancellations
- **Tips:** `PaymentIntent` with destination charges to artist `connectId`
- **Direct Unlocks:** `Product: release_{id}` with one-time price
- **Webhooks:** `checkout.session.completed`, `invoice.paid`, `payment_intent.succeeded`, `transfer.created`

**Webhook payload mapper** → Firestore events
```
/webhooks/events/{eventId}
  type, objectId, status, raw, processedAt
```

---

## 8) Transcode & Delivery (HLS)
- Upload: WAV/FLAC → GCS `masters/`
- Cloud Run job uses **ffmpeg** to produce HLS ladder (96/128/192 kbps AAC)
- Store to `hls/{trackId}/index.m3u8` with short‑lived signed URL issuance
- Basic forensic watermark: low‑depth per‑segment amplitude mark (config flag)

**ffmpeg baseline**
```bash
ffmpeg -i input.wav -filter_complex "aresample=48000"
  -map 0:a -c:a aac -b:a 96k -hls_time 4 -hls_segment_type mpegts -hls_flags independent_segments out_96k.m3u8
# repeat for 128k/192k and combine master playlist
```

---

## 9) API Contracts (client ↔ server)

### Firebase client init (Next.js)
Create `packages/lib/src/firebaseClient.ts`:
```ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analyticsPromise = isSupported().then((ok) => ok ? getAnalytics(app) : null);
```

Use this in `apps/web` only on the client where needed; avoid running analytics in SSR.

---

### HTTP Endpoints

**POST** `/api/plays/report-batch`  
Body: `{ token: string, events: PlayEvent[] }`
```
PlayEvent = {
  trackId: string;
  msPlayed: number; durationMs: number;
  sessionId: string; heartbeatCount: number;
  deviceHash: string; userAgent: string; ts: number;
}
```
Response: `{ ok: true }`

**GET** `/api/receipts/:period` → Fan receipt breakdown
**GET** `/api/artist/earnings/:period` → Artist CSV

OpenAPI yaml included in `docs/api/openapi.yaml` (stubbed, expand during dev).

---

## 10) Fraud Controls (operationalized)
- **Rules:** min 20s or 50% play; dedupe window; per‑artist caps; new‑user throttles
- **Signals:** deviceHash, ipHash, heartbeat ratios, completion distribution
- **Actions:** mark suspicious → excluded from UCPS; quarantine pool; review queue
- **KPIs:** % suspicious plays, overturn rate, time‑to‑resolution

Runbook → `docs/ops/fraud-playbook.md` (to be filled with thresholds after week 2).

---

## 11) CI/CD
- **GitHub Actions**
  - `ci.yml`: lint + typecheck + unit tests on PRs
  - `deploy-staging.yml`: on merge to `main` → Vercel preview + Firebase hosting/functions to `staging`
  - `deploy-prod.yml`: tag `v*.*.*` → production deploy, run post‑deploy smoke tests

**ci.yml (excerpt)**
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm i
      - run: pnpm lint && pnpm tsc -b && pnpm test
```

---

## 12) Testing Strategy
- **Unit:** utils, UCPS math, rules
- **Contract:** API schemas via zod + pact tests (web ↔ functions)
- **E2E:** Playwright flows (signup, upload, set access mode, play, tip, receipt)
- **Load:** k6 script for play ingestion and HLS segment fetch
- **Security:** OWASP zap baseline; dependency scanning (Snyk/GH)

---

## 13) Product Epics → User Stories → Tickets

### EPIC A — Auth & Roles
- [A1] Email/Google/Apple Auth (fan, artist, admin)
- [A2] Role claims and guard routes
- [A3] Profile edit & data export/delete (GDPR-lite)

### EPIC B — Catalog & Uploads
- [B1] Artist dashboard shell
- [B2] Upload WAV/FLAC → HLS pipeline
- [B3] Metadata form (ISRC, splits invite)
- [B4] Access mode toggles per release/track

### EPIC C — Player & Paywall
- [C1] PWA player + mini‑player
- [C2] Paywall UI (preview, unlock, subscribe)
- [C3] Tips ($1–$10) flow

### EPIC D — Subscriptions & Payouts
- [D1] Stripe products/prices + checkout
- [D2] Receipts (fan) + CSV (artist)
- [D3] UCPS job + payout batch + ledger page

### EPIC E — Fraud & Security
- [E1] Signed play tokens + heartbeat
- [E2] Raw→validated pipeline + rules
- [E3] Ops dashboard for flags

(Each ticket in `docs/product/backlog.csv` with Acceptance Criteria.)

---

## 14) Acceptance Criteria (samples)
**[C2] Paywall UI**
- Given a non‑subscriber, when they open a supporters‑only track, they see a 30‑sec preview and a CTA with 1‑click Apple/Google Pay.
- After successful purchase, playback resumes seamlessly from 30s → full.

**[D3] UCPS job**
- For a user with $9 net allocatable and two artists with 60/40 qualified listen‑time, payouts compute $5.40/$3.60 ± $0.01 rounding.
- Suspicious plays do not affect the split.

---

## 15) Observability
- **PostHog (self‑host)**: funnels (paywall → purchase), feature flags
- **Sentry**: client + server error tracking
- **Dashboards:**
  - Realtime listeners
  - Tips per day
  - Sub churn/expansion
  - Fraud flags per artist

---

## 16) Legal & Policy Docs (templates)
- `/docs/policy/terms.md` — ToS including fraud recoupment
- `/docs/policy/privacy.md` — GDPR/CCPA disclosures
- `/docs/policy/dmca.md` — takedown + counter‑notice
- `/docs/policy/cookies.md` — minimal cookies, analytics opt‑out

---

## 17) GTM — Cohort Launch Plan (Week 6–10)
- 10 artists, themed drop; each with: 1 public single, 1 supporter piece (alt mix/stems), 1 unlockable release
- Publish **Public Payout Ledger #1** at end of first month (blog + socials)
- Referral codes (artist → fans) with first‑month discount

---

## 18) .env.example
```
# Firebase web config (public client keys)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB-hOD2vW_KsCi9CKQngeUCPHYVMbDdZiE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=humane-io.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=humane-io
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=humane-io.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=722090400821
NEXT_PUBLIC_FIREBASE_APP_ID=1:722090400821:web:6a3d51281ce9443703e57c
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-HCGW90EDC5

# Stripe / Observability (fill these in)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_FAN=
STRIPE_PRICE_SUPPORTER=
POSTHOG_KEY=
SENTRY_DSN=
```

---

## 19) Agent Superprompt (paste into your AI dev agent)
```
Role: Lead Engineer for HUMANE (ethical DSP). You will scaffold and implement a production‑ready MVP using Next.js 14 (app router), Firebase (Auth, Firestore, Storage, Functions), Cloud Run for ffmpeg HLS, Stripe Connect for payments, and PostHog/Sentry for observability. Code in TypeScript with pnpm workspaces and Turborepo. Target: web PWA first.

Non‑negotiables:
- Implement UCPS payouts: per‑user net allocatable revenue splits by qualified listen time; exclude suspicious plays.
- Access modes per track/release: public_stream, subscribers_only, supporters_only, windowed, buy_to_stream.
- Tips ($1–$10) and one‑time unlocks via Stripe; Stripe Connect Express for artist payouts.
- Play ingestion pipeline: signed tokens, heartbeat validation, raw→validated materialization; anti‑fraud rules (min 20s or 50% play, dedupe window, device/IP heuristics).
- Fan receipts and artist earnings CSV must reconcile exactly with payout math.

Deliverables (in order):
1) Monorepo tree as specified; pnpm + turbo config; shared `packages/ui` with design tokens.
2) Next.js app with auth, dashboard shell, player shell (sticky mini‑player), and paywall components.
3) Firebase init: Firestore, Functions TS, Storage; emulator config; firestore.rules and storage.rules from docs.
4) Cloud Functions stubs from section 6; implement `reportPlayBatch`, `materializeRaw`, `closeMonth`, webhook mapper.
5) Cloud Run Dockerfile for transcoder (ffmpeg) and script to watch `masters/` → write HLS.
6) Stripe products/prices seeds, webhook handler, checkout and customer portal pages.
7) Fan Receipt page and CSV export for artists.
8) GitHub Actions CI per section 11; Vercel config for `apps/web`.
9) Playwright E2E: signup→upload→paywall→purchase→play→receipt.

Quality bars:
- Type‑safe Firestore with zod schemas.
- Error boundaries and loading states for all routes.
- Lighthouse PWA score ≥ 90 on staging.
- Unit tests for UCPS math and fraud rules.

Conventions:
- Commit convention: Conventional Commits.
- PR template includes checklist for security, accessibility, analytics, and tests.
- Feature flags via PostHog for paywall experiments.

When uncertain: prefer simplicity that ships in under a week. Document tradeoffs in `docs/decisions/ADR-*.md`.
```

---

## 20) Team Roles & Rituals
- **Product/Founder (You):** Vision, artist cohort, policy decisions
- **Systems Architect (Dad):** Pipelines, reliability, cost modeling, security reviews
- **Full‑Stack Lead:** Owns web app & data model end‑to‑end
- **Dev Friends (3):** Feature squads per epic, rotate on-call
- **UX Designer:** Figma → shadcn components, accessibility audits
- **Content Developer:** Docs, blog, ledger posts, support articles

**Rituals:**
- Daily 15‑min standup (async OK). Weekly demo. Biweekly retro. Monthly public “State of HUMANE.”

---

## 21) Definition of Done (MVP)
- 10 artists onboarded, 50–100 fans
- ≥70% content with non‑public access
- First ledger post published, payouts issued ≤72h after month end
- Fraud rate <2% of total plays, overturn <25%

---

## 22) What to build first (2‑week Sprint 1)
- Auth + roles; dashboard shells; upload→HLS; access toggles; checkout for Fan+Supporter; tips; basic player; raw→validated play pipeline; minimal UCPS job; fan receipt page.

**Milestone demo:** Upload a track, set to Supporters‑Only, subscribe as fan, play 2 artists, run UCPS job, show fan receipt and artist CSV with matching sums.



---

# 🤝 HUMANE Team & Agent Playbook

This playbook aligns humans + AI agents (GPT‑5, Gemini, others) for building HUMANE together. Attach in repo as `docs/playbook.md`.

## 1) Roles & Rituals
- **Founder (Bojan):** Vision, partnerships, artist cohort.
- **Systems Architect (Dad):** Reliability, cost modeling, infra decisions.
- **Full‑Stack Lead:** End‑to‑end Next.js + Firebase implementation.
- **Dev Friends (3):** Feature squads per epic; rotate QA and ops.
- **UX Designer:** Wireframes → shadcn components → accessibility audits.
- **Content Developer:** Docs, ledger posts, onboarding materials.
- **AI Agents (GPT‑5, Gemini):** Code generation, documentation, teaching, scaffolding.

**Rituals:**
- Daily async standup in Slack/Notion.
- Weekly demo (Friday). Record and archive.
- Biweekly retro (team + AI notes on what worked).
- Monthly public "State of HUMANE" ledger post.

---

## 2) File Conventions
- **Source code:** TypeScript, pnpm workspaces.
- **Docs:** Markdown in `/docs/`. PRD in `/docs/product/`, ops in `/docs/ops/`.
- **Decisions:** Architecture Decisions Records → `/docs/decisions/ADR-*.md`.
- **Env:** `.env.local` (dev), `.env.staging`, `.env.production`. Never commit secrets.
- **Branches:** `main` → stable, `dev/*` → feature branches. PR → main via review.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`).

---

## 3) Communication with Agents
- **Use precise prompts**: specify deliverable type (code, doc, config). Example:
  - *“Implement Cloud Function for UCPS job. Deliver code + Jest test + docs snippet.”*
- **Context reminders**: always mention `Project: HUMANE`, Firebase project `humane-io`, local dev macOS.
- **Agents must explain**: after code, output a plain‑language explainer so humans learn.
- **Sync docs**: Agents update `/docs/` alongside code (fraud playbook, API contracts, etc.).

---

## 4) Multi‑Agent Workflow
- **GPT‑5 (code focus):** Generate scaffolding, functions, tests, infra configs.
- **Gemini (design + product):** Suggest UX flows, discovery features, growth strategy.
- **Cross‑check:** Always have at least 2 agents review high‑risk code (fraud rules, payouts).

---

## 5) Sprint Planning
- Break epics into tickets in `/docs/product/backlog.csv`.
- Tag tickets with `[HUMANE-AI]` if agent can handle majority.
- Humans review + merge PRs. Agents never push directly.

---

## 6) Quality Bar
- **Tests:** All UCPS math, fraud detection, Stripe webhooks covered.
- **Performance:** PWA Lighthouse ≥90, API p95 <300ms.
- **Security:** Firebase rules locked, secrets in env, no public writes.
- **Docs:** Updated with every PR. Ledger transparent monthly.

---

## 7) Feedback Loop
- **Humans → Agents:** Clarify priorities, provide data samples.
- **Agents → Humans:** Flag assumptions, ask when policy decision needed.
- **Retro:** Include AI feedback — what prompts worked, what didn’t.

---

## 8) Culture & Vision
- **Transparency first**: Fans see receipts, artists see splits.
- **Ship lean, iterate fast**: MVP > perfection.
- **Ethics encoded**: discovery transparency, fair payouts, privacy by design.
- **Learning culture**: Agents teach, humans learn, both evolve.

---

**This playbook keeps HUMANE’s human + AI team in sync, ensuring history‑making execution.**

