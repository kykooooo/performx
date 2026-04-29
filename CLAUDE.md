# CLAUDE.md - PerformX

## Project overview

PerformX is a French-language football coaching platform connecting players, coaches, and parents. Built with Next.js 16 (App Router), Supabase, and Tailwind CSS v4.

**Current status**: **DEPLOYED TO PRODUCTION** on Vercel.
- Production URL: https://performx-six.vercel.app
- GitHub: https://github.com/kykooooo/performx (main branch)
- Supabase project ref: `ibzamtiesrdbvmbkcqri`
- Owner email / admin: `kyky76700@gmail.com`

## Tech stack

- **Framework**: Next.js 16.1.6 with App Router + Turbopack, React 19, TypeScript 5.9
- **Backend**: Supabase (Auth, Postgres, Storage, RPCs, Realtime)
- **Auth storage**: `@supabase/ssr` — cookie-based sessions (so middleware/proxy can read them)
- **Styling**: Tailwind CSS v4, dark athletic theme (accent: `#ff6a00`)
- **Fonts**: Bebas Neue (display), Manrope (body)
- **Charts**: Recharts (lazy-loaded)
- **Monitoring**: Sentry (20% trace sample)
- **Unit tests**: Vitest + Testing Library (80 tests passing)
- **E2E tests**: Playwright (smoke suite in `e2e/`)
- **Deployment**: Vercel (auto-deploy on push to `main`)

## Commands

- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm test` — Run unit tests (vitest run)
- `npm run test:watch` — Watch mode
- `npx playwright test` — Run E2E tests (requires `npx playwright install` first)
- `npx vercel --prod --yes` — Deploy to production manually (auto on push anyway)

## Project structure

```
src/
  app/                  # Next.js pages (App Router)
    actions/            # Server Actions (booking.ts: submitReview, sendMessage)
    admin/              # Admin panel: coach verification, stats
    auth/               # Login, register (player/coach/parent), verify
    booking/            # Booking flow + confirmation (weekly SlotCalendar)
    coach/              # Coach directory + [id] profile
    contact/            # Contact page
    dashboard/          # Role-specific dashboards (player/coach/parent/club-legacy)
    legal/              # cgu, mentions, confidentialite
    messages/           # Messaging system with Realtime subscriptions
    players/            # Player directory + [id] profile
    sessions/           # Session calendar with cancel button
  components/           # Shared components (~25 files)
    slot-calendar.tsx   # Weekly grid for booking slot selection
    session-calendar.tsx / session-calendar-month.tsx
    top-nav.tsx         # Has real-time unread badge via RPC
    confirm-modal.tsx
    feedback-state.tsx  # FeedbackState + LoadingState
    notice.tsx          # Notice + FieldError
    ...
  lib/
    data/               # Supabase queries with live/demo fallback
      core.ts           # withPublicFallback + DataResult<T>
      mappers.ts        # Bi-format mappers (snake_case OR camelCase)
      coaches.ts        # + getCoachDirectoryPaginated
      players.ts        # + getPlayerDirectoryPaginated
      sessions.ts       # + cancelSession
      bookings.ts       # createBookingReservation via RPC
      dashboards.ts     # player/coach/parent dashboard data
      messages.ts       # inbox data, Realtime-ready
      admin.ts          # checkIsAdmin, stats, getCoachesForReview, verifyCoach
    supabase.ts         # createBrowserClient in browser, createClient server/test
    validation.ts       # sanitizeInput + validators
    football.ts         # positions, foot, age categories, objectives
    football-surface.ts # signal-based label generation
    booking.ts          # slot availability, normalizeTime
    date.ts             # startOfWeek, addDays, formatters
    reviews.ts          # averages
    roles.ts            # normalizeUserRole, getDashboardPathForRole
    profile-sync.ts     # auth.user -> profiles + coaches table
    session-feedback.ts # v2 feedback helpers + legacy migration
    chart-data.ts       # Recharts helpers + mock fallbacks
    coach-avatars.ts    # deterministic hash-based avatar pool
    mock-data.ts        # 8 coaches, 8 players, 9 sessions, 32 messages, etc.
  proxy.ts              # Next.js 16 replacement for middleware.ts
                        # - Auth gate for /dashboard, /booking, /sessions, /messages
                        # - CSP + security headers + Cache-Control
e2e/
  smoke.spec.ts         # Playwright smoke tests
supabase/
  schema.sql            # Base schema (run first)
  seed.sql              # Demo data (optional)
  migrations/
    001_add_missing_columns_and_rpcs.sql
    002_phase1_football_refactor.sql
    003_unread_messages.sql       # last_read_at + RPCs  (APPLIED in prod)
    004_cancel_session.sql        # cancel RPC           (APPLIED in prod)
    005_notifications.sql         # table + triggers     (APPLIED in prod)
    006_admin_panel.sql           # coaches.verified     (APPLIED in prod)
