import { create } from 'zustand';
import type { PlaybackState } from '@/types/quran';

// =====================================
// UI State Store (Non-Persistent)
// =====================================

interface UIState {
  // Audio player
  isAudioPlayerVisible: boolean;
  isAudioPlayerExpanded: boolean;
  playback: PlaybackState;

  // Navigation
  isSidebarOpen: boolean;
  isSearchOpen: boolean;

  // Reading
  currentHighlightedAyah: { surahId: number; ayahNumber: number } | null;

  // Network
  isOnline: boolean;

  // PWA
  showInstallPrompt: boolean;
  deferredInstallPrompt: BeforeInstallPromptEvent | null;

  // Actions
  setAudioPlayerVisible: (visible: boolean) => void;
  setAudioPlayerExpanded: (expanded: boolean) => void;
  setPlayback: (playback: Partial<PlaybackState>) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setHighlightedAyah: (ayah: { surahId: number; ayahNumber: number } | null) => void;
  setOnline: (online: boolean) => void;
  setShowInstallPrompt: (show: boolean) => void;
  setDeferredInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
}

// BeforeInstallPromptEvent type for PWA install
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DEFAULT_PLAYBACK: PlaybackState = {
  isPlaying: false,
  currentSurah: null,
  currentAyah: null,
  reciterId: 'Alafasy_128kbps',
  playbackRate: 1.0,
  repeatMode: 'none',
  repeatCount: 0,
  volume: 1.0,
};

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isAudioPlayerVisible: false,
  isAudioPlayerExpanded: false,
  playback: DEFAULT_PLAYBACK,
  isSidebarOpen: false,
  isSearchOpen: false,
  currentHighlightedAyah: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  showInstallPrompt: false,
  deferredInstallPrompt: null,

  // Actions
  setAudioPlayerVisible: (visible) => set({ isAudioPlayerVisible: visible }),
  setAudioPlayerExpanded: (expanded) => set({ isAudioPlayerExpanded: expanded }),
  setPlayback: (playback) =>
    set((state) => ({
      playback: { ...state.playback, ...playback },
    })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setHighlightedAyah: (ayah) => set({ currentHighlightedAyah: ayah }),
  setOnline: (online) => set({ isOnline: online }),
  setShowInstallPrompt: (show) => set({ showInstallPrompt: show }),
  setDeferredInstallPrompt: (prompt) => set({ deferredInstallPrompt: prompt }),
}));

// =====================================
// Network Status Hook
// =====================================

export function initializeNetworkListener() {
  if (typeof window === 'undefined') return;

  const handleOnline = () => useUIStore.getState().setOnline(true);
  const handleOffline = () => useUIStore.getState().setOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// =====================================
// PWA Install Prompt Hook
// =====================================

export function initializePWAInstallListener() {
  if (typeof window === 'undefined') return;

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    useUIStore.getState().setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    useUIStore.getState().setShowInstallPrompt(true);
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}

export async function triggerPWAInstall() {
  const prompt = useUIStore.getState().deferredInstallPrompt;
  if (!prompt) return false;

  await prompt.prompt();
  const { outcome } = await prompt.userChoice;

  useUIStore.getState().setDeferredInstallPrompt(null);
  useUIStore.getState().setShowInstallPrompt(false);

  return outcome === 'accepted';
}
