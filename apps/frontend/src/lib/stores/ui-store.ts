import { create } from "zustand";

// BeforeInstallPromptEvent type for PWA install
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UIState {
  // Navigation
  isSearchOpen: boolean;

  // Reading
  currentHighlightedAyah: { chapterId: number; verseNumber: number } | null;

  // Network
  isOnline: boolean;

  // PWA
  showInstallPrompt: boolean;
  deferredInstallPrompt: BeforeInstallPromptEvent | null;

  // Actions
  setSearchOpen: (open: boolean) => void;
  setHighlightedAyah: (
    ayah: { chapterId: number; verseNumber: number } | null,
  ) => void;
  setOnline: (online: boolean) => void;
  setShowInstallPrompt: (show: boolean) => void;
  setDeferredInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  currentHighlightedAyah: null,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  showInstallPrompt: false,
  deferredInstallPrompt: null,

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setHighlightedAyah: (ayah) => set({ currentHighlightedAyah: ayah }),
  setOnline: (online) => set({ isOnline: online }),
  setShowInstallPrompt: (show) => set({ showInstallPrompt: show }),
  setDeferredInstallPrompt: (prompt) => set({ deferredInstallPrompt: prompt }),
}));

// Network Status Listener
let networkListenerInitialized = false;
let networkCleanup: (() => void) | null = null;

export function initializeNetworkListener() {
  if (typeof window === "undefined") return;
  if (networkListenerInitialized) return networkCleanup;
  networkListenerInitialized = true;

  const handleOnline = () => useUIStore.getState().setOnline(true);
  const handleOffline = () => useUIStore.getState().setOnline(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  networkCleanup = () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    networkListenerInitialized = false;
    networkCleanup = null;
  };

  return networkCleanup;
}

// PWA Install Prompt
let pwaListenerInitialized = false;
let pwaCleanup: (() => void) | null = null;

export function initializePWAInstallListener() {
  if (typeof window === "undefined") return;
  if (pwaListenerInitialized) return pwaCleanup;
  pwaListenerInitialized = true;

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    useUIStore.getState().setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    useUIStore.getState().setShowInstallPrompt(true);
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

  pwaCleanup = () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    pwaListenerInitialized = false;
    pwaCleanup = null;
  };

  return pwaCleanup;
}

export async function triggerPWAInstall() {
  const prompt = useUIStore.getState().deferredInstallPrompt;
  if (!prompt) return false;

  await prompt.prompt();
  const { outcome } = await prompt.userChoice;

  useUIStore.getState().setDeferredInstallPrompt(null);
  useUIStore.getState().setShowInstallPrompt(false);

  return outcome === "accepted";
}
