export type Language = 'ar' | 'en';

export const translations = {
  // App
  appName: { ar: 'القرآن الكريم', en: 'The Noble Quran' },
  noor: { ar: 'نور', en: 'Noor' },

  // Navigation
  home: { ar: 'الرئيسية', en: 'Home' },
  quran: { ar: 'القرآن', en: 'Quran' },
  qibla: { ar: 'القبلة', en: 'Qibla' },
  memorize: { ar: 'الحفظ', en: 'Memorize' },
  search: { ar: 'البحث', en: 'Search' },
  prayerTimes: { ar: 'أوقات الصلاة', en: 'Prayer Times' },
  bookmarks: { ar: 'الإشارات', en: 'Bookmarks' },
  settings: { ar: 'الإعدادات', en: 'Settings' },

  // Prayer names
  fajr: { ar: 'الفجر', en: 'Fajr' },
  sunrise: { ar: 'الشروق', en: 'Sunrise' },
  dhuhr: { ar: 'الظهر', en: 'Dhuhr' },
  asr: { ar: 'العصر', en: 'Asr' },
  maghrib: { ar: 'المغرب', en: 'Maghrib' },
  isha: { ar: 'العشاء', en: 'Isha' },

  // Home page
  dailyVerses: { ar: 'الآيات اليومية', en: 'Daily Verses' },
  nextPrayer: { ar: 'الصلاة التالية', en: 'Next Prayer' },
  remainingTime: { ar: 'الوقت المتبقي', en: 'Remaining' },
  quickAccess: { ar: 'الوصول السريع', en: 'Quick Access' },
  todaysProgress: { ar: 'تقدم اليوم', en: "Today's Progress" },
  streak: { ar: 'أيام متتالية', en: 'Streak' },
  ayahsToday: { ar: 'آيات اليوم', en: 'Ayahs Today' },
  dailyGoal: { ar: 'الهدف اليومي', en: 'Daily Goal' },
  memorization: { ar: 'الحفظ', en: 'Memorization' },
  days: { ar: 'أيام', en: 'days' },
  done: { ar: 'تم', en: 'Done' },

  // Surah page
  surah: { ar: 'السورة', en: 'Surah' },
  juz: { ar: 'الجزء', en: 'Juz' },
  page: { ar: 'الصفحة', en: 'Page' },
  ayahs: { ar: 'آيات', en: 'Ayahs' },
  meccan: { ar: 'مكية', en: 'Meccan' },
  medinan: { ar: 'مدنية', en: 'Medinan' },

  // Reader
  verses: { ar: 'الآيات', en: 'Verses' },
  mushaf: { ar: 'المصحف', en: 'Mushaf' },
  tafseer: { ar: 'تفسير السورة', en: 'Tafseer' },
  addBookmark: { ar: 'إضافة علامة', en: 'Add Bookmark' },

  // Auth
  signIn: { ar: 'تسجيل الدخول', en: 'Sign In' },
  signOut: { ar: 'تسجيل الخروج', en: 'Sign Out' },
  syncDevices: { ar: 'مزامنة الأجهزة', en: 'Sync across devices' },

  // Settings
  language: { ar: 'اللغة', en: 'Language' },
  arabic: { ar: 'العربية', en: 'Arabic' },
  english: { ar: 'الإنجليزية', en: 'English' },
  theme: { ar: 'المظهر', en: 'Theme' },
  helpSupport: { ar: 'المساعدة والدعم', en: 'Help & Support' },

  // General
  navigation: { ar: 'التنقل', en: 'Navigation' },
  more: { ar: 'المزيد', en: 'More' },
} as const;

export type TranslationKey = keyof typeof translations;
