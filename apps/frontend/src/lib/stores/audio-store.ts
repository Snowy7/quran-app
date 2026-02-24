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
let preloadedReady = false;
let currentAyahs: { numberInSurah: number }[] = [];
let isLoadingAudio = false;

const initialState: AudioState = {
  isPlaying: false,
  isLoading: false,
  currentSurahId: null,
  currentAyahIndex: null,
  totalAyahs: 0,
  error: null,
  reciterId: 'Abdul_Basit_Murattal_192kbps',
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
  audio.crossOrigin = 'anonymous';
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

      if (i > 0) {
        track('audio_fallback_used', { ...context, fallback_index: i, url });
      }
      return true;
    } catch (err) {
      console.warn(`Audio URL ${i + 1}/${urls.length} failed:`, url, err);
      if (i === urls.length - 1) {
        track('audio_all_urls_failed', { ...context, urls, error: String(err) });
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
    preloadedReady = false;
    return;
  }

  // Don't preload if already preloaded for this index
  if (preloadedAyahIndex === nextIndex && preloadedAudio && preloadedReady) {
    return;
  }

  // Cleanup previous preload
  if (preloadedAudio) {
    preloadedAudio.src = '';
    preloadedAudio = null;
  }
  preloadedReady = false;

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
  }).then((success) => {
    if (success) {
      preloadedReady = true;
    } else {
      preloadedAudio = null;
      preloadedAyahIndex = null;
      preloadedReady = false;
    }
  }).catch(() => {
    preloadedAudio = null;
    preloadedAyahIndex = null;
    preloadedReady = false;
  });
}

// Detach all handlers and optionally stop an audio element
function releaseAudioElement(audio: HTMLAudioElement, delayed: boolean) {
  audio.onended = null;
  audio.ontimeupdate = null;
  audio.onpause = null;
  audio.onplay = null;
  audio.onerror = null;
  if (delayed) {
    // Let it finish playing its last bit, then clean up
    setTimeout(() => { audio.pause(); audio.src = ''; }, 1000);
  } else {
    audio.pause();
    audio.src = '';
  }
}

// Set up event handlers on an audio element for a specific ayah.
// This is extracted so both playAyahInternal and performCrossfade can share it.
function setupAudioHandlers(
  audio: HTMLAudioElement,
  surahId: number,
  ayahIndex: number,
  reciterId: string,
  playbackSpeed: number,
  autoPlayNext: boolean
) {
  const context = {
    surah_id: surahId,
    ayah_index: ayahIndex,
    ayah_number: currentAyahs[ayahIndex]?.numberInSurah,
    reciter_id: reciterId,
  };

  let hasTriggeredMidPreload = false;
  let hasTriggeredCrossfade = false;

  audio.onplay = () => {
    useAudioStore.setState({ isPlaying: true, isLoading: false });
    track('audio_play_started', { ...context, url: audio.src });
  };

  audio.onpause = () => {
    // Only update if this is still the active element (not a released crossfade element)
    if (audio === audioElement) {
      useAudioStore.setState({ isPlaying: false });
    }
  };

  audio.onended = () => {
    track('audio_play_completed', context);
    // If crossfade already started the next ayah, skip
    if (hasTriggeredCrossfade) return;
    if (autoPlayNext && ayahIndex < currentAyahs.length - 1) {
      const nextIndex = ayahIndex + 1;
      useAudioStore.setState({ currentAyahIndex: nextIndex });
      playAyahInternal(surahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);
    } else {
      useAudioStore.setState({ isPlaying: false });
    }
  };

  audio.ontimeupdate = () => {
    if (!audio || audio.duration <= 0) return;

    const currentTime = audio.currentTime;
    const duration = audio.duration;

    // Preload next ayah at 30% through current
    if (!hasTriggeredMidPreload && (currentTime / duration) * 100 >= 30) {
      hasTriggeredMidPreload = true;
      preloadNextAyah(surahId, ayahIndex, reciterId);
    }

    // Crossfade: start next ayah ~500ms before this one ends.
    // timeupdate fires ~every 250ms, so 500ms window is reliably caught.
    const remaining = duration - currentTime;
    if (
      !hasTriggeredCrossfade &&
      remaining > 0 && remaining <= 0.5 &&
      autoPlayNext &&
      ayahIndex < currentAyahs.length - 1 &&
      preloadedAudio && preloadedAyahIndex === ayahIndex + 1 && preloadedReady
    ) {
      hasTriggeredCrossfade = true;
      performCrossfade(audio, surahId, ayahIndex + 1, reciterId, playbackSpeed, autoPlayNext);
    }
  };

  audio.onerror = () => {
    if (isLoadingAudio) return;

    const error = audio?.error;
    if (!error || (!error.message && error.code === undefined)) return;

    const errorMsg = error.message || `Audio error code: ${error.code}`;
    console.error('Audio error:', error.code, error.message);

    track('audio_error', {
      ...context,
      error_code: error.code,
      error_message: error.message,
      url: audio.src,
    });

    toast.error(errorMsg, { duration: 5000 });
    useAudioStore.setState({
      isPlaying: false,
      isLoading: false,
      error: errorMsg,
    });
  };
}