playwright.config.ts
vitest.config.ts        # excludes e2e/
.vercel/                # Linked to kykooooos-projects/performx
```

## Architecture patterns

### Live/Demo fallback

All data fetching uses `withPublicFallback()` from `src/lib/data/core.ts`. Returns `DataResult<T>` with `mode: "live" | "demo"`:
- **Live**: Supabase configured + data returned
- **Demo**: Missing config or empty data, falls back to mock data in `src/lib/mock-data.ts`

Pages work fully offline with mock data. In production `NEXT_PUBLIC_DEMO_MODE=false` so the demo login panel is hidden, but the data-layer fallback still operates if Supabase returns empty.

### Authentication & roles

Three roles: `player`, `coach`, `parent`. Role is stored in:
- `auth.users.raw_user_meta_data.role`
- `profiles.role`

`src/lib/profile-sync.ts` upserts profile + coach row on login. Role determines dashboard redirect via `src/lib/roles.ts`.

**Server-side auth protection** (in `src/proxy.ts`):
- Protected prefixes: `/dashboard`, `/booking`, `/sessions`, `/messages`
- Unauthenticated users redirected to `/auth/login?redirect=<original>`
- Login client reads `redirect` param and navigates there post-login
- Requires `@supabase/ssr` cookie-based storage — already wired in `supabase.ts`

### Public vs private data

- Public surfaces (directories, profiles) read from `public_coaches`, `public_players`, `public_reviews` views
- Authenticated surfaces (dashboards, bookings, messages) read from private tables with RLS

### Pagination

Coach and player listings use `getCoachDirectoryPaginated(page, pageSize=12)` / `getPlayerDirectoryPaginated`. They return `{ items, total, hasMore }`. UI shows "Voir plus" button.

### ISR

`/coach` and `/players` pages export `revalidate = 300` (5 min cache).

### Lazy loading

- Homepage (`src/app/page.tsx`) uses `next/dynamic` for `FeaturedCoaches` and `PublicStats`
- Dashboard clients already dynamically imported from their server pages

### Database

Schema has RLS on all tables. Key RPCs:
- `create_booking_with_conversation` — Atomic booking + conversation creation
- `cancel_session(session_id)` — Cancels upcoming session with 24h notice policy + sends system message
- `get_player_progression`, `get_player_skills` — Dashboard chart data (feedback v2)
- `get_parent_child_overview` — Parent dashboard metrics
- `generate_parent_link_code`, `link_parent_to_child` — Parent-child linking (7-day codes)
- `get_total_unread_count()` — Total unread messages for current user
- `mark_conversation_read(conv_id)` — Updates `last_read_at`
- `get_unread_notification_count()`, `mark_notifications_read()` — Notifications system

Session feedback uses v2 JSONB format with 5 axes: technique, tactique, physique, intensite, mental.

**Tables added in this session**:
- `notifications` — user-facing notifs (type, title, body, read, href) with RLS
- `conversation_participants.last_read_at` column for unread tracking
- `coaches.verified` boolean for admin approval

**Triggers added**:
- `trg_notify_on_new_booking` — creates notification for coach on each booking
- `trg_notify_on_session_feedback` — creates notification for player when coach fills feedback

## Environment variables

Required:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Production (Vercel) — current values:
```
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SENTRY_DSN=<set>
```

Optional (demo mode — only for local dev):
```
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_PLAYER_EMAIL / PASSWORD
NEXT_PUBLIC_DEMO_COACH_EMAIL / PASSWORD
NEXT_PUBLIC_DEMO_PARENT_EMAIL / PASSWORD
```

## Conventions

- All UI text is in French
- CSS utility classes prefixed with `px-` (px-button, px-input, px-badge, px-pill, etc.)
- Components use `"use client"` directive when needed
- Form validation in `src/lib/validation.ts` (8+ chars, 1 uppercase, 1 digit, 1 special char for passwords)
- `sanitizeInput()` uses `/<\/?[a-zA-Z!][^>]*>/g` — preserves innocent `<` `>` (e.g. "3 < 5") while stripping real HTML tags
- Football-specific helpers in `src/lib/football.ts` (positions, foot, age categories)

## What was done in the April 2026 session (13 improvements)

All 13 items from the improvement plan are **completed, committed, and deployed**:

1. **Middleware auth** — `src/proxy.ts` has `checkAuth()` gate using `@supabase/ssr` server client. Redirects unauthenticated users to login with `?redirect=<path>`. Demo mode skips auth.
2. **Robust sanitization** — Fixed regex that was eating `< >` in plain text.
3. **Real unread count** — `top-nav.tsx` calls `get_total_unread_count()` RPC on mount and subscribes to `messages` INSERT events via Supabase Realtime for instant updates.
4. **Paginated listings** — Server-side pagination (12 per page) with "Voir plus" on coach/player directories.
5. **Lazy loading** — Homepage uses `dynamic()` for below-the-fold components.
6. **Session cancellation** — Cancel button on upcoming sessions; `cancel_session()` RPC enforces 24h notice + posts cancellation message in the conversation.
7. **Server Actions** — `src/app/actions/booking.ts` has `submitReview()` and `sendMessage()` with server-side validation.
8. **Notifications system** — `notifications` table, RLS, two triggers (new booking → coach, new feedback → player), count/mark-read RPCs. UI bell component NOT YET built (backend ready).
9. **Legal pages** — `/legal/mentions`, `/legal/cgu`, `/legal/confidentialite`, `/contact`. Footer links updated.
10. **ISR** — `revalidate = 300` on coach/player directory pages.
11. **SlotCalendar** — New `src/components/slot-calendar.tsx` for booking step 2 with week navigation.
12. **Playwright E2E** — Setup + smoke tests (homepage, auth, nav, legal, redirects). Run with `npx playwright test`.
13. **Admin panel** — `/admin` with `checkIsAdmin()` (email allowlist + `profiles.role='admin'`), coach approval queue, stats dashboard. Current admin: `kyky76700@gmail.com`.

## Production deployment

- **Hosting**: Vercel (project `kykooooos-projects/performx`, linked in `.vercel/`)
- **URL**: https://performx-six.vercel.app
- **Auto-deploy**: every push to `main` triggers a production deployment
- **Database**: Supabase (project ref `ibzamtiesrdbvmbkcqri`) — all 6 migrations applied
- **Custom domain**: NOT YET configured. User will add one later via Vercel > Settings > Domains. When added, MUST also update Supabase Auth > URL Configuration > Site URL to match.

## What was done in the April 29 2026 follow-up session (5 coach feedback fixes)

After the production beta soft launch, coach Gaetan reported 5 issues. 4 were fixed, 1 needs more info:

1. **Player visibility on coach calendar (issue 2)** — `coach-dashboard-client.tsx`: reserved cells on day/week/month calendar views now display the player's name (from `playersInfo` populated by `getCoachDashboardData`). Anchored links to `#section-sessions` for full details.
2. **"1 slot = 1 player" hint (issue 3)** — `recurring-availability-panel.tsx`: explicit accent banner at top of availability panel explains that each slot is for one player only. To offer the same time to multiple players, the coach must create multiple slots.
3. **"Manage availability" button on coach profile (issue 4)** — `coach-profile-edit-client.tsx`: primary button "Gérer mes disponibilités" linking to `/dashboard/coach#section-dispos` (the section anchor exists in the dashboard).
4. **Multi-day unavailability (issue 1)** — `recurring-availability-panel.tsx`: block form now accepts a date range (Du / Au optional). Submit creates one row per day in `coach_availability_exceptions` (max 90 days, dedupes silently). NOTE: this is a UI-only fix; the underlying schema still has one row per day. A cleaner refactor would add a `blocked_until date NULL` column and update the `expand_coach_availability` RPC to skip date ranges.
5. **iPhone error (issue 5) — NOT FIXED** — Gaetan sent a screenshot of `error.tsx` rendering on a player's iPhone, but no specific page or reproduction steps were provided. As a workaround, `error.tsx` now displays a "Détails techniques (à envoyer au support)" expandable section with full diagnostic info (URL, user agent, error message, stack, digest) and a copy-to-clipboard button. Next step: ask the player to tap "Détails techniques" → "Copier les détails" → send to support.

