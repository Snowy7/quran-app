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
          { path: '/bookmarks', element: <BookmarksPage /> },
          { path: '/memorize', element: <MemorizePage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/search', element: <SearchPage /> },
        ],
      },

      // Auth routes (optional, for cloud sync)
      { path: '/sign-in/*', element: <SignInPage /> },
      { path: '/sign-up/*', element: <SignUpPage /> },
      { path: '/sso-callback', element: <SSOCallbackPage /> },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
