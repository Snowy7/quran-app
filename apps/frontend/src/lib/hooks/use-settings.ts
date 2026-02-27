import { useState, useEffect } from "react";
import { getSetting } from "@/lib/db/settings";

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
        getSetting<number>("arabicFontSize", DEFAULT_READER.arabicFontSize),
        getSetting<number>(
          "translationFontSize",
          DEFAULT_READER.translationFontSize,
        ),
      ]).then(([arabic, translation]) => {
        const loaded = {
          arabicFontSize: arabic,
          translationFontSize: translation,
        };
        notify(loaded);
      });
    }

    listeners.add(setSettings);
    return () => {
      listeners.delete(setSettings);
    };
  }, []);

  return settings;
}

// ---- Content Width ----

export type ContentWidthOption = "100" | "90" | "80" | "70";

const CONTENT_WIDTH_MAP: Record<ContentWidthOption, string> = {
  "100": "1400px",
  "90": "1100px",
  "80": "960px",
  "70": "768px",
};

// Font scale multiplier for each width setting so text fills the space
const CONTENT_FONT_SCALE: Record<ContentWidthOption, number> = {
  "100": 1.15,
  "90": 1.08,
  "80": 1.0,
  "70": 0.95,
};

let cachedWidth: ContentWidthOption | null = null;
const widthListeners = new Set<(w: ContentWidthOption) => void>();

function notifyWidth(w: ContentWidthOption) {
  cachedWidth = w;
  widthListeners.forEach((fn) => fn(w));
}

export function notifyContentWidthChange(w: ContentWidthOption) {
  notifyWidth(w);
}

export function getContentMaxWidth(w: ContentWidthOption): string {
  return CONTENT_WIDTH_MAP[w] ?? CONTENT_WIDTH_MAP["100"];
}

export function getContentFontScale(w: ContentWidthOption): number {
  return CONTENT_FONT_SCALE[w] ?? 1.0;
}

export function useContentWidth(): ContentWidthOption {
  const [width, setWidth] = useState<ContentWidthOption>(cachedWidth ?? "100");

  useEffect(() => {
    if (!cachedWidth) {
      getSetting<string>("contentWidth", "100").then((v) => {
        const valid: ContentWidthOption[] = ["100", "90", "80", "70"];
        notifyWidth(
          valid.includes(v as ContentWidthOption)
            ? (v as ContentWidthOption)
            : "100",
        );
      });
    }

    widthListeners.add(setWidth);
    return () => {
      widthListeners.delete(setWidth);
    };
  }, []);

  return width;
}
