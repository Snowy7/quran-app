import { create } from 'zustand';
import { Howl, Howler } from 'howler';
import { getAyahAudioUrl } from '@/lib/api/quran-api';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';

interface AudioState {
  // Playback state
  isPlaying: boolean;
  isLoading: boolean;
  currentSurahId: number | null;
  currentAyahIndex: number | null;
  totalAyahs: number;
  error: string | null;

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
  unlockAudio: () => void;
}

type AudioStore = AudioState & AudioActions;

// Global Howl instances - persists outside of React
let howlInstance: Howl | null = null;
let preloadedHowl: Howl | null = null;
let preloadedAyahIndex: number | null = null;
let currentAyahs: { numberInSurah: number }[] = [];
let audioUnlocked = false;

const initialState: AudioState = {
  isPlaying: false,
  isLoading: false,
  currentSurahId: null,
  currentAyahIndex: null,
  totalAyahs: 0,
  error: null,
  reciterId: 'Alafasy_128kbps',
  playbackSpeed: 1,
  autoPlayNext: true,
  isMinimized: true,
  isVisible: false,
};

// Detect mobile device
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Preload next ayah audio for seamless transition
function preloadNextAyah(
  surahId: number,
  currentIndex: number,
  reciterId: string,
  playbackSpeed: number
) {
  const nextIndex = currentIndex + 1;

  // Don't preload if we're at the end
  if (nextIndex >= currentAyahs.length) {
    preloadedHowl = null;
    preloadedAyahIndex = null;
    return;
  }

  // Don't preload if already preloaded
  if (preloadedAyahIndex === nextIndex && preloadedHowl) {
    return;
  }

  // Cleanup previous preload
  if (preloadedHowl) {
    preloadedHowl.unload();
    preloadedHowl = null;
  }

  const nextAyah = currentAyahs[nextIndex];
  if (!nextAyah) return;

  const audioUrl = getAyahAudioUrl(reciterId, surahId, nextAyah.numberInSurah);

  preloadedHowl = new Howl({
    src: [audioUrl],
    html5: !isMobile(), // Use Web Audio API on mobile for better compatibility
    preload: true,
    rate: playbackSpeed,
    onloaderror: () => {
      // Silent fail for preload - we'll try again when actually playing
      preloadedHowl = null;
      preloadedAyahIndex = null;
    },
  });

  preloadedAyahIndex = nextIndex;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  ...initialState,

  // Unlock audio context - must be called from user interaction on mobile
  unlockAudio: () => {
    if (audioUnlocked) return;

    // Create and play a silent audio to unlock audio context
    const ctx = Howler.ctx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    // Also play a silent sound to unlock on iOS
    const silentSound = new Howl({
      src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
      volume: 0,
      html5: false,
    });
    silentSound.play();
    silentSound.unload();

    audioUnlocked = true;
  },

  play: (surahId: number, ayahIndex: number = 0) => {
    const state = get();

    // Unlock audio on first play (user interaction)
    if (!audioUnlocked) {
      get().unlockAudio();
    }

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
      error: null,
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
      // Unlock audio if needed
      if (!audioUnlocked) {
        get().unlockAudio();
      }
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
    if (preloadedHowl) {
      preloadedHowl.unload();
      preloadedHowl = null;
      preloadedAyahIndex = null;
    }
    set({
      isPlaying: false,
      isLoading: false,
      currentAyahIndex: null,
      isVisible: false,
      error: null,
    });
  },

  next: () => {
    const { currentSurahId, currentAyahIndex, totalAyahs, reciterId, playbackSpeed, autoPlayNext } = get();
    if (currentSurahId === null || currentAyahIndex === null) return;

    if (currentAyahIndex < totalAyahs - 1) {
      const nextIndex = currentAyahIndex + 1;
      set({ currentAyahIndex: nextIndex, error: null });
      playAyahInternal(currentSurahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);
    }
  },

  previous: () => {
    const { currentSurahId, currentAyahIndex, reciterId, playbackSpeed, autoPlayNext } = get();
    if (currentSurahId === null || currentAyahIndex === null) return;

    if (currentAyahIndex > 0) {
      const prevIndex = currentAyahIndex - 1;
      set({ currentAyahIndex: prevIndex, error: null });
      playAyahInternal(currentSurahId, prevIndex, reciterId, playbackSpeed, autoPlayNext);
    }
  },

  seekTo: (ayahIndex: number) => {
    const { currentSurahId, reciterId, playbackSpeed, autoPlayNext } = get();
    if (currentSurahId === null) return;

    set({ currentAyahIndex: ayahIndex, error: null });
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
    if (preloadedHowl) {
      preloadedHowl.rate(speed);
    }
  },

  setAutoPlayNext: (auto: boolean) => set({ autoPlayNext: auto }),

  cleanup: () => {
    if (howlInstance) {
      howlInstance.stop();
      howlInstance.unload();
      howlInstance = null;
    }
    if (preloadedHowl) {
      preloadedHowl.unload();
      preloadedHowl = null;
      preloadedAyahIndex = null;
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

  // Check if we have this ayah preloaded
  const usePreloaded = preloadedHowl && preloadedAyahIndex === ayahIndex;

  if (usePreloaded && preloadedHowl) {
    // Use preloaded audio for seamless transition
    howlInstance = preloadedHowl;
    preloadedHowl = null;
    preloadedAyahIndex = null;

    // Set up event handlers
    howlInstance.on('play', () => {
      useAudioStore.setState({ isPlaying: true, isLoading: false });
    });
    howlInstance.on('pause', () => {
      useAudioStore.setState({ isPlaying: false });
    });
    howlInstance.on('end', () => {
      if (autoPlayNext && ayahIndex < currentAyahs.length - 1) {
        const nextIndex = ayahIndex + 1;
        useAudioStore.setState({ currentAyahIndex: nextIndex });
        playAyahInternal(surahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);
      } else {
        useAudioStore.setState({ isPlaying: false });
      }
    });
    howlInstance.on('stop', () => {
      useAudioStore.setState({ isPlaying: false });
    });

    howlInstance.play();

    // Preload the next ayah
    preloadNextAyah(surahId, ayahIndex, reciterId, playbackSpeed);
    return;
  }

  const audioUrl = getAyahAudioUrl(reciterId, surahId, ayah.numberInSurah);

  useAudioStore.setState({ isLoading: true, error: null });

  // Use Web Audio API on mobile (html5: false) for better compatibility
  // Use HTML5 audio on desktop for streaming
  const useMobile = isMobile();

  howlInstance = new Howl({
    src: [audioUrl],
    html5: !useMobile, // Web Audio API on mobile, HTML5 on desktop
    rate: playbackSpeed,
    preload: true,
    onload: () => {
      useAudioStore.setState({ isLoading: false });
      // Start preloading next ayah once current is loaded
      preloadNextAyah(surahId, ayahIndex, reciterId, playbackSpeed);
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
    onloaderror: (_id, err) => {
      console.error('Audio load error:', err);
      useAudioStore.setState({
        isPlaying: false,
        isLoading: false,
        error: 'Failed to load audio. Please check your connection.',
      });

      // Try with different format on error
      if (!howlInstance?.state() || howlInstance.state() === 'unloaded') {
        retryWithFallback(audioUrl, playbackSpeed, () => {
          useAudioStore.setState({ isPlaying: true, isLoading: false, error: null });
          preloadNextAyah(surahId, ayahIndex, reciterId, playbackSpeed);
        }, () => {
          if (autoPlayNext && ayahIndex < currentAyahs.length - 1) {
            const nextIndex = ayahIndex + 1;
            useAudioStore.setState({ currentAyahIndex: nextIndex });
            playAyahInternal(surahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);
          } else {
            useAudioStore.setState({ isPlaying: false });
          }
        });
      }
    },
    onplayerror: (_id, err) => {
      console.error('Audio play error:', err);
      // Unlock audio context and retry
      const ctx = Howler.ctx;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          howlInstance?.play();
        });
      } else {
        useAudioStore.setState({
          isPlaying: false,
          error: 'Playback failed. Tap to retry.',
        });
      }
    },
    onstop: () => {
      useAudioStore.setState({ isPlaying: false });
    },
  });

  howlInstance.play();
}

// Retry with opposite html5 setting
function retryWithFallback(
  audioUrl: string,
  playbackSpeed: number,
  onPlay: () => void,
  onEnd: () => void
) {
  if (howlInstance) {
    howlInstance.unload();
  }

  howlInstance = new Howl({
    src: [audioUrl],
    html5: isMobile(), // Flip the html5 setting for retry
    rate: playbackSpeed,
    preload: true,
    onplay: onPlay,
    onend: onEnd,
    onloaderror: () => {
      useAudioStore.setState({
        isPlaying: false,
        isLoading: false,
        error: 'Audio unavailable. Please try again later.',
      });
    },
  });

  howlInstance.play();
}
