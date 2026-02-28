export type Language = "ar" | "en";

export const translations = {
  // App
  appName: { ar: "القرآن الكريم", en: "The Noble Quran" },
  noor: { ar: "نور", en: "Noor" },

  // Navigation
  home: { ar: "الرئيسية", en: "Home" },
  quran: { ar: "القرآن", en: "Quran" },
  qibla: { ar: "القبلة", en: "Qibla" },
  memorize: { ar: "الحفظ", en: "Memorize" },
  search: { ar: "البحث", en: "Search" },
  prayerTimes: { ar: "أوقات الصلاة", en: "Prayer Times" },
  bookmarks: { ar: "الإشارات", en: "Bookmarks" },
  settings: { ar: "الإعدادات", en: "Settings" },
  saved: { ar: "المحفوظات", en: "Saved" },
  hifz: { ar: "الحفظ", en: "Hifz" },
  prayer: { ar: "الصلاة", en: "Prayer" },

  // Prayer names
  fajr: { ar: "الفجر", en: "Fajr" },
  sunrise: { ar: "الشروق", en: "Sunrise" },
  dhuhr: { ar: "الظهر", en: "Dhuhr" },
  asr: { ar: "العصر", en: "Asr" },
  maghrib: { ar: "المغرب", en: "Maghrib" },
  isha: { ar: "العشاء", en: "Isha" },

  // Home page
  dailyVerses: { ar: "الآيات اليومية", en: "Daily Verses" },
  nextPrayer: { ar: "الصلاة التالية", en: "Next Prayer" },
  remainingTime: { ar: "الوقت المتبقي", en: "Remaining" },
  quickAccess: { ar: "الوصول السريع", en: "Quick Access" },
  todaysProgress: { ar: "تقدم اليوم", en: "Today's Progress" },
  streak: { ar: "أيام متتالية", en: "Streak" },
  ayahsToday: { ar: "آيات اليوم", en: "Ayahs Today" },
  dailyGoal: { ar: "الهدف اليومي", en: "Daily Goal" },
  memorization: { ar: "الحفظ", en: "Memorization" },
  days: { ar: "أيام", en: "days" },
  done: { ar: "تم", en: "Done" },
  greetingPeace: { ar: "السلام عليكم", en: "Peace be upon you" },
  greetingMorning: { ar: "صباح الخير", en: "Good morning" },
  greetingAfternoon: { ar: "مساء الخير", en: "Good afternoon" },
  greetingEvening: { ar: "مساء الخير", en: "Good evening" },
  mayDayBeBlessed: {
    ar: "بارك الله في يومك",
    en: "May your day be blessed",
  },
  lastRead: { ar: "آخر قراءة", en: "Last Read" },
  startReading: { ar: "ابدأ القراءة", en: "Start Reading" },
  beginQuranJourney: {
    ar: "ابدأ رحلتك مع القرآن",
    en: "Begin your Quran journey",
  },
  read: { ar: "قراءة", en: "Read" },
  verseOfTheDay: { ar: "آية اليوم", en: "Verse of the Day" },
  startTracking: { ar: "ابدأ التتبع", en: "Start tracking" },
  viewSchedule: { ar: "عرض الجدول", en: "View schedule" },

  // Surah page
  surah: { ar: "السورة", en: "Surah" },
  juz: { ar: "الجزء", en: "Juz" },
  page: { ar: "الصفحة", en: "Page" },
  ayahs: { ar: "آيات", en: "Ayahs" },
  meccan: { ar: "مكية", en: "Meccan" },
  medinan: { ar: "مدنية", en: "Medinan" },
  searchSurahs: { ar: "ابحث في السور...", en: "Search surahs..." },

  // Reader
  verses: { ar: "الآيات", en: "Verses" },
  mushaf: { ar: "المصحف", en: "Mushaf" },
  tafseer: { ar: "التفسير", en: "Tafsir" },
  addBookmark: { ar: "إضافة علامة", en: "Add Bookmark" },
  translation: { ar: "الترجمة", en: "Translation" },
  wordByWord: { ar: "كلمة بكلمة", en: "Word by Word" },
  failedToLoadVerses: {
    ar: "فشل تحميل الآيات. يرجى المحاولة مرة أخرى.",
    en: "Failed to load verses. Please try again.",
  },
  failedToLoadTafsir: {
    ar: "فشل تحميل التفسير. يرجى المحاولة مرة أخرى.",
    en: "Failed to load tafsir. Please try again.",
  },

  // Verse card actions
  playVerse: { ar: "تشغيل الآية", en: "Play verse" },
  saveVerse: { ar: "حفظ الآية", en: "Save verse" },
  moreActions: { ar: "المزيد", en: "More actions" },
  saveToCollection: { ar: "حفظ في مجموعة", en: "Save to Collection" },
  markAsMemorized: { ar: "تعليم كمحفوظة", en: "Mark as Memorized" },
  playAudio: { ar: "تشغيل الصوت", en: "Play Audio" },
  pauseAudio: { ar: "إيقاف الصوت", en: "Pause Audio" },
  resumeAudio: { ar: "استئناف الصوت", en: "Resume Audio" },
  viewTafsir: { ar: "عرض التفسير", en: "View Tafsir" },
  hideTafsir: { ar: "إخفاء التفسير", en: "Hide Tafsir" },
  copyVerse: { ar: "نسخ الآية", en: "Copy Verse" },
  share: { ar: "مشاركة", en: "Share" },
  verseCopied: { ar: "تم نسخ الآية", en: "Verse copied" },

  // Reading settings
  readingSettings: { ar: "إعدادات القراءة", en: "Reading Settings" },
  arabicFontSize: { ar: "حجم الخط العربي", en: "Arabic Font Size" },
  arabicFont: { ar: "الخط العربي", en: "Arabic Font" },
  translationFontSize: {
    ar: "حجم خط الترجمة",
    en: "Translation Font Size",
  },
  showTranslation: { ar: "إظهار الترجمة", en: "Show Translation" },
  showTafsir: { ar: "إظهار التفسير", en: "Show Tafsir" },
  tafsirDescription: {
    ar: "تفسير وشرح الآيات",
    en: "Quranic commentary & exegesis",
  },
  tafsirSource: { ar: "مصدر التفسير", en: "Tafsir Source" },
  surahNotFound: { ar: "السورة غير موجودة", en: "Surah not found" },
  playbackSpeed: { ar: "سرعة التشغيل", en: "Playback Speed" },
  autoPlayNext: { ar: "تشغيل الآية التالية", en: "Auto-play Next" },
  autoPlayNextDesc: {
    ar: "الانتقال تلقائياً للآية التالية بعد التشغيل",
    en: "Continue to next verse after playback",
  },
  longPressForTafsir: {
    ar: "اضغط مطولاً لعرض التفسير",
    en: "Long press for tafsir",
  },
  ayah: { ar: "آية", en: "Ayah" },
  close: { ar: "إغلاق", en: "Close" },

  // Settings
  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  theme: { ar: "المظهر", en: "Theme" },
  appearance: { ar: "المظهر", en: "Appearance" },
  light: { ar: "فاتح", en: "Light" },
  dark: { ar: "داكن", en: "Dark" },
  system: { ar: "النظام", en: "System" },
  reading: { ar: "القراءة", en: "Reading" },
  audio: { ar: "الصوت", en: "Audio" },
  reciter: { ar: "القارئ", en: "Reciter" },
  selectReciter: { ar: "اختر القارئ", en: "Select reciter" },
  change: { ar: "تغيير", en: "Change" },
  data: { ar: "البيانات", en: "Data" },
  exportData: { ar: "تصدير البيانات", en: "Export Data" },
  clearCache: { ar: "مسح الذاكرة المؤقتة", en: "Clear Cache" },
  cacheCleared: { ar: "تم مسح الذاكرة المؤقتة", en: "Cache cleared" },
  about: { ar: "حول", en: "About" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  clear: { ar: "مسح", en: "Clear" },

  // Prayer Times page
  today: { ar: "اليوم", en: "Today" },
  locationRequired: { ar: "الموقع مطلوب", en: "Location Required" },
  tryAgain: { ar: "حاول مرة أخرى", en: "Try Again" },
  nextPrayerLabel: { ar: "الصلاة التالية", en: "Next Prayer" },
  upcoming: { ar: "قادمة", en: "Upcoming" },
  late: { ar: "فائتة", en: "Late" },
  completed: { ar: "تمت", en: "Completed" },
  inTime: { ar: "بعد", en: "in" },

  // Memorize page
  all: { ar: "الكل", en: "All" },
  learning: { ar: "قيد الحفظ", en: "Learning" },
  review: { ar: "مراجعة", en: "Review" },
  ofSurahs: { ar: "من ١١٤ سورة", en: "of 114 surahs" },
  noSurahsInCategory: {
    ar: "لا توجد سور في هذه الفئة",
    en: "No surahs in this category",
  },
  versesMemorized: { ar: "آية محفوظة", en: "verses memorized" },
  good: { ar: "جيد", en: "Good" },
  dayStreak: { ar: "أيام متتالية", en: "Day Streak" },
  dueNow: { ar: "مستحقة الآن", en: "Due Now" },
  startReview: { ar: "ابدأ المراجعة", en: "Start Review" },
  allCaughtUp: { ar: "كل شيء محدّث!", en: "All caught up!" },
  startMemorizing: { ar: "ابدأ الحفظ", en: "Start memorizing" },
  noVersesDue: {
    ar: "لا توجد آيات مستحقة للمراجعة الآن",
    en: "No verses due for review right now",
  },
  openQuran: { ar: "افتح القرآن", en: "Open Quran" },

  // Search page
  searchPlaceholder: {
    ar: "ابحث عن سور، آيات، أو اكتب ٢:٢٥٥...",
    en: "Search surahs, verses, or type 2:255...",
  },
  surahs: { ar: "السور", en: "Surahs" },
  versesCount: { ar: "الآيات", en: "Verses" },
  noResults: { ar: "لا توجد نتائج لـ", en: "No results found for" },
  searchTheQuran: { ar: "ابحث في القرآن", en: "Search the Quran" },
  searchForVerses: {
    ar: "ابحث عن آيات، كلمات، أو مواضيع",
    en: "Search for verses, words, or topics",
  },
  somethingWentWrong: {
    ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    en: "Something went wrong. Please try again.",
  },

  // Bookmarks / Collections
  noBookmarks: { ar: "لا توجد إشارات مرجعية", en: "No bookmarks" },
  tapBookmarkHint: {
    ar: "اضغط على أيقونة الإشارة في أي آية لحفظها",
    en: "Tap the bookmark icon on any verse to save it",
  },
  browseQuran: { ar: "تصفح القرآن", en: "Browse Quran" },
  verse: { ar: "آية", en: "Verse" },
  collections: { ar: "المجموعات", en: "Collections" },
  noCollectionsYet: { ar: "لا توجد مجموعات بعد", en: "No collections yet" },
  createCollection: { ar: "إنشاء مجموعة", en: "Create Collection" },
  newCollection: { ar: "مجموعة جديدة", en: "New Collection" },
  name: { ar: "الاسم", en: "Name" },
  color: { ar: "اللون", en: "Color" },
  create: { ar: "إنشاء", en: "Create" },
  delete: { ar: "حذف", en: "Delete" },
  collection: { ar: "المجموعة", en: "Collection" },
  noSavedVersesYet: {
    ar: "لا توجد آيات محفوظة بعد",
    en: "No saved verses yet",
  },

  // Not found
  pageNotFound: { ar: "الصفحة غير موجودة", en: "Page not found" },
  goHome: { ar: "العودة للرئيسية", en: "Go Home" },

  // General
  navigation: { ar: "التنقل", en: "Navigation" },
  more: { ar: "المزيد", en: "More" },
  version: { ar: "الإصدار", en: "Version" },

  // Notifications
  enableNotifications: {
    ar: "تفعيل الإشعارات",
    en: "Enable Notifications",
  },
  azanNotifications: { ar: "إشعارات الأذان", en: "Azan Notifications" },
  azanNotificationsDesc: {
    ar: "تلقي إشعار عند دخول وقت كل صلاة",
    en: "Get notified when each prayer time arrives",
  },
} as const;

export type TranslationKey = keyof typeof translations;
