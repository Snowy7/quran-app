# Noor Mobile (Expo)

Mobile app package for the Quran app monorepo.

## Environment

Create `apps/mobile/.env` with:

```bash
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

If the variable is missing, the app still runs in local-only mode.

## Run

From the monorepo root:

```bash
pnpm install
pnpm --filter @template/mobile dev
```

Optional native runs:

```bash
pnpm --filter @template/mobile android
pnpm --filter @template/mobile ios
```

## What is synced

Using the existing Convex backend (`packages/backend/convex/quranSync.ts`):

- Bookmarks (`syncBookmarks`, `deleteBookmark`)
- Reader settings (`syncSettings`)
- Reading position (`syncReadingProgress`)
- Pull all cloud data (`getAllUserData`)

The app uses a persisted device ID as `clerkId` fallback so sync works without Clerk in mobile.

