import { Link } from "react-router-dom";
import { useAuth, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Button } from "@template/ui";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/brand/logo";

const features = [
  "Clerk authentication with Convex backend",
  "React Router v7 with protected routes",
  "Tailwind CSS with dark mode support",
  "Reusable UI component library",
  "TypeScript throughout",
  "Turborepo for fast builds",
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-xl items-center justify-between px-4 mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-semibold">Template</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <SignedOut>
              <Link to="/sign-in">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm">Get started</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/app">
                <Button size="sm">
                  Go to App
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container max-w-screen-xl mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground">
              Monorepo starter template
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
              Build full-stack apps with
              <span className="text-primary"> modern tools</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              A production-ready monorepo template with Clerk authentication, Convex backend,
              React frontend, and a reusable UI component library.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <SignedOut>
                <Link to="/sign-up">
                  <Button size="lg" className="min-w-40">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/app">
                  <Button size="lg" className="min-w-40">
                    Go to App
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </SignedIn>
              <a
                href="https://github.com/your-username/template"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="min-w-40">
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container max-w-screen-xl mx-auto px-4 py-16 border-t">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Everything you need to get started
            </h2>
            <p className="text-muted-foreground">
              Pre-configured with best practices and modern tooling
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 p-4 rounded-lg border bg-card"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container max-w-screen-xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">Template</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with React, Convex, and Clerk
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
