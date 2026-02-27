## Mushaf refactor progress (phase tracking)

- 2026-02-27: Initialized reader comparison/cleanup pass against quran.com-frontend-next:
  - Aligned API query defaults in `apps/frontend/src/lib/api/verses.ts` and expanded word fields (`code_v1`, `text_uthmani`, `v2_page`) with page-level filtering for page reads.
  - Added robust per-page mushaf font loader flow with multi-format candidate fallback (`woff2 -> woff -> ttf`) in `apps/frontend/src/lib/fonts/mushaf-font-loader.ts`.
  - Refactored line grouping logic in `apps/frontend/src/lib/fonts/group-lines.ts` to better preserve line order and new chapter markers.
  - Redesigned Mushaf rendering components:
    - `apps/frontend/src/components/quran/mushaf-view.tsx`
    - `apps/frontend/src/components/quran/mushaf-page.tsx`
    - `apps/frontend/src/components/quran/mushaf-line.tsx`
  - Enabled `/quran/page/:pageId` page-mode rendering through `apps/frontend/src/pages/surah-reader.tsx`.

- Next phase suggestion: apply same structured cleanup to translation and word-by-word screens (spacing, font scale controls, persisted reader preferences, and `juz` route support).

