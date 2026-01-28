import { create } from 'zustand';
import { Howl } from 'howler';
import { getAyahAudioUrl } from '@/lib/api/quran-api';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';

interface AudioState {
  // Playback state
  isPlaying: boolean;
  isLoading: boolean;
  currentSurahId: number | null;
  currentAyahIndex: number | null;
  totalAyahs: number;

  // Settings
  reciterId: string;
  playbackSpeed: number;
  autoPlayNext: boolean;

  // UI state
  isMinimized: boolean;
  isVisible: boolean;
}

interface AudioActions {
  play: (surahId: number, ayahIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (ayahIndex: number) => void;
  setMinimized: (minimized: boolean) => void;
  setVisible: (visible: boolean) => void;
  setReciterId: (id: string) => void;
  setPlaybackSpeed: (speed: number) => void;
  setAutoPlayNext: (auto: boolean) => void;
  cleanup: () => void;
}

type AudioStore = AudioState & AudioActions;

// Global Howl instance - persists outside of React
let howlInstance: Howl | null = null;
let currentAyahs: { numberInSurah: number }[] = [];

const initialState: AudioState = {
  isPlaying: false,
  isLoading: false,
  currentSurahId: null,
  currentAyahIndex: null,
  totalAyahs: 0,
  reciterId: 'Alafasy_128kbps',
  playbackSpeed: 1,
  autoPlayNext: true,
  isMinimized: true,
  isVisible: false,
};

export const useAudioStore = create<AudioStore>((set, get) => ({
  ...initialState,

  play: (surahId: number, ayahIndex: number = 0) => {
    const state = get();

    // Load ayahs for this surah
    const offlineData = getOfflineSurahWithTranslation(surahId);
    if (!offlineData) return;

    currentAyahs = offlineData.surah.verses.map((v) => ({ numberInSurah: v.id }));

    set({
      currentSurahId: surahId,
      currentAyahIndex: ayahIndex,
      totalAyahs: currentAyahs.length,
      isVisible: true,
      isMinimized: true,
    });

    // Play the ayah
    playAyahInternal(surahId, ayahIndex, state.reciterId, state.playbackSpeed, state.autoPlayNext);
  },

  pause: () => {
    if (howlInstance && howlInstance.playing()) {
      howlInstance.pause();
      set({ isPlaying: false });
    }
  },

  resume: () => {
    if (howlInstance) {
      howlInstance.play();
      set({ isPlaying: true });
    }
  },

  stop: () => {
    if (howlInstance) {
      howlInstance.stop();
      howlInstance.unload();
      howlInstance = null;
    }
    set({
      isPlaying: false,
      isLoading: false,
      currentAyahIndex: null,
      isVisible: false,
    });
  },

  next: () => {
    const { currentSurahId, currentAyahIndex, totalAyahs, reciterId, playbackSpeed, autoPlayNext } = get();
    if (currentSurahId === null || currentAyahIndex === null) return;

    if (currentAyahIndex < totalAyahs - 1) {
      const nextIndex = currentAyahIndex + 1;
      set({ currentAyahIndex: nextIndex });
      playAyahInternal(currentSurahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);
    }
  },

  previous: () => {
    const { currentSurahId, currentAyahIndex, reciterId, playbackSpeed, autoPlayNext } = get();
    if (currentSurahId === null || currentAyahIndex === null) return;

    if (currentAyahIndex > 0) {
      const prevIndex = currentAyahIndex - 1;
      set({ currentAyahIndex: prevIndex });
      playAyahInternal(currentSurahId, prevIndex, reciterId, playbackSpeed, autoPlayNext);
    }
  },

  seekTo: (ayahIndex: number) => {
    const { currentSurahId, reciterId, playbackSpeed, autoPlayNext } = get();
    if (currentSurahId === null) return;

    set({ currentAyahIndex: ayahIndex });
    playAyahInternal(currentSurahId, ayahIndex, reciterId, playbackSpeed, autoPlayNext);
  },

  setMinimized: (minimized: boolean) => set({ isMinimized: minimized }),

  setVisible: (visible: boolean) => {
    if (!visible) {
      get().stop();
    }
    set({ isVisible: visible });
  },

  setReciterId: (id: string) => set({ reciterId: id }),

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
    if (howlInstance) {
      howlInstance.rate(speed);
    }
  },

  setAutoPlayNext: (auto: boolean) => set({ autoPlayNext: auto }),

  cleanup: () => {
    if (howlInstance) {
      howlInstance.stop();
      howlInstance.unload();
      howlInstance = null;
    }
    currentAyahs = [];
  },
}));

function playAyahInternal(
  surahId: number,
  ayahIndex: number,
  reciterId: string,
  playbackSpeed: number,
  autoPlayNext: boolean
) {
  // Cleanup previous
  if (howlInstance) {
    howlInstance.stop();
    howlInstance.unload();
    howlInstance = null;
  }

  const ayah = currentAyahs[ayahIndex];
  if (!ayah) return;

  const audioUrl = getAyahAudioUrl(reciterId, surahId, ayah.numberInSurah);

  useAudioStore.setState({ isLoading: true });

  howlInstance = new Howl({
    src: [audioUrl],
    html5: true,
    rate: playbackSpeed,
    onload: () => {
      useAudioStore.setState({ isLoading: false });
    },
    onplay: () => {
      useAudioStore.setState({ isPlaying: true, isLoading: false });
    },
    onpause: () => {
      useAudioStore.setState({ isPlaying: false });
    },
    onend: () => {
      if (autoPlayNext && ayahIndex < currentAyahs.length - 1) {
        // Auto-play next ayah
        const nextIndex = ayahIndex + 1;
        useAudioStore.setState({ currentAyahIndex: nextIndex });
        playAyahInternal(surahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);
      } else {
        useAudioStore.setState({ isPlaying: false });
      }
    },
    onloaderror: () => {
      useAudioStore.setState({ isPlaying: false, isLoading: false });
    },
    onstop: () => {
      useAudioStore.setState({ isPlaying: false });
    },
  });

  howlInstance.play();
}
