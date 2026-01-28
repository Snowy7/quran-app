# Frontend Dockerfile
# Build from monorepo root: docker build -f apps/frontend/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable pnpm

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/backend/package.json ./packages/backend/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

# Build arguments for environment variables needed at build time
ARG VITE_CONVEX_URL
ARG VITE_CLERK_PUBLISHABLE_KEY

ENV NODE_ENV=production
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}

# Build UI package first
WORKDIR /app/packages/ui
RUN pnpm build

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm build

# Production image - serve static files with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config for SPA routing
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
