# PUSH RUSH — Online Reaction-Speed & Brain-Training Gaming Platform

> **Think Fast. Tap Faster. Beat the Clock.**

**PUSH RUSH** is a mobile-first, PWA-installable reaction-speed and cognitive agility gaming platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Web Audio API**, and **Supabase** (Auth, PostgreSQL, Row Level Security, Server-Side Score Verification RPCs, and Avatar Storage).

---

## 1. Platform Highlights

### 8 Playable Game Modes (with Beginner, Intermediate, Advanced & Expert Difficulty)
1. **Classic Speed Mode (`/play/classic`)** — 9-pad (3×3) or 12-pad (3×4) circular illuminated reaction arena, 30s / 60s / 90s durations, millisecond reaction tracking, progressive acceleration, wrong-tap penalties, and Personal Best tracking.
2. **Memory Rush (`/play/memory`)** — Progressive Simon-style illuminated sequence recall with musical pitch synthesis, level counter, and longest-sequence tracking.
3. **Survival Mode (`/play/survival`)** — Accelerating shrinking pad windows with 3 lives; wrong taps or timeouts cost a life. Tracks survival duration and best survival time.
4. **Target Rush (`/play/target`)** — Selective-attention challenge with active decoy distractions; tap only pads matching the active color/symbol target rule.
5. **Colour Rush (`/play/colour`)** — Dynamic Stroop cognitive-switching rules (`TAP PAD COLOR` vs `TAP WORD MEANING` vs `AVOID FORBIDDEN COLOR`).
6. **Number Rush (`/play/numbers`)** — Tap randomized illuminated numbered pads in strict **Ascending** or **Descending** order before the board timer expires.
7. **Multiplayer Battle (`/play/multiplayer`)** — 2-Player Same-Device 1v1 arena supporting both **Simultaneous Split-Screen** (mirrored top/bottom halves) and **Alternating Turn-Based** modes with instant winner comparison & rematch.
8. **Endurance Challenge (`/play/endurance`)** — Continuous reaction marathon with escalating speed waves, strict 5-mistake limit, and longest-streak tracking.

### Complete 16+ Page Architecture + Protected Admin Console
- `/` — Home Page (Hero, instant Guest Play Now CTA, 8-mode showcase, How to Play, Daily Challenges, Real DB Global Top Players, Platform Stats, clearly labeled Sample Preview Testimonials, Footer)
- `/games` — Game Selection Hub (skill category filter, difficulty selector, personal best badges)
- `/play/[mode]` — Individual Game Arena (3-2-1-GO countdown, HUD timer/score/streak/lives, Pause/Resume/Restart/Exit, sound toggle, Full-Screen + iOS viewport fallback, keyboard + zero-latency touch support, Game-Over Results Summary with transparent score breakdown)
- `/register` — Player Registration (live username check + optional Guest match import)
- `/login` — Sign In & Password Recovery
- `/dashboard` — Player Dashboard (XP rank progress, reaction-time bar chart, Daily Challenges, personal records, recent match history)
- `/leaderboard` — Global Leaderboard (Daily / Weekly / Monthly / All-Time & per-mode filters; strictly real Supabase DB scores only + player fair-play report modal)
- `/profile` & `/profile/[username]` — Player Profile Editor (Supabase Storage `pr-avatars` upload, bio, country, favorite mode) & Shareable Public Profile Card
- `/achievements` — 16 Unlockable Badges with progress bars & XP rewards
- `/history` — Filterable Match Telemetry Log with expandable score breakdowns
- `/instructions` — Per-Mode Tutorials, Keyboard Shortcuts & Scoring Formula Reference
- `/settings` — Sound, Synth Volume, Haptics, Dark/Light Theme, Reduced Motion, Default Grid/Difficulty, PWA Install, Account Security & Local Data Reset
- `/about` — About PUSH RUSH + Future-Ready Free vs Pro/Tournament Roadmap Preview (all gameplay 100% free; paid features inactive)
- `/contact` — Support Ticket Submission (`pr_support_tickets`) & FAQ
- `/privacy` & `/terms` — Privacy Policy & Fair-Play Terms
- `/admin` — Role-Protected Administrator Console (`role = 'admin'` RBAC: Platform Analytics, User Directory & Suspension, Game Mode Point Weights, Global Scoring/Anti-Cheat Config, Daily Challenge Scheduler, Leaderboard Score Revocation, Player Reports & Support Tickets, Website Announcements)

---

## 2. Modular Directory Structure

```text
├── public/
│   ├── icons/                     # PWA icons (192, 512, maskable, Apple touch, favicon)
│   ├── images/                    # Optimized WebP hero banner artwork
│   ├── manifest.webmanifest       # Installable Progressive Web App manifest
│   └── sw.js                      # Offline-capable Service Worker
├── src/
│   ├── app/                       # Next.js App Router pages & API route handlers
│   ├── components/
│   │   ├── game/                  # PushRushArena, MultiplayerArena, ResultsSummary
│   │   ├── layout/                # Responsive Navbar, Announcement Banner, Footer
│   │   └── ui/                    # Original PushRushLogo SVG, ModeIcon, ToastOverlay
│   ├── context/
│   │   └── AppProviders.tsx       # Auth, Guest State, Theme, Audio, Offline Sync Queue
│   ├── lib/
│   │   ├── audio/soundEngine.ts   # Zero-asset Web Audio API synthesizer + haptics
│   │   ├── constants/modes.ts     # 8 Modes, 7 XP Rank Tiers, 16 Achievements, Pads
│   │   ├── games/generators.ts    # Pure deterministic round generators for all 8 modes
│   │   ├── scoring/engine.ts      # Transparent scoring, XP & anti-cheat validator
│   │   ├── storage/guestStore.ts  # Local Guest persistence & offline match queue
│   │   └── supabase/              # Browser/SSR Supabase clients & typed DB operations
│   └── types/game.ts              # Shared TypeScript domain contracts
└── supabase/migrations/           # Full PostgreSQL schema, RLS, triggers, RPCs & seeds
```

