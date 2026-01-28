import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button, Card, CardContent } from "@template/ui";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <Card className="w-full max-w-lg border-destructive/20 bg-destructive/5">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>

                {/* Title */}
                <h2 className="mt-6 text-xl font-semibold">Something went wrong</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  An unexpected error occurred. Don't worry, our team has been notified.
                </p>

                {/* Error details (collapsible) */}
                {this.state.error && (
                  <details className="mt-4 w-full text-left">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      <span className="ml-1">Show error details</span>
                    </summary>
                    <div className="mt-2 rounded-lg bg-secondary/50 p-3">
                      <p className="font-mono text-xs text-destructive">
                        {this.state.error.message}
                      </p>
                      {this.state.errorInfo?.componentStack && (
                        <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                          {this.state.errorInfo.componentStack.slice(0, 500)}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button onClick={this.handleReset} variant="default" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A simpler inline error component for use with React Router's errorElement
 */
export function RouteErrorBoundary() {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            {/* Title */}
            <h2 className="mt-6 text-xl font-semibold">Page Error</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong while loading this page.
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={handleReload} variant="default" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={handleGoHome} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
