# PerformX Codebase Map

## 1. Product summary

PerformX is a demo-first platform for individual football coaching.

The product currently models 3 user experiences:

- Player
- Coach
- Parent

Important: in the database, the "parent" role is stored as `club`.

The app is built so it can still run and look complete even when Supabase is not configured. That design choice explains a lot of the codebase.

## 2. Stack

- Next.js 16 App Router
- React 19
- TypeScript 5.9
- Tailwind CSS v4
- Supabase JS v2
- Recharts for dashboard charts
- Sentry for error monitoring
- Plausible or Google Analytics for analytics
- Vitest + Testing Library for tests

## 3. Runtime modes

The project behaves differently depending on environment:

### A. Full live mode

Supabase env vars exist, user is authenticated, tables/views/RPCs exist.

- Reads come from Supabase
- Writes go to Supabase
- Realtime messaging can work
- Role redirects are active

### B. Hybrid demo mode

Supabase exists but returns empty data or some entities are missing.

- Many pages silently fall back to `src/lib/mock-data.ts`
- UI still looks "complete"
- Some flows are live, others remain local/demo

### C. Offline demo mode

Supabase env vars are missing.

- `src/lib/supabase.ts` exposes a proxy client with no-op reads
- Public pages still render
- Auth methods resolve with "Supabase not configured"
- Dashboards, listings, sessions, messages, stats all lean on mock data

## 4. High-level architecture

### Frontend shell

- `src/app/layout.tsx`: global HTML shell, fonts, analytics injection, auth listener
- `src/middleware.ts`: CSP nonce, security headers, cache policy by route family
- `src/app/globals.css`: full design system, motion, dark/light theme tokens
- `src/components/app-shell.tsx`: main app wrapper with nav + footer
- `src/components/top-nav.tsx`: navigation, auth state, mobile drawer, demo unread badge

### Core route families

- Public marketing: `/`
- Coach directory + profile: `/coach`, `/coach/[id]`
- Player directory + profile: `/players`, `/players/[id]`
- Auth: `/auth/login`, `/auth/register/*`, `/auth/verify`
- Booking: `/booking`, `/booking/confirmation`
- Private product areas: `/dashboard/*`, `/sessions`, `/messages`

## 5. Where the real business logic lives

The densest files are:

- `src/lib/mock-data.ts`
- `src/app/dashboard/coach/coach-dashboard-client.tsx`
- `src/app/messages/messages-client.tsx`
- `src/app/booking/booking-client.tsx`
- `src/app/dashboard/player/player-dashboard-client.tsx`
- `src/app/dashboard/parent/club-client.tsx`

Those files carry most of the real product behavior, not just UI.

## 6. Main domain model

### Core tables

- `profiles`: user identity, role, player fields, avatar, player rating counters
- `coaches`: coach public profile, pricing, availability, coach rating counters
- `sessions`: coach/player meeting, slot, status, optional feedback
- `bookings`: payment layer attached to sessions
- `reviews`: players review coaches
- `player_reviews`: coaches review players
- `conversations`: chat container
- `conversation_participants`: conversation membership
- `messages`: chat messages

### Public read surfaces

- `public_coaches`
- `public_reviews`
- `public_player_reviews`
- `public_sessions`
- `public_players`

Important: `public_sessions` and `public_players` are not simple source tables. They are synchronized public mirrors so anonymous/public reads stay simple.

### RPCs

- `create_booking_with_conversation(...)`
- `get_coach_monthly_activity(...)`
- `get_coach_day_distribution(...)`
- `get_player_progression(...)`
- `get_player_skills(...)`
- `get_parent_metrics(...)`

## 7. Critical product flows

### Auth and profile sync

1. User signs in or signs up.
2. `AuthListener` listens to auth state changes.
3. `syncProfile(user)` upserts `profiles`.
4. If role is coach, `syncProfile` also upserts `coaches`.
5. User is redirected by role:
   - coach -> `/dashboard/coach`
   - club -> `/dashboard/parent`
   - player -> `/dashboard/player`

### Booking flow

1. Player picks a coach and a free slot in `/booking`.
2. Frontend reads coach availability from `public_coaches`.
3. Frontend subtracts reserved slots using `public_sessions`.
4. Confirmation calls `create_booking_with_conversation`.
5. RPC creates:
   - a `sessions` row
   - a `bookings` row
   - a conversation if none exists yet
   - an initial message announcing the booking
6. User is redirected to `/booking/confirmation`.

### Reviews and ratings

