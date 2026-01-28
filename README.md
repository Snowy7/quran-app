# Monorepo Template

A modern full-stack monorepo template with React, Convex, and Clerk authentication.

## Features

- **React 19 + Vite** - Fast, modern frontend with React Router v7
- **Convex Backend** - Real-time database with serverless functions
- **Clerk Authentication** - Complete auth with sign-in, sign-up, and user management
- **Shared UI Library** - Reusable shadcn/ui components in `@template/ui`
- **Turborepo** - Fast, incremental builds across the monorepo
- **TypeScript** - Full type safety throughout
- **Tailwind CSS** - Utility-first styling with dark mode support
- **Docker Ready** - Production-ready containerization

## Quick Start

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 9.15+
- A [Convex](https://convex.dev) account (free tier available)
- A [Clerk](https://clerk.com) account (free tier available)

### Setup

1. Clone and install dependencies:

```bash
git clone <your-repo-url>
cd monorepo-template
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Fill in your values:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `CONVEX_DEPLOYMENT` | Convex deployment ID | [Convex Dashboard](https://dashboard.convex.dev) |
| `VITE_CONVEX_URL` | Convex deployment URL | [Convex Dashboard](https://dashboard.convex.dev) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk secret key | [Clerk Dashboard](https://dashboard.clerk.com) |

3. Initialize Convex:

```bash
cd packages/backend
npx convex dev
```

4. Start development (2 terminals):

```bash
# Terminal 1 - Frontend
cd apps/frontend
pnpm dev

# Terminal 2 - Backend (Convex)
cd packages/backend
pnpm dev
```

5. Open http://localhost:5173

## Project Structure

```
monorepo-template/
├── apps/
│   └── frontend/           # React + Vite application
│       ├── src/
│       │   ├── components/ # App-specific components
│       │   ├── pages/      # Route pages
│       │   ├── layouts/    # Layout components
│       │   └── router.tsx  # Route definitions
│       ├── Dockerfile      # Production Docker image
│       └── nginx.conf      # Nginx config for SPA
├── packages/
│   ├── backend/            # Convex backend
│   │   └── convex/
│   │       ├── schema.ts   # Database schema
│   │       ├── users.ts    # User management
│   │       ├── todos.ts    # Example CRUD operations
│   │       └── auth.config.ts
│   └── ui/                 # Shared UI components
│       └── src/
│           ├── button.tsx
│           ├── card.tsx
│           └── ...         # shadcn/ui components
├── .env.example            # Environment template
├── docker-compose.yml      # Docker Compose config
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

## Development Commands

```bash
# Run all dev servers (uses Turborepo)
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Clean all build artifacts and node_modules
pnpm clean
```

## Docker Deployment

### Environment Variables

Docker builds require environment variables to be passed as build arguments. Create a `.env` file with your values:

```bash
cp .env.example .env
# Edit .env with your Convex and Clerk credentials
```

### Build and Run

```bash
# Build the Docker image (reads from .env automatically)
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The frontend will be available at **http://localhost:3000**

### Manual Docker Build

If you prefer not to use docker-compose:

```bash
# Build from monorepo root
docker build \
  --build-arg VITE_CONVEX_URL=https://your-deployment.convex.cloud \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx \
  -f apps/frontend/Dockerfile \
  -t monorepo-frontend .

# Run the container
docker run -p 3000:3000 monorepo-frontend
```

## Customization

### Adding New Pages

1. Create a new page in `apps/frontend/src/pages/`
2. Add the route in `apps/frontend/src/router.tsx`
3. For protected routes, nest under the `AuthGuard` element

### Adding New UI Components

1. Add components to `packages/ui/src/`
2. Export them from `packages/ui/src/index.ts`
3. Import in your app: `import { Component } from "@template/ui"`

### Adding New Backend Functions

1. Create or edit files in `packages/backend/convex/`
2. Use `query` for read operations, `mutation` for writes
3. Import in frontend: `import { api } from "@template/backend"`

### Modifying the Database Schema

1. Edit `packages/backend/convex/schema.ts`
2. Convex will automatically apply migrations in dev mode

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router v7 |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Convex |
| Auth | Clerk |
| Build | Turborepo, pnpm |
| Container | Docker, nginx |
| Language | TypeScript |

## License

MIT
