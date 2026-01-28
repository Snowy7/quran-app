import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './layouts/root-layout'
import { AuthGuard } from './components/guards/auth-guard'
import { RouteErrorBoundary } from './components/error-boundary'

// Public pages
import HomePage from './pages/home'
import SignInPage from './pages/sign-in'
import SignUpPage from './pages/sign-up'
import SSOCallbackPage from './pages/sso-callback'
import NotFoundPage from './pages/not-found'

// Protected pages
import AppPage from './pages/app'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public routes
      { path: '/', element: <HomePage /> },
      { path: '/sign-in/*', element: <SignInPage /> },
      { path: '/sign-up/*', element: <SignUpPage /> },
      { path: '/sso-callback', element: <SSOCallbackPage /> },

      // Protected routes
      {
        element: <AuthGuard />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { path: '/app', element: <AppPage /> },
        ],
      },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
