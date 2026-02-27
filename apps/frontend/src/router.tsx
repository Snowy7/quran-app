import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/root-layout';
import { AppLayout } from './components/layout/app-layout';
import { RouteErrorBoundary } from './components/error-boundary';

import HomePage from './pages/home';
import QuranIndexPage from './pages/quran-index';
import SurahReaderPage from './pages/surah-reader';
import CollectionsPage from './pages/collections';
import CollectionDetailPage from './pages/collection-detail';
import HifzDashboardPage from './pages/hifz-dashboard';
import HifzDrillPage from './pages/hifz-drill';
import SearchPage from './pages/search';
import SettingsPage from './pages/settings';
import PrayerTimesPage from './pages/prayer-times';
import NotFoundPage from './pages/not-found';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/quran', element: <QuranIndexPage /> },
          { path: '/quran/:surahId', element: <SurahReaderPage /> },
          { path: '/quran/juz/:juzId', element: <SurahReaderPage /> },
          { path: '/quran/page/:pageId', element: <SurahReaderPage /> },
          { path: '/collections', element: <CollectionsPage /> },
          { path: '/collections/:id', element: <CollectionDetailPage /> },
          { path: '/hifz', element: <HifzDashboardPage /> },
          { path: '/hifz/drill', element: <HifzDrillPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/prayer-times', element: <PrayerTimesPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
