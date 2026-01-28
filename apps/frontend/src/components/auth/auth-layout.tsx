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
        {/* Atmospheric gradient blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-24 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/40 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-semibold">Noor</span>
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
            &copy; {new Date().getFullYear()} Noor. All rights reserved.
          </p>
        </div>
      </footer>
      <div id="clerk-captcha" />
    </div>
  );
}
