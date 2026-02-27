import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@template/ui";
import { useUIStore, triggerPWAInstall } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

// Detect iOS
function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  );
}

// Detect if running as standalone PWA
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

// Check if already installed (approximation)
function isInstalled(): boolean {
  return isStandalone();
}

export function InstallPrompt() {
  const showInstallPrompt = useUIStore((s) => s.showInstallPrompt);
  const deferredPrompt = useUIStore((s) => s.deferredInstallPrompt);
  const setShowInstallPrompt = useUIStore((s) => s.setShowInstallPrompt);

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if we should show iOS instructions
  const ios = isIOS();
  const standalone = isStandalone();

  // Don't show if already installed or dismissed
  if (standalone || dismissed) {
    return null;
  }

  // Show Android/Chrome install prompt
  if (showInstallPrompt && deferredPrompt && !ios) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">Install Noor</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add to home screen for quick access and offline use
              </p>
            </div>
            <button
              onClick={() => {
                setShowInstallPrompt(false);
                setDismissed(true);
              }}
              className="p-1 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setShowInstallPrompt(false);
                setDismissed(true);
              }}
            >
              Not now
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={async () => {
                await triggerPWAInstall();
              }}
            >
              Install
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show iOS instructions prompt
  if (ios && !showIOSInstructions) {
    // Check localStorage to see if user dismissed before
    const dismissedBefore =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("pwa-ios-dismissed");
    if (dismissedBefore) return null;

    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">Install Noor</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add to home screen for the best experience
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("pwa-ios-dismissed", "true");
                setDismissed(true);
              }}
              className="p-1 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                localStorage.setItem("pwa-ios-dismissed", "true");
                setDismissed(true);
              }}
            >
              Not now
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setShowIOSInstructions(true)}
            >
              Show me how
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // iOS installation instructions modal
  if (ios && showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
        <div className="bg-card border-t border-border rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Install Noor on iOS</h3>
            <button
              onClick={() => {
                setShowIOSInstructions(false);
                localStorage.setItem("pwa-ios-dismissed", "true");
                setDismissed(true);
              }}
              className="p-1 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">1</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Tap the Share button</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Share className="w-4 h-4" />
                  <span>in Safari's toolbar</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">2</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Scroll down and tap</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Plus className="w-4 h-4" />
                  <span>"Add to Home Screen"</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-semibold text-primary">3</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Tap "Add"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Noor will appear on your home screen
                </p>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-6"
            onClick={() => {
              setShowIOSInstructions(false);
              localStorage.setItem("pwa-ios-dismissed", "true");
              setDismissed(true);
            }}
          >
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// Button for settings page to manually trigger install
export function InstallAppButton() {
  const showInstallPrompt = useUIStore((s) => s.showInstallPrompt);
  const deferredPrompt = useUIStore((s) => s.deferredInstallPrompt);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const ios = isIOS();
  const standalone = isStandalone();

  // Already installed
  if (standalone) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10">
        <Download className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium text-primary">App Installed</p>
          <p className="text-xs text-muted-foreground">
            You're using the installed version
          </p>
        </div>
      </div>
    );
  }

  // Android/Chrome
  if (deferredPrompt) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start gap-3"
        onClick={triggerPWAInstall}
      >
        <Download className="w-5 h-5" />
        <div className="text-left">
          <p className="font-medium">Install App</p>
          <p className="text-xs text-muted-foreground">Add to home screen</p>
        </div>
      </Button>
    );
  }

  // iOS
  if (ios) {
    return (
      <>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={() => setShowIOSModal(true)}
        >
          <Download className="w-5 h-5" />
          <div className="text-left">
            <p className="font-medium">Install App</p>
            <p className="text-xs text-muted-foreground">Add to home screen</p>
          </div>
        </Button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
            <div className="bg-card border-t border-border rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Install on iOS</h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded-lg hover:bg-secondary"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap Share</p>
                    <p className="text-sm text-muted-foreground">
                      <Share className="w-4 h-4 inline mr-1" />
                      in Safari toolbar
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Add to Home Screen</p>
                    <p className="text-sm text-muted-foreground">
                      <Plus className="w-4 h-4 inline mr-1" />
                      Scroll and tap this option
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Tap Add</p>
                    <p className="text-sm text-muted-foreground">
                      Confirm installation
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                onClick={() => setShowIOSModal(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop or unsupported
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 text-muted-foreground">
      <Download className="w-5 h-5" />
      <div>
        <p className="font-medium">Install App</p>
        <p className="text-xs">Use Chrome on mobile for best experience</p>
      </div>
    </div>
  );
}