// Direct crossfade — plays preloaded audio immediately without going through
// the full playAyahInternal async flow, for minimal gap between ayahs.
function performCrossfade(
  oldAudio: HTMLAudioElement,
  surahId: number,
  nextIndex: number,
  reciterId: string,
  playbackSpeed: number,
  autoPlayNext: boolean
) {
  // Detach old element handlers, let it finish its last ~500ms naturally
  releaseAudioElement(oldAudio, true);

  // Grab preloaded audio directly
  const nextAudio = preloadedAudio!;
  preloadedAudio = null;
  preloadedAyahIndex = null;
  preloadedReady = false;

  // Swap in as current element
  audioElement = nextAudio;
  nextAudio.playbackRate = playbackSpeed;

  // Update state
  useAudioStore.setState({ currentAyahIndex: nextIndex, error: null });

  // Set up handlers for new element (enables its own future crossfade)
  setupAudioHandlers(nextAudio, surahId, nextIndex, reciterId, playbackSpeed, autoPlayNext);

  // Fire and forget — no await, minimum latency
  nextAudio.play().catch((err) => {
    console.error('Crossfade play failed:', err);
    track('audio_play_failed', { surah_id: surahId, ayah_index: nextIndex, error: String(err) });
    useAudioStore.setState({ isPlaying: false, isLoading: false });
  });

  // Start preloading the one after next
  preloadNextAyah(surahId, nextIndex, reciterId);
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
      releaseAudioElement(audioElement, false);
      audioElement = null;
    }
    if (preloadedAudio) {
      preloadedAudio.src = '';
      preloadedAudio = null;
      preloadedAyahIndex = null;
      preloadedReady = false;
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
      releaseAudioElement(audioElement, false);
      audioElement = null;
    }
    if (preloadedAudio) {
      preloadedAudio.src = '';
      preloadedAudio = null;
      preloadedAyahIndex = null;
      preloadedReady = false;
    }
    currentAyahs = [];
  },
}));

// Standard playback — used for first play, skip, seek, and non-crossfade transitions.
// For seamless ayah-to-ayah transitions, performCrossfade() is used instead.
async function playAyahInternal(
  surahId: number,
  ayahIndex: number,
  reciterId: string,
  playbackSpeed: number,
  autoPlayNext: boolean
) {
  // Cleanup previous element
  if (audioElement) {
    releaseAudioElement(audioElement, false);
  }

  const ayah = currentAyahs[ayahIndex];
  if (!ayah) return;

  // Check if we have this ayah preloaded and ready
  const usingPreloaded = !!(preloadedAudio && preloadedAyahIndex === ayahIndex && preloadedReady);

  if (usingPreloaded) {
    audioElement = preloadedAudio!;
    preloadedAudio = null;
    preloadedAyahIndex = null;
    preloadedReady = false;
    useAudioStore.setState({ error: null });
  } else {
    audioElement = createAudioElement();
    useAudioStore.setState({ isLoading: true, error: null });
  }

  // Set up event handlers
  setupAudioHandlers(audioElement, surahId, ayahIndex, reciterId, playbackSpeed, autoPlayNext);

  // Set playback speed
  audioElement.playbackRate = playbackSpeed;

  // Only load from network if not using preloaded audio
  if (!usingPreloaded) {
    const urls = getAyahAudioUrls(reciterId, surahId, ayah.numberInSurah);
    const context = {
      surah_id: surahId,
      ayah_index: ayahIndex,
      ayah_number: ayah.numberInSurah,
      reciter_id: reciterId,
    };

    isLoadingAudio = true;
    const loaded = await loadAudioWithFallback(audioElement, urls, context);
    isLoadingAudio = false;

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
  }

  // Start preloading next ayah
  preloadNextAyah(surahId, ayahIndex, reciterId);

  // Play
  try {
    await audioElement.play();
  } catch (err) {
    console.error('Play failed:', err);
    track('audio_play_failed', {
      surah_id: surahId,
      ayah_index: ayahIndex,
      error: String(err),
    });

    const errorMsg = 'Tap play button to start audio';
    toast.info(errorMsg);
    useAudioStore.setState({
      isPlaying: false,
      isLoading: false,
      error: errorMsg,
    });
  }
}
