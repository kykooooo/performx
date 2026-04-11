# CLAUDE.md - PerformX

## Project overview

PerformX is a French-language football coaching platform connecting players, coaches, and parents. Built with Next.js 16 (App Router), Supabase, and Tailwind CSS v4.

## Tech stack

- **Framework**: Next.js 16.1.6 with App Router, React 19, TypeScript 5.9
- **Backend**: Supabase (Auth, Postgres, Storage, RPCs)
- **Styling**: Tailwind CSS v4, dark athletic theme (accent: #ff6a00)
- **Fonts**: Bebas Neue (display), Manrope (body)
- **Charts**: Recharts
- **Monitoring**: Sentry
- **Tests**: Vitest + Testing Library
- **Deployment**: Vercel

## Commands

- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm test` — Run tests (vitest run)
- `npm run test:watch` — Watch mode

## Project structure

```
src/
  app/              # Next.js pages (App Router)
    auth/           # Login, register (player/coach/parent), verify
    booking/        # Booking flow + confirmation
    coach/          # Coach directory + [id] profile
    dashboard/      # Role-specific dashboards (player/coach/parent)
    messages/       # Messaging system
    players/        # Player directory + [id] profile
    sessions/       # Session calendar
  components/       # Shared components (24 files)
  lib/              # Utilities, data layer, types
    data/           # Supabase queries with live/demo fallback
supabase/
  schema.sql        # Full schema (run first in SQL Editor)
  seed.sql          # Demo data (run after schema)
  migrations/       # Incremental migrations
```

## Architecture patterns

### Live/Demo fallback

All data fetching uses `withPublicFallback()` from `src/lib/data/core.ts`. Returns `DataResult<T>` with `mode: "live" | "demo"`:
- **Live**: Supabase configured + data returned
- **Demo**: Missing config or empty data, falls back to mock data in `src/lib/mock-data.ts`

Pages work fully offline with mock data.

### Authentication & roles

Three roles: `player`, `coach`, `parent`. Role is stored in:
- `auth.users.raw_user_meta_data.role`
- `profiles.role`

`src/lib/profile-sync.ts` upserts profile + coach row on login. Role determines dashboard redirect via `src/lib/roles.ts`.

### Public vs private data

- Public surfaces (directories, profiles) read from `public_coaches`, `public_players`, `public_reviews` views
- Authenticated surfaces (dashboards, bookings, messages) read from private tables with RLS

### Database

Schema has RLS on all tables. Key RPCs:
- `create_booking_with_conversation` — Atomic booking + conversation creation
- `get_player_progression`, `get_player_skills` — Dashboard chart data (feedback v2)
- `get_parent_child_overview` — Parent dashboard metrics
- `generate_parent_link_code`, `link_parent_to_child` — Parent-child linking

Session feedback uses v2 JSONB format with 5 axes: technique, tactique, physique, intensite, mental.

## Environment variables

Required:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Optional (demo mode):
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
- Football-specific helpers in `src/lib/football.ts` (positions, foot, age categories)

## Known limitations

- OAuth Google/Facebook: disabled ("Bientot disponible")
- Message attachments: not yet available
- Footer legal links (CGU, Mentions legales, Confidentialite, Contact): point to `#`
- Social media links (Instagram, X, LinkedIn): point to `#`
