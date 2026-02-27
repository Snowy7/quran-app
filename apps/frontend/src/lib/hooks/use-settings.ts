import { useState, useEffect } from 'react';
import { getSetting } from '@/lib/db/settings';

interface ReaderSettings {
  arabicFontSize: number;
  translationFontSize: number;
}

const DEFAULT_READER: ReaderSettings = {
  arabicFontSize: 28,
  translationFontSize: 16,
};

let cachedSettings: ReaderSettings | null = null;
const listeners = new Set<(s: ReaderSettings) => void>();

function notify(s: ReaderSettings) {
  cachedSettings = s;
  listeners.forEach((fn) => fn(s));
}

// Called from settings page when user changes a value
export function notifySettingsChange(key: keyof ReaderSettings, value: number) {
  const next = { ...(cachedSettings ?? DEFAULT_READER), [key]: value };
  notify(next);
}

export function useReaderSettings(): ReaderSettings {
  const [settings, setSettings] = useState<ReaderSettings>(
    cachedSettings ?? DEFAULT_READER,
  );

  useEffect(() => {
    // Load from Dexie on first use
    if (!cachedSettings) {
      Promise.all([
        getSetting<number>('arabicFontSize', DEFAULT_READER.arabicFontSize),
        getSetting<number>('translationFontSize', DEFAULT_READER.translationFontSize),
      ]).then(([arabic, translation]) => {
        const loaded = { arabicFontSize: arabic, translationFontSize: translation };
        notify(loaded);
      });
    }

    listeners.add(setSettings);
    return () => { listeners.delete(setSettings); };
  }, []);

  return settings;
}