## Known limitations / what's still missing

- **Payment**: bookings always get `payment_status: 'paid'` automatically. No Stripe integration.
- **Email/push notifications**: notification records exist in DB but no email delivery (would need Supabase Edge Function or external webhook).
- **Notification bell UI**: backend is ready (`get_unread_notification_count`, `mark_notifications_read`, `notifications` table), but no UI component in `top-nav.tsx` yet.
- **OAuth Google/Facebook**: disabled ("Bientot disponible") — buttons are in login page but `disabled`.
- **Message attachments**: not implemented.
- **Social media links** (Instagram, X, LinkedIn): point to `#`.
- **Coach rescheduling**: players can cancel, but there's no "Reprogrammer" shortcut. User can re-book manually.
- **Coach diploma file review**: admin panel shows coach name/speciality/diplomas list, but doesn't display uploaded files from `documents/diplomas/` storage bucket.
- **SEO**: `robots.ts` and `sitemap.ts` configured. NOT YET submitted to Google Search Console.

## How to think about changes

- **Database changes**: create a new migration file in `supabase/migrations/` with the next number (007, 008, ...). Apply it via Supabase MCP tool `apply_migration` or paste into SQL editor.
- **Mutations from client**: prefer adding to `src/app/actions/booking.ts` (or a new `actions/*.ts`) with server-side validation rather than calling supabase directly from a client component.
- **New pages**: server component `page.tsx` that dynamically imports a `*-client.tsx` (keeps initial bundle lean). Export `metadata` for SEO.
- **Tests**: unit tests in `src/test/`, E2E tests in `e2e/`. Keep vitest excluded from `e2e/`.
- **After changes**: run `npm run build` + `npm test` before committing. `npm run lint` for cleanup.

## Git workflow

- Default branch: `main`
- Commits are made with `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` footer
- Pushing to `main` triggers Vercel production deploy automatically
- Never force-push to `main`
