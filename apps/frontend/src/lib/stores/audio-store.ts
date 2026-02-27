import { create } from 'zustand';
import { toast } from 'sonner';
import { getSetting, setSetting } from '@/lib/db/settings';

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentVerseKey: string | null;
  currentChapterId: number | null;
  currentVerseNumber: number | null;
  totalVersesInChapter: number | null;
  reciterId: number;
  reciterSubfolder: string;
  playbackSpeed: number;
  repeatMode: 'off' | 'verse' | 'surah';
  duration: number;
  currentTime: number;
  isVisible: boolean;
}

interface AudioActions {
  play: (verseKey: string, totalVerses?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (time: number) => void;
  setReciter: (id: number, subfolder: string) => void;
  setSpeed: (speed: number) => void;
  setRepeatMode: (mode: AudioState['repeatMode']) => void;
  cleanup: () => void;
}

type AudioStore = AudioState & AudioActions;

// Audio element singleton
let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
  }
  return audio;
}

// Build audio URL from everyayah.com CDN
function buildAudioUrl(subfolder: string, chapter: number, verse: number): string {
  const ch = String(chapter).padStart(3, '0');
  const vs = String(verse).padStart(3, '0');
  return `https://everyayah.com/data/${subfolder}/${ch}${vs}.mp3`;
}

function parseVerseKey(key: string): { chapter: number; verse: number } | null {
  const parts = key.split(':');
  if (parts.length !== 2) return null;
  return { chapter: parseInt(parts[0], 10), verse: parseInt(parts[1], 10) };
}

// Popular reciters with their everyayah.com subfolder paths
export const RECITERS = [
  { id: 7, name: 'Mishary Rashid Alafasy', subfolder: 'Alafasy_128kbps' },
  { id: 5, name: 'Abu Bakr al-Shatri', subfolder: 'Abu_Bakr_Ash-Shaatree_128kbps' },
  { id: 1, name: 'Abdul Basit (Murattal)', subfolder: 'Abdul_Basit_Murattal_192kbps' },
  { id: 6, name: 'Maher Al Muaiqly', subfolder: 'MasherAlAfasi_128kbps' },
  { id: 4, name: 'Hani Ar-Rifai', subfolder: 'Hani_Rifai_192kbps' },
  { id: 3, name: 'Abdur-Rahman as-Sudais', subfolder: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 2, name: 'Sa`ud ash-Shuraym', subfolder: 'Saood_ash-Shuraym_128kbps' },
  { id: 8, name: 'Muhammad Siddiq al-Minshawi', subfolder: 'Minshawy_Murattal_128kbps' },
  { id: 9, name: 'Al-Husary', subfolder: 'Husary_128kbps' },
  { id: 10, name: 'Al-Husary (Muallim)', subfolder: 'Husary_Muallim_128kbps' },
];

const initialState: AudioState = {
  isPlaying: false,
  isLoading: false,
  currentVerseKey: null,
  currentChapterId: null,
  currentVerseNumber: null,
  totalVersesInChapter: null,
  reciterId: 7,
  reciterSubfolder: 'Alafasy_128kbps',
  playbackSpeed: 1,
  repeatMode: 'off',
  duration: 0,
  currentTime: 0,
  isVisible: false,
};

