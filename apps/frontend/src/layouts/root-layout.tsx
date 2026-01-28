import { Outlet } from 'react-router-dom'
import { ClerkProvider } from '@/components/providers/clerk-provider'
import { ConvexClientProvider } from '@/components/providers/convex-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

export function RootLayout() {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <ConvexClientProvider>
          <div className="font-sans antialiased">
            <Outlet />
          </div>
        </ConvexClientProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
}
