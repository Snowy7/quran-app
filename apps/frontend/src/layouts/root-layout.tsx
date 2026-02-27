import { Outlet } from 'react-router-dom'
import { ThemeProvider } from '@/components/providers/theme-provider'

export function RootLayout() {
  return (
    <ThemeProvider>
      <div className="font-sans antialiased">
        <Outlet />
      </div>
    </ThemeProvider>
  )
}
