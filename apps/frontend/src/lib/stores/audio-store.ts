import { create } from 'zustand';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import { getAyahAudioUrls } from '@/lib/api/quran-api';
import { getOfflineSurahWithTranslation } from '@/data/quran-data';

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentSurahId: number | null;
  currentAyahIndex: number | null;
  totalAyahs: number;
  error: string | null;
  reciterId: string;
  playbackSpeed: number;
  autoPlayNext: boolean;
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

// Native HTML5 Audio element - better CORS handling than Web Audio API
let audioElement: HTMLAudioElement | null = null;
let preloadedAudio: HTMLAudioElement | null = null;
let preloadedAyahIndex: number | null = null;
let currentAyahs: { numberInSurah: number }[] = [];

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

// Get device info for debugging
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    online: navigator.onLine,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}

// Track events with PostHog
function track(event: string, props: Record<string, unknown> = {}) {
  try {
    if (posthog.__loaded) {
      posthog.capture(event, { ...props, ...getDeviceInfo() });
    }
  } catch (e) {
    console.warn('PostHog tracking failed:', e);
  }
}

// Create audio element with proper settings
function createAudioElement(): HTMLAudioElement {
  const audio = new Audio();
  audio.crossOrigin = 'anonymous'; // Enable CORS
  audio.preload = 'auto';
  return audio;
}

// Try loading audio from multiple URLs until one works
async function loadAudioWithFallback(
  audio: HTMLAudioElement,
  urls: string[],
  context: Record<string, unknown>
): Promise<boolean> {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      audio.src = url;

      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error(`Failed to load: ${url}`));
        };
        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('error', onError);
        audio.load();
      });

      // Success - track which CDN worked
      if (i > 0) {
        track('audio_fallback_used', { ...context, fallback_index: i, url });
      }
      return true;
    } catch (err) {
      console.warn(`Audio URL ${i + 1}/${urls.length} failed:`, url, err);
      if (i === urls.length - 1) {
        // All URLs failed
        track('audio_all_urls_failed', {
          ...context,
          urls,
          error: String(err),
        });
        return false;
      }
    }
  }
  return false;
}

// Preload next ayah for seamless playback
function preloadNextAyah(
  surahId: number,
  currentIndex: number,
  reciterId: string
) {
  const nextIndex = currentIndex + 1;
  if (nextIndex >= currentAyahs.length) {
    preloadedAudio = null;
    preloadedAyahIndex = null;
    return;
  }

  // Don't preload if already preloaded
  if (preloadedAyahIndex === nextIndex && preloadedAudio) {
    return;
  }

  // Cleanup previous preload
  if (preloadedAudio) {
    preloadedAudio.src = '';
    preloadedAudio = null;
  }

  const nextAyah = currentAyahs[nextIndex];
  if (!nextAyah) return;

  const urls = getAyahAudioUrls(reciterId, surahId, nextAyah.numberInSurah);
  preloadedAudio = createAudioElement();
  preloadedAyahIndex = nextIndex;

  // Silent preload
  loadAudioWithFallback(preloadedAudio, urls, {
    type: 'preload',
    surah_id: surahId,
    ayah_index: nextIndex,
  }).catch(() => {
    preloadedAudio = null;
    preloadedAyahIndex = null;
  });
}

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
      error: null,
    });

    playAyahInternal(surahId, ayahIndex, state.reciterId, state.playbackSpeed, state.autoPlayNext);
  },

  pause: () => {
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
      set({ isPlaying: false });
    }
  },

  resume: () => {
    if (audioElement && audioElement.paused) {
      audioElement.play().catch((err) => {
        console.error('Resume failed:', err);
        toast.error('Tap to play audio');
      });
      set({ isPlaying: true });
    }
  },

  stop: () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement = null;
    }
    if (preloadedAudio) {
      preloadedAudio.src = '';
      preloadedAudio = null;
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
    if (audioElement) {
      audioElement.playbackRate = speed;
    }
  },

  setAutoPlayNext: (auto: boolean) => set({ autoPlayNext: auto }),

  cleanup: () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement = null;
    }
    if (preloadedAudio) {
      preloadedAudio.src = '';
      preloadedAudio = null;
      preloadedAyahIndex = null;
    }
    currentAyahs = [];
  },
}));

async function playAyahInternal(
  surahId: number,
  ayahIndex: number,
  reciterId: string,
  playbackSpeed: number,
  autoPlayNext: boolean
) {
  // Cleanup previous
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
  }

  const ayah = currentAyahs[ayahIndex];
  if (!ayah) return;

  useAudioStore.setState({ isLoading: true, error: null });

  // Check if we have this ayah preloaded
  if (preloadedAudio && preloadedAyahIndex === ayahIndex) {
    audioElement = preloadedAudio;
    preloadedAudio = null;
    preloadedAyahIndex = null;
  } else {
    audioElement = createAudioElement();
  }

  const urls = getAyahAudioUrls(reciterId, surahId, ayah.numberInSurah);
  const context = {
    surah_id: surahId,
    ayah_index: ayahIndex,
    ayah_number: ayah.numberInSurah,
    reciter_id: reciterId,
  };

  // Set up event handlers
  audioElement.onplay = () => {
    useAudioStore.setState({ isPlaying: true, isLoading: false });
    track('audio_play_started', { ...context, url: audioElement?.src });
  };

  audioElement.onpause = () => {
    useAudioStore.setState({ isPlaying: false });
  };

  audioElement.onended = () => {
    track('audio_play_completed', context);
    if (autoPlayNext && ayahIndex < currentAyahs.length - 1) {
      const nextIndex = ayahIndex + 1;
      useAudioStore.setState({ currentAyahIndex: nextIndex });
      playAyahInternal(surahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);
    } else {
      useAudioStore.setState({ isPlaying: false });
    }
  };

  audioElement.onerror = () => {
    const error = audioElement?.error;
    const errorMsg = error ? `Audio error: ${error.message || error.code}` : 'Audio failed to load';
    console.error('Audio error:', error);

    track('audio_error', {
      ...context,
      error_code: error?.code,
      error_message: error?.message,
      url: audioElement?.src,
    });

    toast.error(errorMsg, { duration: 5000 });
    useAudioStore.setState({
      isPlaying: false,
      isLoading: false,
      error: errorMsg,
    });
  };

  // Set playback speed
  audioElement.playbackRate = playbackSpeed;

  // Try to load audio with fallback URLs
  const loaded = await loadAudioWithFallback(audioElement, urls, context);

  if (!loaded) {
    const errorMsg = 'Could not load audio. Please check your connection.';
    toast.error(errorMsg, { duration: 5000 });
    useAudioStore.setState({
      isPlaying: false,
      isLoading: false,
      error: errorMsg,
    });
    return;
  }

  // Play the audio
  try {
    await audioElement.play();
    // Start preloading next ayah
    preloadNextAyah(surahId, ayahIndex, reciterId);
  } catch (err) {
    console.error('Play failed:', err);
    track('audio_play_failed', { ...context, error: String(err) });

    // On mobile, user interaction is required
    const errorMsg = 'Tap play button to start audio';
    toast.info(errorMsg);
    useAudioStore.setState({
      isPlaying: false,
      isLoading: false,
      error: errorMsg,
    });
  }
}