1. Players can review coaches through `reviews`.
2. Coaches can review players through `player_reviews`.
3. DB triggers recompute:
   - coach `rating` and `reviews_count`
   - player `rating` and `reviews_count`

### Public mirrors

DB triggers keep these in sync:

- `sessions` -> `public_sessions`
- `profiles` with role `player` -> `public_players`

## 8. Route-by-route ownership map

### `/`

- Pure marketing + demo positioning
- Uses `FeaturedCoaches` and `PublicStats`
- SEO and JSON-LD are present

### `/coach`

- Public directory
- Reads `public_coaches`
- Falls back to mock coaches
- Filters by search, speciality, city, sorting

### `/coach/[id]`

- Public coach detail
- Reads coach, reviews, public sessions
- Computes available slots client-side
- Lets authenticated players leave a coach review tied to a completed session

### `/players`

- Public player directory
- Reads `public_players`
- Falls back to mock players
- Filters by search, level, position, city

### `/players/[id]`

- Public player detail
- Reads `public_players` and `public_player_reviews`
- If logged in as coach, can leave a player review for completed sessions not yet reviewed

### `/booking`

- Conversion route
- Uses live coaches + public sessions when available
- Uses booking RPC for the real write path

### `/messages`

- Inbox + chat
- Uses conversations, participants, messages, profiles
- Supports demo mode with fake auto-replies
- Has a realtime subscription for inserted messages

### `/sessions`

- Player planning page
- Supports week/month calendar views
- Reads player sessions and coach names
- Falls back to mock sessions

### `/dashboard/coach`

- Coach-facing control center
- Sessions, availability management, chart widgets, calendar
- Can locally add feedback in UI
- Slot updates are persisted when not in demo

### `/dashboard/player`

- Player-facing dashboard
- Upcoming/past sessions, recommendations, charts, quick actions

### `/dashboard/parent`

- Parent-facing dashboard
- Child card, summary metrics, top coaches, quick actions
- More demo-oriented than the other dashboards

## 9. Design system and visual language

The UI is not generic boilerplate. The codebase has a clear visual system:

- dark athletic look by default
- orange accent (`--px-accent`)
- Bebas Neue for display, Manrope for body
- strong glass/card language
- custom utility classes prefixed with `px-`
- optional light theme with a large override layer

Most styling decisions are centralized in `src/app/globals.css`.

## 10. Demo-heavy areas

The following parts are strongly demo-oriented:

- `src/lib/mock-data.ts`
- `src/components/public-stats.tsx`
- all three dashboards when no authenticated/live data exists
- `src/app/messages/messages-client.tsx` demo auto-replies
- login demo credentials panel via `NEXT_PUBLIC_DEMO_*`
- verification screen is simulated client-side

This project is intentionally built to "look launched" before every backend path is fully hard-wired.

## 11. Important implementation realities

### Parent role naming

UI says "parent", DB says `club`.

### Public coach data is richer in mocks than in real reads

The coach detail page shows diplomas/experience only from mock data today. The live query currently pulls a smaller subset.

### Session feedback support is mixed

The database supports `sessions.feedback`, but some dashboard feedback behavior is still local UI behavior instead of a full persisted workflow.

### Registration uses department fields in places later treated as city/location

Several registration screens store a department string in fields later used like a city/location filter. That matters when comparing live user-created data with demo data.

### Parent-child linkage is weakly relational

Parent dashboard data mostly comes from parent metadata and broad session reads, not from a dedicated normalized child relation.

### Unused component

- `src/components/filters.tsx` exists but is not currently imported anywhere

## 12. Test coverage today

Current tests focus on:

- auth step validation
- booking utility logic
- date helpers
- review helpers
- validation helpers
- core UI primitives like breadcrumbs / notices / loading states / skeletons

There is little or no automated coverage today for:

- live Supabase flows
- dashboards
- booking RPC integration
- messaging realtime behavior
- role redirects

## 13. Current local workspace state

At the time of this mapping:

- `node_modules` is missing
- tests and lint cannot run locally until dependencies are installed
- git working tree has an untracked `.claude/` folder

## 14. Best mental model for future work

Treat PerformX as:

- a polished Next.js product shell
- with a strong demo fallback strategy
- progressively connected to Supabase
- where the most important architectural seam is "mock/demo path" vs "live Supabase path"

If you want to change behavior safely, always ask:

1. Is this screen in live mode, demo mode, or both?
2. Does the data come from a source table, a public mirror, or mock data?
3. Is the role name in UI the same as the role value in DB?
4. Is this interaction persisted, or only reflected locally in state?
