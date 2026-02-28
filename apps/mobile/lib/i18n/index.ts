import { create } from "zustand";
import AsyncStorage from "../storage/async-storage";
import {
  translations,
  type Language,
  type TranslationKey,
} from "./translations";
import { I18nManager } from "react-native";

export type { Language, TranslationKey };
export { translations };

interface I18nState {
  language: Language;
  isHydrated: boolean;
  setLanguage: (lang: Language) => void;
  hydrate: () => Promise<void>;
}

export const useI18nStore = create<I18nState>()((set) => ({
  language: "en",
  isHydrated: false,
  setLanguage: (language) => {
    set({ language });
    AsyncStorage.setItem("noor-language", language);
    // Note: RTL layout changes require app restart on native
    I18nManager.forceRTL(language === "ar");
  },
  hydrate: async () => {
    const saved = await AsyncStorage.getItem("noor-language");
    if (saved === "ar" || saved === "en") {
      set({ language: saved, isHydrated: true });
      I18nManager.forceRTL(saved === "ar");
    } else {
      set({ isHydrated: true });
    }
  },
}));

/** Hook to get translated string */
export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);

  function t(key: TranslationKey): string {
    return translations[key][language];
  }

  const isRTL = language === "ar";

  return { t, language, setLanguage, isRTL };
}
