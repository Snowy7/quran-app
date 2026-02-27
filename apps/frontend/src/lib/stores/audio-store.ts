import { create } from 'zustand';

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentVerseKey: string | null;
  reciterId: number;
  playbackSpeed: number;
  repeatMode: 'off' | 'verse' | 'range' | 'surah';
  repeatRange?: { from: string; to: string };
  isVisible: boolean;
  isMinimized: boolean;
}

interface AudioActions {
  play: (verseKey: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setReciter: (id: number) => void;
  setSpeed: (speed: number) => void;
  setRepeatMode: (mode: AudioState['repeatMode']) => void;
  setVisible: (visible: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  cleanup: () => void;
}

type AudioStore = AudioState & AudioActions;

const initialState: AudioState = {
  isPlaying: false,
  isLoading: false,
  currentVerseKey: null,
  reciterId: 7, // Mishary Rashid Alafasy
  playbackSpeed: 1,
  repeatMode: 'off',
  isVisible: false,
  isMinimized: true,
};

// Placeholder audio store - will be fully implemented in Phase 2
export const useAudioStore = create<AudioStore>((set, get) => ({
  ...initialState,

  play: (verseKey: string) => {
    set({ currentVerseKey: verseKey, isVisible: true, isMinimized: true });
    // TODO: Phase 2 - implement actual audio playback
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  stop: () => {
    set({ ...initialState });
  },

  next: () => {
    // TODO: Phase 2
  },

  previous: () => {
    // TODO: Phase 2
  },

  setReciter: (id: number) => set({ reciterId: id }),
  setSpeed: (speed: number) => set({ playbackSpeed: speed }),
  setRepeatMode: (mode: AudioState['repeatMode']) => set({ repeatMode: mode }),
  setVisible: (visible: boolean) => set({ isVisible: visible }),
  setMinimized: (minimized: boolean) => set({ isMinimized: minimized }),

  cleanup: () => {
    set({ ...initialState });
  },
}));