---

## 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase Project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Your Supabase public `anon` key (safe for browser with RLS enabled) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-only key used **only** by `/api/admin/bootstrap` if enabled (never exposed to client) |
| `ADMIN_BOOTSTRAP_SECRET` | Optional | Server-only secret passphrase to promote an authenticated account to `admin` via `/admin` |

> **Guest Offline Fallback:** Even if Supabase variables are omitted in a local offline test, PUSH RUSH remains playable in Guest Mode using local browser storage.

---

## 4. Local Installation & Development

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (Vitest)
npm test

# 3. Type-check and create production build
npx tsc --noEmit
npm run build

# 4. Start development server on http://localhost:3000
npm run dev
```

---

## 5. Database Schema & Supabase Setup

All database objects use the `pr_` namespace so PUSH RUSH can run either in a dedicated Supabase project or cleanly alongside existing schemas:

1. Open the **Supabase SQL Editor** (or run `supabase db push` with the Supabase CLI) and execute in order:
   - `supabase/migrations/202611070001_push_rush_core_schema.sql` — Creates `pr_profiles`, `pr_game_modes`, `pr_scoring_config`, `pr_game_results`, `pr_achievements`, `pr_user_achievements`, `pr_daily_challenges`, `pr_user_daily_challenges`, `pr_announcements`, `pr_reports`, `pr_support_tickets`, `pr_platform_settings`, Storage bucket `pr-avatars`, Row Level Security policies, and the `pr_guard_profile_updates` trigger preventing client-side XP/level/role tampering.
   - `supabase/migrations/202611070002_push_rush_rpcs_and_seed.sql` — Creates server-side score verification & anti-cheat RPC `pr_record_validated_game`, `pr_get_leaderboard`, `pr_ensure_daily_challenges`, `pr_get_platform_stats`, `pr_compute_level`, `pr_ensure_profile`, and seeds the 8 modes + 16 achievements.
   - `supabase/migrations/202611070003_push_rush_admin_rpc.sql` — Creates RBAC-protected admin RPCs `pr_admin_list_users` and `pr_admin_update_user`.

---

## 6. Administrator Setup Instructions

Admin authorization is enforced both in the UI and inside PostgreSQL RLS via `public.is_pr_admin()` (`pr_profiles.role = 'admin'`). No admin passwords or secrets are ever hardcoded in frontend code.

### Configured Primary Administrator
- **`Akindelepeace11@gmail.com`** (`akindelepeace11@gmail.com`) is provisioned and authorized in `public.pr_admin_emails` and `public.pr_profiles` (`role = 'admin'`) via `supabase/migrations/202611070004_push_rush_admin_emails.sql`.
- Simply sign in at **`/login`** using `Akindelepeace11@gmail.com` to see the **Admin** button in the top navigation bar and access all 7 tabs of **`/admin`** (including authorizing additional administrator emails directly from `/admin` → **Users**).

### Adding Additional Administrators via SQL (Optional)
```sql
SELECT set_config('app.pr_trusted_rpc', 'true', true);
INSERT INTO public.pr_admin_emails (email, note) VALUES ('another-admin@example.com', 'Admin');
UPDATE public.pr_profiles p
SET role = 'admin'
FROM auth.users u
WHERE p.id = u.id AND lower(u.email) = 'another-admin@example.com';
```

---

## 7. Deploying to Vercel

1. Push this repository to **GitHub**.
2. In **Vercel**, click **Add New → Project** and import the repository.
3. Framework Preset will auto-detect **Next.js**.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *(Optional)* `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_BOOTSTRAP_SECRET`
5. Click **Deploy**.
6. In **Supabase Dashboard → Authentication → URL Configuration**, add your production Vercel domain (`https://your-domain.vercel.app`) to **Site URL** and **Redirect URLs** (`https://your-domain.vercel.app/**`).

---

## 8. External Services Summary

| Service | Status | Notes |
| :--- | :--- | :--- |
| **Supabase (PostgreSQL, Auth, Storage)** | **Configured & Live** | Schema, RLS policies, `pr-avatars` bucket, 8 game modes, 16 achievements, and server-side score validation RPCs are migrated and active on project `xwqmfdsfmalxsirojuwi`. |
| **Vercel Hosting** | Ready for 1-Click Deploy | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings when deploying to a public custom domain. |
| **Email SMTP (Optional)** | Default Supabase Auth Active | Auto-confirm is enabled for frictionless registration; connect a custom SMTP provider (Resend/Postmark) in Supabase Auth settings if branded password-reset emails are desired at scale. |

---

## 9. Verification & Testing Summary

- **Unit Tests (`npm test`):** 12 / 12 Vitest specs passing (`src/lib/scoring/engine.test.ts` & `src/lib/games/generators.test.ts`) verifying zero points for wrong answers, difficulty multipliers, XP level thresholds across all 7 ranks, anti-cheat bounds, and generators for Classic, Memory, Survival, Target, Colour, Number, Multiplayer, and Endurance modes.
- **Type Safety (`npx tsc --noEmit`):** 0 TypeScript errors.
- **Production Build (`npm run build`):** 21 / 21 Next.js static & dynamic routes compiled cleanly.
- **Security Audit (`npm audit`):** 0 vulnerabilities; `.env.local` excluded from Git; RLS enabled across all 12 `pr_*` tables.
