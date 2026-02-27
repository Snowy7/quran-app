import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./layouts/root-layout";
import { AppLayout } from "./components/layout/app-layout";
import { RouteErrorBoundary } from "./components/error-boundary";

// Lazy-load all page components for code-splitting
const HomePage = lazy(() => import("./pages/home"));
const QuranIndexPage = lazy(() => import("./pages/quran-index"));
const SurahReaderPage = lazy(() => import("./pages/surah-reader"));
const CollectionsPage = lazy(() => import("./pages/collections"));
const CollectionDetailPage = lazy(() => import("./pages/collection-detail"));
const HifzDashboardPage = lazy(() => import("./pages/hifz-dashboard"));
const HifzDrillPage = lazy(() => import("./pages/hifz-drill"));
const SearchPage = lazy(() => import("./pages/search"));
const SettingsPage = lazy(() => import("./pages/settings"));
const PrayerTimesPage = lazy(() => import("./pages/prayer-times"));
const NotFoundPage = lazy(() => import("./pages/not-found"));

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            path: "/",
            element: (
              <LazyPage>
                <HomePage />
              </LazyPage>
            ),
          },
          {
            path: "/quran",
            element: (
              <LazyPage>
                <QuranIndexPage />
              </LazyPage>
            ),
          },
          {
            path: "/quran/:surahId",
            element: (
              <LazyPage>
                <SurahReaderPage />
              </LazyPage>
            ),
          },
          {
            path: "/quran/juz/:juzId",
            element: (
              <LazyPage>
                <SurahReaderPage />
              </LazyPage>
            ),
          },
          {
            path: "/quran/page/:pageId",
            element: (
              <LazyPage>
                <SurahReaderPage />
              </LazyPage>
            ),
          },
          {
            path: "/collections",
            element: (
              <LazyPage>
                <CollectionsPage />
              </LazyPage>
            ),
          },
          {
            path: "/collections/:id",
            element: (
              <LazyPage>
                <CollectionDetailPage />
              </LazyPage>
            ),
          },
          {
            path: "/hifz",
            element: (
              <LazyPage>
                <HifzDashboardPage />
              </LazyPage>
            ),
          },
          {
            path: "/hifz/drill",
            element: (
              <LazyPage>
                <HifzDrillPage />
              </LazyPage>
            ),
          },
          {
            path: "/search",
            element: (
              <LazyPage>
                <SearchPage />
              </LazyPage>
            ),
          },
          {
            path: "/settings",
            element: (
              <LazyPage>
                <SettingsPage />
              </LazyPage>
            ),
          },
          {
            path: "/prayer-times",
            element: (
              <LazyPage>
                <PrayerTimesPage />
              </LazyPage>
            ),
          },
        ],
      },
      {
        path: "*",
        element: (
          <LazyPage>
            <NotFoundPage />
          </LazyPage>
        ),
      },
    ],
  },
]);
