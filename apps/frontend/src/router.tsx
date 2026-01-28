import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/root-layout';
import { AppLayout } from './components/layout/app-layout';
import { RouteErrorBoundary } from './components/error-boundary';

// Main pages
import HomePage from './pages/home';
import QuranIndexPage from './pages/quran/index';
import SurahReaderPage from './pages/quran/reader';
import BookmarksPage from './pages/bookmarks';
import MemorizePage from './pages/memorize';
import SettingsPage from './pages/settings';
import SearchPage from './pages/search';
import PrayerTimesPage from './pages/prayer-times';
import QiblaPage from './pages/qibla';
import OnboardingPage from './pages/onboarding';
import NotFoundPage from './pages/not-found';

// Auth pages (optional)
import SignInPage from './pages/sign-in';
import SignUpPage from './pages/sign-up';
import SSOCallbackPage from './pages/sso-callback';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Main app routes (wrapped in AppLayout with bottom nav)
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/quran', element: <QuranIndexPage /> },
          { path: '/quran/:surahId', element: <SurahReaderPage /> },
          { path: '/quran/juz/:juzId', element: <SurahReaderPage /> },
          { path: '/quran/page/:pageId', element: <SurahReaderPage /> },
          { path: '/bookmarks', element: <BookmarksPage /> },
          { path: '/memorize', element: <MemorizePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/prayer-times', element: <PrayerTimesPage /> },
          { path: '/qibla', element: <QiblaPage /> },
        ],
      },

      // Onboarding (outside main layout)
      { path: '/onboarding', element: <OnboardingPage /> },

      // Auth routes (optional, for cloud sync)
      { path: '/sign-in/*', element: <SignInPage /> },
      { path: '/sign-up/*', element: <SignUpPage /> },
      { path: '/sso-callback', element: <SSOCallbackPage /> },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
