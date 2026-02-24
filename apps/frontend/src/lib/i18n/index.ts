import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Language, type TranslationKey } from './translations';

export type { Language, TranslationKey };
export { translations };

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => {
        set({ language });
        // Update document direction and lang
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
      },
    }),
    {
      name: 'noor-language',
      onRehydrateStorage: () => (state?: I18nState) => {
        // Apply saved language on app load
        if (state?.language) {
          document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = state.language;
        }
      },
    }
  )
);

/** Hook to get translated string */
export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);

  function t(key: TranslationKey): string {
    return translations[key][language];
  }

  const isRTL = language === 'ar';

  return { t, language, setLanguage, isRTL };
}
