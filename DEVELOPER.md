# CricketHub — Developer Documentation

> Multi-tenant SaaS for cricket match management, live scoring, tournaments & analytics.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Key Features & Code Flow](#key-features--code-flow)
7. [Local Development Setup](#local-development-setup)
8. [Environment Variables](#environment-variables)
9. [Supabase Setup & Commands](#supabase-setup--commands)
10. [Deployment — Vercel](#deployment--vercel)
11. [Deployment — Netlify](#deployment--netlify)
12. [Deployment — Other Platforms](#deployment--other-platforms)
13. [Database Migrations](#database-migrations)
14. [Edge Functions](#edge-functions)
15. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS 3, shadcn/ui (Radix primitives) |
| **State** | TanStack React Query (server state), React useState (local) |
| **Routing** | React Router DOM 6 |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Supabase (PostgreSQL, Auth, RLS, Edge Functions, Realtime) |
| **Build Tool** | Vite with SWC plugin |
| **Testing** | Vitest, Playwright |
| **Package Manager** | npm / bun |

---

## Project Structure

```
├── public/                     # Static assets (manifest, robots.txt, SVGs)
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components (button, dialog, card, etc.)
│   │   ├── forms/              # Form dialogs (MatchFormDialog, PlayerFormDialog, etc.)
│   │   ├── scoring/            # Live scoring components (BatsmanSelect, BowlerSelect, celebrations)
│   │   ├── AppSidebar.tsx      # Desktop sidebar navigation
│   │   ├── MobileBottomNav.tsx # Mobile bottom tab bar + More sheet
│   │   ├── DashboardLayout.tsx # Main layout wrapper (sidebar + content)
│   │   ├── ProtectedRoute.tsx  # Auth guard with permission check
│   │   ├── PublicLayout.tsx    # Layout for public pages (no auth required)
│   │   ├── MatchCard.tsx       # Match display card
│   │   ├── StatCard.tsx        # Dashboard stat card
│   │   ├── TournamentBracket.tsx # Tournament bracket visualization
│   │   └── NotificationBell.tsx # Notification dropdown
│   ├── hooks/
│   │   ├── useAuth.tsx         # Auth context (session, user, org, role)
│   │   ├── usePermissions.ts   # Role-based permission system
│   │   ├── use-mobile.tsx      # Mobile detection hook
│   │   ├── use-long-press.ts   # Long press gesture hook (scoring buttons)
│   │   ├── use-pull-to-refresh.ts # Pull-to-refresh for mobile
│   │   └── use-swipe-nav.ts    # Swipe navigation between pages
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts       # ⚠️ AUTO-GENERATED — DO NOT EDIT
│   │       └── types.ts        # ⚠️ AUTO-GENERATED — DO NOT EDIT
│   ├── lib/
│   │   ├── utils.ts            # Tailwind merge utility (cn function)
│   │   ├── mock-data.ts        # Mock data for development
│   │   ├── scorecard-data.ts   # Scorecard computation helpers
│   │   └── boundary-sound.ts   # Audio feedback for boundaries
│   ├── pages/
│   │   ├── Index.tsx           # Dashboard (admin home)
│   │   ├── Auth.tsx            # Login/Signup page
│   │   ├── OrgSetup.tsx        # Organization creation wizard
│   │   ├── LiveScoring.tsx     # ⭐ Core: Ball-by-ball live scoring engine
│   │   ├── Matches.tsx         # Match listing & creation
│   │   ├── Teams.tsx           # Team management
│   │   ├── Players.tsx         # Player management
│   │   ├── Tournaments.tsx     # Tournament management
│   │   ├── Analytics.tsx       # Stats & leaderboards
│   │   ├── Scorecard.tsx       # Detailed match scorecard
│   │   ├── Settings.tsx        # Org settings, roles, permissions
│   │   ├── Documentation.tsx   # Admin documentation (this system guide)
│   │   ├── Public*.tsx         # Public-facing pages (no auth)
│   │   └── ...
│   ├── App.tsx                 # Route definitions
│   ├── main.tsx                # Entry point
│   └── index.css               # Design tokens (CSS variables, Tailwind base)
├── supabase/
│   ├── config.toml             # Supabase project config
│   └── migrations/             # SQL migration files (chronological)
├── tailwind.config.ts          # Tailwind configuration with custom tokens
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                    Frontend                       │
│   React + Vite + Tailwind + shadcn/ui            │
│                                                   │
│   ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
│   │  Pages   │  │  Hooks   │  │  Components   │  │
│   │(routing) │  │(useAuth  │  │ (UI, forms,   │  │
│   │          │  │ useQuery)│  │  scoring)     │  │
│   └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│        │             │               │            │
│        └─────────────┴───────────────┘            │
│                      │                            │
│              Supabase JS Client                   │
│        (src/integrations/supabase/client.ts)      │
└──────────────────────┬───────────────────────────┘
                       │ HTTPS
┌──────────────────────┴───────────────────────────┐
│                  Supabase Cloud                   │
│                                                   │
│  ┌──────────┐  ┌─────────┐  ┌──────────────────┐│
│  │ PostgREST│  │  Auth   │  │  Edge Functions  ││
│  │  (API)   │  │(JWT,RLS)│  │  (Deno runtime)  ││
│  └────┬─────┘  └────┬────┘  └────────┬─────────┘│
│       │             │                │           │
│  ┌────┴─────────────┴────────────────┴─────────┐ │
│  │            PostgreSQL Database               │ │
│  │  Tables: organizations, profiles, teams,     │ │
│  │  players, matches, innings, balls,           │ │
│  │  tournaments, user_roles, role_permissions,  │ │
│  │  notifications, player_stats, match_summaries│ │
│  │  + RLS Policies + DB Functions + Triggers    │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Multi-Tenancy

- Every data table has `organization_id`
- RLS policies enforce `user_in_org(auth.uid(), organization_id)`
- Users → Profiles → Organizations (linked via `profiles.organization_id`)
- `user_roles` table maps `(user_id, organization_id, role)`

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant/org container |
| `profiles` | User profile (linked to `auth.users`) |
| `user_roles` | Role assignments (admin, moderator, scorer, viewer) |
| `role_permissions` | Custom permission overrides per role |
| `teams` | Cricket teams with name, short_name, color |
| `players` | Player registry (name, role, batting/bowling style) |
| `team_players` | Many-to-many: players ↔ teams |
| `matches` | Match definition (teams, overs, venue, status) |
| `innings` | Innings data (runs, wickets, overs, extras) |
| `balls` | Ball-by-ball records (the core scoring data) |
| `tournaments` | Tournament definitions |
| `tournament_teams` | Many-to-many: teams ↔ tournaments |
| `player_stats` | Aggregated career stats (auto-computed on match complete) |
| `match_summaries` | Denormalized match results (auto-generated) |
| `notifications` | In-app notifications |

### Key Enums

```sql
app_role:         'admin' | 'moderator' | 'scorer' | 'viewer'
match_status:     'upcoming' | 'live' | 'completed' | 'abandoned'
innings_status:   'in_progress' | 'completed' | 'yet_to_bat'
player_role:      'batsman' | 'bowler' | 'all-rounder' | 'wicketkeeper'
tournament_format: 'league' | 'knockout' | 'round-robin' | 'short-chris'
extra_type:       'wide' | 'no-ball' | 'bye' | 'leg-bye'
```

### Key DB Functions

| Function | Purpose |
|----------|---------|
| `has_role(user_id, org_id, role)` | Check if user has specific role (SECURITY DEFINER) |
| `user_in_org(user_id, org_id)` | Check if user belongs to org |
| `get_user_org_id(user_id)` | Get user's organization ID |
| `handle_new_user()` | Trigger: auto-create profile on signup |
| `archive_completed_match()` | Trigger: compute stats + create summary on match complete |
| `notify_org_members()` | Trigger: send notifications on entity creation |
| `delete_organization_cascade(org_id)` | Cascade delete entire org data |

### RLS Pattern

```sql
-- Every table follows this pattern:
-- SELECT: user_in_org(auth.uid(), organization_id)
-- ALL (admin): has_role(auth.uid(), organization_id, 'admin')
-- Public tables also have anon SELECT policies
```

---

## Authentication & Authorization

### Auth Flow

```
1. User signs up → email verification → login
2. handle_new_user() trigger creates profile
3. User goes to /org-setup → creates organization
4. User gets 'admin' role in user_roles
5. Subsequent users join org → pending approval (is_approved = false)
6. Admin approves → user gets role assignment
```

### Permission System (`usePermissions.ts`)

```typescript
// Hierarchical permissions:
// "matches"       → view matches page
// "matches.create" → create new matches
// "matches.edit"   → edit match details

// Check in components:
const { hasPermission } = usePermissions();
if (hasPermission("scoring")) { /* show scoring UI */ }

// Route-level protection:
<ProtectedRoute requiredPermission="matches">
  <Matches />
</ProtectedRoute>
```

### Role Defaults

| Permission | Admin | Moderator | Scorer | Viewer |
|-----------|-------|-----------|--------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Matches | ✅ | ✅ | ✅ | ✅ |
| Create Matches | ✅ | ✅ | ❌ | ❌ |
| Live Scoring | ✅ | ✅ | ✅ | ❌ |
| Teams | ✅ | ✅ | ✅ | ✅ |
| Players | ✅ | ✅ | ✅ | ✅ |
| Tournaments | ✅ | ✅ | ❌ | ✅ |
| Analytics | ✅ | ✅ | ❌ | ✅ |
| Settings | ✅ | ❌ | ❌ | ❌ |

---

## Key Features & Code Flow

### Live Scoring Engine (`src/pages/LiveScoring.tsx`)

This is the most complex component (~2400 lines). Key flow:

```
1. MatchSelector → user picks upcoming/live match
2. TossEntry → toss winner + bat/bowl decision
3. BatsmanSelectDialog → opening batsmen
4. BowlerSelectDialog → opening bowler
5. Scoring Loop:
   a. User taps run button (0-6) → addBall()
   b. addBall() → saveBall mutation
   c. saveBall: INSERT into balls → recompute innings totals from DB → UPDATE innings
   d. checkInningsEnd(): all-out? overs complete? target reached?
   e. End of over: rotate strike + prompt new bowler
   f. Wicket: prompt new batsman (unless all out)
6. First innings complete → InningsSummary → start second innings
7. Second innings complete → match result computed → endMatch mutation
```

**Short Chris Rules:**
- `is_short_chris = true` on match
- `batting_option = 1` → solo batting (1 batsman)
- `batting_option = 2` → duo batting (2 batsmen, default)
- **6 = Out**: In Short Chris, hitting a six automatically dismisses the batsman
- `max_overs_per_bowler`: Limits how many overs each bowler can bowl

**Data Integrity:**
- Innings totals are **recomputed from all balls** in DB after each ball (not incremental)
- This prevents stale state issues from React's async nature
- Undo also recomputes from remaining balls

### Tournament System

```
Tournament → has format (league/knockout/round-robin/short-chris)
Tournament → has teams (via tournament_teams)
Tournament → matches reference tournament_id
Short Chris tournament: batting_option + max_overs_per_bowler stored on tournament
When creating match from tournament: settings inherit from tournament
```

### Player Stats Auto-Computation

The `archive_completed_match()` trigger fires when `matches.status` changes to `'completed'`:
- Aggregates batting stats **per-innings** from balls (runs, 4s, 6s, balls faced)
- Correctly counts fifties (50-99 in one innings) and hundreds (100+ in one innings)
- Aggregates bowling stats (overs, runs conceded, wickets)
- Aggregates fielding stats (catches, run outs, stumpings)
- Ensures `matches_played` is incremented only once per unique player
- Upserts into `player_stats` table
- Creates/updates `match_summaries` for quick result display

### Player Rankings System

Performance-based auto-ranking with three categories:

**Batting Rating:**
```
rating = (avg × 3) + (SR × 0.8) + (runs × 0.5) + (4s × 2 + 6s × 5) + (50s × 15 + 100s × 50)
```

**Bowling Rating:**
```
rating = (wickets × 25) + economy_bonus + average_bonus + (5W × 40)
```

**All-Rounder Rating:**
```
rating = (batting_rating × 0.5) + (bowling_rating × 0.5)
```

Rankings are available on both the admin Rankings page and the Public Leaderboard page.

### Stats Recalculation

Admin can trigger a full recalculation of `player_stats` from historical ball data via Settings. This truncates and rebuilds all stats from the `balls` table, ensuring accuracy after bug fixes or data corrections.

---

## Local Development Setup

### Prerequisites

- Node.js 18+ (or Bun)
- npm / bun
- Git
- Supabase CLI (for local backend development)

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd crickethub

# 2. Install dependencies
npm install
# or
bun install

# 3. Create .env file
cp .env.example .env
# Fill in your Supabase credentials (see Environment Variables section)

# 4. Start development server
npm run dev
# App runs at http://localhost:8080

# 5. Run tests
npm test

# 6. Build for production
npm run build
```

### Available Scripts

```bash
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run Vitest tests
npm run test:watch   # Run tests in watch mode
```

---

## Environment Variables

Create a `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...your-anon-key
```

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project API URL | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | ✅ |

> ⚠️ Never commit `.env` to Git. The `.gitignore` already excludes it.

---

## Supabase Setup & Commands

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm (cross-platform)
npm install -g supabase

# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Login & Link Project

```bash
# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref your-project-ref
# You'll need the database password

# Check status
supabase status
```

### Create New Supabase Project (from scratch)

```bash
# 1. Go to https://supabase.com/dashboard
# 2. Create new project
# 3. Note down:
#    - Project URL (VITE_SUPABASE_URL)
#    - Anon Key (VITE_SUPABASE_PUBLISHABLE_KEY)
#    - Service Role Key (for admin operations)
#    - Database Password
#    - Project Ref ID
```

### Database Migrations

```bash
# Push all migrations to remote database
supabase db push

# Create a new migration
supabase migration new <migration_name>
# Edit the generated file in supabase/migrations/

# Check migration status
supabase migration list

# Reset local database (⚠️ destructive)
supabase db reset

# Generate types from database schema
supabase gen types typescript --project-id your-project-ref > src/integrations/supabase/types.ts

# Diff local vs remote schema
supabase db diff
```

### Apply All Migrations to Fresh Database

```bash
# This runs all migration files in order
supabase db push

# If you need to apply specific migration
psql $DATABASE_URL -f supabase/migrations/20260330172518_dbbc1ba2.sql
```

### Edge Functions

```bash
# Create new edge function
supabase functions new <function-name>

# Deploy a specific function
supabase functions deploy <function-name>

# Deploy all functions
supabase functions deploy

# Test locally
supabase functions serve

# View function logs
supabase functions logs <function-name>

# Set secrets for edge functions
supabase secrets set MY_API_KEY=value

# List secrets
supabase secrets list
```

### Useful Supabase SQL Commands

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Check all functions
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public';

-- Check triggers
SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers;

-- Reset a user's role
UPDATE user_roles SET role = 'admin' WHERE user_id = 'uuid-here';

-- Check user's org
SELECT p.user_id, p.organization_id, o.name FROM profiles p JOIN organizations o ON o.id = p.organization_id;

-- Fix innings totals (recompute from balls)
UPDATE innings SET
  total_runs = (SELECT COALESCE(SUM(runs_scored + extra_runs), 0) FROM balls WHERE innings_id = innings.id),
  total_wickets = (SELECT COUNT(*) FROM balls WHERE innings_id = innings.id AND is_wicket = true),
  total_overs = (
    SELECT ROUND(COUNT(*)::numeric / 6, 1) 
    FROM balls WHERE innings_id = innings.id 
    AND (extra_type IS NULL OR extra_type IN ('bye', 'leg-bye'))
  );
```

---

## Deployment — Vercel

### First-Time Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy (follow prompts)
vercel

# 4. Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY

# 5. Deploy to production
vercel --prod
```

### Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> ⚠️ The `rewrites` rule is **critical** for SPA routing. Without it, direct URL access (e.g., `/dashboard`) will return 404.

### Vercel CLI Commands

```bash
vercel                  # Deploy to preview
vercel --prod           # Deploy to production
vercel env ls           # List environment variables
vercel env add          # Add environment variable
vercel env rm           # Remove environment variable
vercel logs             # View deployment logs
vercel domains add      # Add custom domain
vercel inspect          # Inspect deployment
```

### GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Import your GitHub repository
4. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Every push to `main` auto-deploys to production
6. PRs get preview deployments automatically

---

## Deployment — Netlify

### Setup

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Initialize
netlify init

# 4. Deploy
netlify deploy --prod
```

### Netlify Configuration

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Netlify Commands

```bash
netlify deploy              # Deploy to draft URL
netlify deploy --prod       # Deploy to production
netlify env:set KEY value   # Set environment variable
netlify env:list            # List environment variables
netlify open                # Open site in browser
netlify logs                # View function logs
```

---

## Deployment — Other Platforms

### Cloudflare Pages

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login
wrangler login

# 3. Create Pages project
wrangler pages project create crickethub

# 4. Build & deploy
npm run build
wrangler pages deploy dist

# 5. Set env vars in Cloudflare dashboard
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Build & run
docker build -t crickethub .
docker run -p 80:80 crickethub
```

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login & init
firebase login
firebase init hosting
# Select: dist as public directory
# Configure as SPA: Yes

# Deploy
npm run build
firebase deploy
```

---

## Design System

### CSS Variables (`src/index.css`)

The app uses HSL-based CSS custom properties:

```css
:root {
  --background: 218 20% 7%;        /* #0f1419 dark bg */
  --primary: 142 60% 45%;          /* Cricket green */
  --accent: 32 95% 55%;            /* Orange accent */
  --card: 218 18% 10%;             /* Card bg */
  /* ... see index.css for full token list */
}
```

### Font Stack

- **Display (headings):** Space Grotesk
- **Body:** Inter

### Component Pattern

```typescript
// Always use semantic tokens, never raw colors:
// ✅ Good:
className="bg-card text-foreground border-border"

// ❌ Bad:
className="bg-[#1a1f2e] text-white border-gray-700"
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|---------|
| "Missing data" in scoring | Check if `strikerId`, `bowlerId` are set before `saveBall` |
| Innings totals mismatch | Totals are recomputed from balls; check `supabase` query in `saveBall` |
| RLS policy error | Ensure user has correct role in `user_roles` table |
| "Overs complete" error | `legalBalls >= maxOvers * 6` — check ball count vs match overs |
| Auth redirect loop | Check `ProtectedRoute` — user may not have `organization_id` set |
| Types out of sync | Run `supabase gen types typescript` to regenerate types |
| Migration failed | Check for existing objects; use `IF NOT EXISTS` in SQL |

### Debug Commands

```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/ -H "apikey: your-anon-key"

# Check auth
curl https://your-project.supabase.co/auth/v1/health

# View real-time logs
supabase logs --type api
supabase logs --type auth
supabase logs --type postgres

# Run SQL directly
supabase db execute --sql "SELECT COUNT(*) FROM matches;"
```

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes following the existing patterns
3. Run tests: `npm test`
4. Run lint: `npm run lint`
5. Build check: `npm run build`
6. Submit PR with clear description

### Code Style Guidelines

- Use TypeScript strict mode
- Use `@/` path aliases for imports
- Use TanStack Query for all server state
- Use `toast` (sonner) for user feedback
- Use semantic CSS tokens from `index.css`
- Keep components under 300 lines; extract sub-components
- Use `useCallback` for functions passed as props
- Handle loading/error states in every query

---

*Last updated: April 2026*
