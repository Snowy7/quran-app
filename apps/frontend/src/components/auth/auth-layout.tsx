import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-background">
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Radial gradient glow */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="absolute right-1/4 top-2/3 -translate-y-1/2">
          <div className="h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-semibold">Template</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-center px-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Template. All rights reserved.
          </p>
        </div>
      </footer>
      <div id="clerk-captcha" />
    </div>
  );
}
