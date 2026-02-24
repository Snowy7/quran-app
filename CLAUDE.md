# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Noor** - A Quran reading, listening, and memorization PWA built as a monorepo with:
- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui (PWA with offline support)
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Clerk (optional, for cloud sync)
- **Local Storage**: Dexie (IndexedDB) for offline-first data

## Development Commands

```bash
# Install dependencies
pnpm install

# Initialize Convex (first time only)
cd packages/backend && npx convex dev

# Run both frontend and backend
pnpm dev

# Or run separately:
cd apps/frontend && pnpm dev      # Frontend on port 3000
cd packages/backend && pnpm dev   # Convex backend

# Build all packages
pnpm build

# Lint
pnpm lint

# Deploy Convex to production
cd packages/backend && pnpm deploy
```

## Architecture

### Data Flow
The app uses an **offline-first** architecture:
1. **Dexie (IndexedDB)** stores all user data locally for instant access
2. **Convex** syncs data to the cloud when user is authenticated
3. **Service Worker** (Workbox) caches Quran text and audio for offline use

### Audio System
Uses **native HTML5 Audio** (not Howler.js) for better CORS compatibility. Audio is fetched from:
- Islamic Network CDN
- QuranicAudio

### State Management
- **Zustand** stores in `apps/frontend/src/lib/stores/`
- **Dexie** database in `apps/frontend/src/lib/db/`

## Key Entry Points

| Purpose | Location |
|---------|----------|
| App router | `apps/frontend/src/router.tsx` |
| Root layout | `apps/frontend/src/layouts/root-layout.tsx` |
| Database schema | `packages/backend/convex/schema.ts` |
| Local DB (Dexie) | `apps/frontend/src/lib/db/` |
| Zustand stores | `apps/frontend/src/lib/stores/` |
| UI components | `packages/ui/src/` |
| PWA config | `apps/frontend/vite.config.ts` (VitePWA plugin) |

## Data Model

### Convex Tables (Cloud Sync)
- `users` - Synced from Clerk
- `readingProgress` - Per-surah reading progress
- `bookmarks` - User bookmarks with notes/colors
- `memorization` - Ayah memorization status & spaced repetition
- `userSettings` - Theme, font sizes, reciter preferences

### Dexie Tables (Local Storage)
Mirror the Convex schema for offline-first functionality.

## Routes

```
/                   Home dashboard
/quran              Surah index
/quran/:surahId     Surah reader
/bookmarks          User bookmarks
/memorize           Memorization tracker
/settings           App settings
/search             Search Quran
/prayer-times       Prayer times
/qibla              Qibla compass
/onboarding         First-time setup
```

## Environment Variables

Required in `.env`:
```
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
VITE_PUBLIC_POSTHOG_KEY=phc_xxxxx        # Optional: analytics
VITE_PUBLIC_POSTHOG_HOST=https://...     # Optional: analytics
```

## Code Patterns

- Import UI components from `@template/ui`
- Import Convex API from `@template/backend`
- Use `@/` path alias for frontend src imports
- Clerk auth components: `<SignedIn>`, `<SignedOut>`, `<UserButton>`
- Wrap Clerk provider in `main.tsx` with `VITE_CLERK_PUBLISHABLE_KEY`
