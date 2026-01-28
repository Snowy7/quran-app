# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo template for building full-stack applications with:
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Clerk (user authentication)
- **UI Library**: Reusable component library based on shadcn/ui

## Repository Structure

```
template/
├── apps/
│   └── frontend/           # React + Vite web application
│       └── src/
│           ├── components/ # App-specific components
│           ├── pages/      # Route pages
│           ├── lib/        # Utilities
│           └── router.tsx  # React Router config
├── packages/
│   ├── backend/            # Convex backend
│   │   └── convex/
│   │       ├── schema.ts   # Database schema
│   │       ├── users.ts    # User management
│   │       └── todos.ts    # Example CRUD operations
│   └── ui/                 # Shared UI component library
│       └── src/            # shadcn/ui components
├── .env.example            # Environment variables template
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

## Development Commands

### Initial Setup
```bash
pnpm install
cd packages/backend && npx convex dev  # Initialize Convex
```

### Running Development Servers

**Terminal 1 - Frontend**:
```bash
cd apps/frontend
pnpm dev
```

**Terminal 2 - Backend (Convex)**:
```bash
cd packages/backend
pnpm dev
```

### Build
```bash
pnpm build    # Build all packages
```

## Tech Stack

- **Frontend**: React 19, React Router v7, Vite, Tailwind CSS
- **Backend**: Convex (real-time database + serverless)
- **Auth**: Clerk
- **UI**: shadcn/ui components in `@template/ui`
- **Package Manager**: pnpm 9.15+ with Turborepo

## Key Entry Points

- **Frontend router**: `apps/frontend/src/router.tsx`
- **Root layout**: `apps/frontend/src/layouts/root-layout.tsx`
- **Database schema**: `packages/backend/convex/schema.ts`
- **User functions**: `packages/backend/convex/users.ts`
- **Todo functions**: `packages/backend/convex/todos.ts`
- **UI components**: `packages/ui/src/index.ts`

## Data Model (Convex)

Core tables:
- `users` - User records synced from Clerk
- `todos` - Example todo items (per-user)

## Environment Variables

Required in `.env`:
```
CONVEX_DEPLOYMENT=dev:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Code Patterns

- UI components from `@template/ui` (shadcn/ui based)
- Convex functions use standard mutation/query pattern
- Auth state managed by Clerk with sync to Convex
- Tailwind CSS for styling with CSS variables for theming