export const useAudioStore = create<AudioStore>((set, get) => ({
  ...initialState,

  play: (verseKey: string, totalVerses?: number) => {
    const parsed = parseVerseKey(verseKey);
    if (!parsed) return;

    const { reciterSubfolder, playbackSpeed } = get();
    const el = getAudio();

    // Clean up previous listeners
    el.onended = null;
    el.ontimeupdate = null;
    el.onloadedmetadata = null;
    el.onplay = null;
    el.onpause = null;
    el.onerror = null;

    const url = buildAudioUrl(reciterSubfolder, parsed.chapter, parsed.verse);

    set({
      currentVerseKey: verseKey,
      currentChapterId: parsed.chapter,
      currentVerseNumber: parsed.verse,
      totalVersesInChapter: totalVerses ?? get().totalVersesInChapter,
      isLoading: true,
      isVisible: true,
      currentTime: 0,
      duration: 0,
    });

    el.src = url;
    el.playbackRate = playbackSpeed;

    el.onloadedmetadata = () => {
      set({ duration: el.duration, isLoading: false });
    };

    el.ontimeupdate = () => {
      set({ currentTime: el.currentTime });
    };

    el.onplay = () => set({ isPlaying: true, isLoading: false });
    el.onpause = () => set({ isPlaying: false });

    el.onerror = () => {
      set({ isLoading: false, isPlaying: false });
      toast.error('Could not load audio');
    };

    el.onended = () => {
      const state = get();
      if (state.repeatMode === 'verse') {
        // Replay same verse
        el.currentTime = 0;
        el.play().catch(() => {});
      } else if (state.repeatMode === 'surah' || state.repeatMode === 'off') {
        // Auto-advance to next verse
        get().next();
      }
    };

    el.play().catch(() => {
      set({ isLoading: false });
    });
  },

  pause: () => {
    getAudio().pause();
  },

  resume: () => {
    const el = getAudio();
    el.play().catch(() => {});
  },

  stop: () => {
    const el = getAudio();
    el.pause();
    el.src = '';
    set({ ...initialState });
  },

  next: () => {
    const { currentChapterId, currentVerseNumber, totalVersesInChapter, repeatMode } = get();
    if (!currentChapterId || !currentVerseNumber) return;

    const nextVerse = currentVerseNumber + 1;
    const maxVerses = totalVersesInChapter || 999;

    if (nextVerse > maxVerses) {
      if (repeatMode === 'surah') {
        // Loop back to verse 1
        get().play(`${currentChapterId}:1`, totalVersesInChapter ?? undefined);
      } else {
        // End of surah
        set({ isPlaying: false });
      }
      return;
    }

    get().play(`${currentChapterId}:${nextVerse}`, totalVersesInChapter ?? undefined);
  },

  previous: () => {
    const { currentChapterId, currentVerseNumber, totalVersesInChapter } = get();
    if (!currentChapterId || !currentVerseNumber) return;

    // If more than 3 seconds in, restart current verse
    const el = getAudio();
    if (el.currentTime > 3) {
      el.currentTime = 0;
      el.play().catch(() => {});
      return;
    }

    const prevVerse = Math.max(1, currentVerseNumber - 1);
    get().play(`${currentChapterId}:${prevVerse}`, totalVersesInChapter ?? undefined);
  },

  seekTo: (time: number) => {
    const el = getAudio();
    el.currentTime = time;
  },

  setReciter: (id: number, subfolder: string) => {
    set({ reciterId: id, reciterSubfolder: subfolder });
    // Persist to Dexie
    setSetting('reciterId', id).catch(() => {});
    setSetting('reciterSubfolder', subfolder).catch(() => {});
    // If currently playing, reload with new reciter
    const { currentVerseKey, isPlaying, totalVersesInChapter } = get();
    if (currentVerseKey && isPlaying) {
      setTimeout(() => get().play(currentVerseKey, totalVersesInChapter ?? undefined), 50);
    }
  },

  setSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
    const el = getAudio();
    el.playbackRate = speed;
    setSetting('playbackSpeed', speed).catch(() => {});
  },

  setRepeatMode: (mode: AudioState['repeatMode']) => set({ repeatMode: mode }),

  cleanup: () => {
    const el = getAudio();
    el.pause();
    el.src = '';
    el.onended = null;
    el.ontimeupdate = null;
    el.onloadedmetadata = null;
    el.onplay = null;
    el.onpause = null;
    el.onerror = null;
    set({ ...initialState });
  },
}));

// Load persisted audio settings from Dexie on startup
(async function loadPersistedAudioSettings() {
  try {
    const [reciterId, reciterSubfolder, playbackSpeed] = await Promise.all([
      getSetting<number>('reciterId'),
      getSetting<string>('reciterSubfolder'),
      getSetting<number>('playbackSpeed'),
    ]);
    const updates: Partial<AudioState> = {};
    if (reciterId && reciterSubfolder) {
      updates.reciterId = reciterId;
      updates.reciterSubfolder = reciterSubfolder;
    }
    if (playbackSpeed) {
      updates.playbackSpeed = playbackSpeed;
    }
    if (Object.keys(updates).length > 0) {
      useAudioStore.setState(updates);
    }
  } catch {
    // Dexie may not be ready yet on first boot - defaults are fine
  }
})();
