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
  mayDayBeBlessed: { ar: "بارك الله في يومك", en: "May your day be blessed" },
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
  viewTafsir: { ar: "عرض التفسير", en: "View Tafsir" },
  hideTafsir: { ar: "إخفاء التفسير", en: "Hide Tafsir" },
  copyVerse: { ar: "نسخ الآية", en: "Copy Verse" },
  share: { ar: "مشاركة", en: "Share" },
  verseCopied: { ar: "تم نسخ الآية", en: "Verse copied" },

  // Reading settings
  readingSettings: { ar: "إعدادات القراءة", en: "Reading Settings" },
  arabicFontSize: { ar: "حجم الخط العربي", en: "Arabic Font Size" },
  arabicFont: { ar: "الخط العربي", en: "Arabic Font" },
  translationFontSize: { ar: "حجم خط الترجمة", en: "Translation Font Size" },
  showTranslation: { ar: "إظهار الترجمة", en: "Show Translation" },
  showTafsir: { ar: "إظهار التفسير", en: "Show Tafsir" },
  tafsirDescription: {
    ar: "تفسير وشرح الآيات",
    en: "Quranic commentary & exegesis",
  },
  tafsirSource: { ar: "مصدر التفسير", en: "Tafsir Source" },
  textBrightness: { ar: "سطوع النص", en: "Text Brightness" },
  layoutSpacing: { ar: "التخطيط والتباعد", en: "Layout & Spacing" },
  readingWidth: { ar: "عرض القراءة", en: "Reading Width" },
  lineHeight: { ar: "ارتفاع السطر", en: "Line Height" },
  wordSpacing: { ar: "تباعد الكلمات", en: "Word Spacing" },
  letterSpacing: { ar: "تباعد الحروف", en: "Letter Spacing" },
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

  // Auth
  signIn: { ar: "تسجيل الدخول", en: "Sign In" },
  signOut: { ar: "تسجيل الخروج", en: "Sign Out" },
  syncDevices: { ar: "مزامنة الأجهزة", en: "Sync across devices" },

  // Settings
  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "الإنجليزية", en: "English" },
  theme: { ar: "المظهر", en: "Theme" },
  helpSupport: { ar: "المساعدة والدعم", en: "Help & Support" },
  appearance: { ar: "المظهر", en: "Appearance" },
  light: { ar: "فاتح", en: "Light" },
  dark: { ar: "داكن", en: "Dark" },
  system: { ar: "النظام", en: "System" },
  layout: { ar: "التخطيط", en: "Layout" },
  contentWidth: { ar: "عرض المحتوى", en: "Content Width" },
  full: { ar: "كامل", en: "Full" },
  contentWidthDesc: {
    ar: "يتحكم في العرض الأقصى على الشاشات الكبيرة.",
    en: "Controls max width on larger screens. Always full width on mobile.",
  },
  reading: { ar: "القراءة", en: "Reading" },
  audio: { ar: "الصوت", en: "Audio" },
  reciter: { ar: "القارئ", en: "Reciter" },
  selectReciter: { ar: "اختر القارئ", en: "Select reciter" },
  change: { ar: "تغيير", en: "Change" },
  data: { ar: "البيانات", en: "Data" },
  exportData: { ar: "تصدير البيانات", en: "Export Data" },
  clearCache: { ar: "مسح الذاكرة المؤقتة", en: "Clear Cache" },
  cacheCleared: { ar: "تم مسح الذاكرة المؤقتة", en: "Cache cleared" },
  dataExported: { ar: "تم تصدير البيانات", en: "Data exported" },
  about: { ar: "حول", en: "About" },
  clearCacheConfirm: { ar: "مسح الذاكرة المؤقتة؟", en: "Clear Cache?" },
  clearCacheDesc: {
    ar: "سيتم حذف البيانات المؤقتة. لن تتأثر الإشارات المرجعية والتقدم.",
    en: "This removes cached API data. Your bookmarks and progress are not affected.",
  },
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
  tapToMarkAdvance: { ar: "اضغط للتعليم مسبقاً", en: "Tap to mark in advance" },
  comingUp: { ar: "قادمة", en: "Coming up" },
  tapToMark: { ar: "اضغط للتعليم", en: "Tap to mark as prayed" },
  timesMethod: {
    ar: "الأوقات محسوبة بطريقة ISNA",
    en: "Times calculated using ISNA method",
  },
  tapPrayerToMark: {
    ar: "اضغط على الصلاة لتعليمها كمؤداة",
    en: "Tap a prayer to mark it as completed",
  },
  completion: { ar: "الإنجاز", en: "Completion" },
  prayers: { ar: "الصلوات", en: "Prayers" },
  prayerBreakdown: {
    ar: "تفصيل الصلوات (آخر ٣٠ يوم)",
    en: "Prayer Breakdown (Last 30 Days)",
  },
  partial: { ar: "جزئي", en: "Partial" },
  complete: { ar: "مكتمل", en: "Complete" },
  missed: { ar: "فائتة", en: "Missed" },
  markPrayerTitle: { ar: "تعليم الصلاة كمؤداة", en: "Mark Prayer as Prayed" },
  prayerTimePassed: {
    ar: "وقت الصلاة قد مضى",
    en: "The prayer time has passed",
  },
  prayedOnTime: { ar: "نعم، صليت في الوقت", en: "Yes, I prayed on time" },
  prayedOnTimeDesc: {
    ar: "صليت قبل دخول وقت الصلاة التالية",
    en: "I prayed before the next prayer time",
  },
  prayedLate: { ar: "لا، صليت متأخراً (قضاء)", en: "No, I prayed late (Qada)" },
  prayedLateDesc: {
    ar: "أقضي صلاة فائتة",
    en: "I'm making up a missed prayer",
  },
  inTime: { ar: "بعد", en: "in" },

  // Qibla page
  qiblaFinder: { ar: "البحث عن القبلة", en: "Qibla Finder" },
  enableLocation: { ar: "تفعيل الموقع", en: "Enable Location" },
  findingQibla: {
    ar: "جاري تحديد اتجاه القبلة...",
    en: "Finding Qibla direction...",
  },
  enableCompass: { ar: "تفعيل البوصلة", en: "Enable Compass" },
  calibrateCompass: {
    ar: "حرك جهازك على شكل رقم ٨ للمعايرة",
    en: "Move your device in a figure-8 to calibrate",
  },
  angleToQibla: {
    ar: "زاوية الجهاز نحو القبلة",
    en: "Device's angle to Qibla",
  },
  qiblaFromNorth: {
    ar: "اتجاه القبلة من الشمال",
    en: "Qibla direction from North",
  },
  facingQibla: { ar: "أنت تتجه نحو القبلة!", en: "You're facing Qibla!" },
  rotatePhone: { ar: "أدر الهاتف", en: "Rotate the phone" },
  toTheRight: { ar: "إلى اليمين", en: "to the right" },
  toTheLeft: { ar: "إلى اليسار", en: "to the left" },
  compassNotAvailable: {
    ar: "البوصلة غير متوفرة على هذا الجهاز",
    en: "Live compass not available on this device",
  },
  compassDenied: { ar: "تم رفض إذن البوصلة", en: "Compass permission denied" },
  checkingCompass: {
    ar: "جاري التحقق من البوصلة...",
    en: "Checking compass...",
  },
  faceDirection: { ar: "اتجه نحو", en: "Face" },
  fromNorthForQibla: {
    ar: "درجة من الشمال نحو القبلة",
    en: "° from North to face Qibla",
  },
  directionToMecca: {
    ar: "اتجاه المسجد الحرام، مكة المكرمة",
    en: "Direction to Masjid al-Haram, Mecca",
  },

  // Memorize page
  all: { ar: "الكل", en: "All" },
  learning: { ar: "قيد الحفظ", en: "Learning" },
  review: { ar: "مراجعة", en: "Review" },
  ofSurahs: { ar: "من ١١٤ سورة", en: "of 114 surahs" },
  resetProgress: { ar: "إعادة تعيين التقدم", en: "Reset progress" },
  noSurahsInCategory: {
    ar: "لا توجد سور في هذه الفئة",
    en: "No surahs in this category",
  },
  markAsMemorizedTitle: { ar: "تعليم كمحفوظة", en: "Mark as Memorized" },
  markAsMemorizedDesc: {
    ar: "سيتم تعليم جميع آيات السورة كمحفوظة. استخدم هذا إذا كنت قد حفظت هذه السورة قبل استخدام التطبيق.",
    en: "This will mark all ayahs as memorized. Use this if you've already memorized this surah before using the app.",
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
  markVersesHint: {
    ar: "علّم الآيات كمحفوظة من القارئ لبدء التتبع",
    en: "Mark verses as memorized from the reader to start tracking",
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
  searchTips: { ar: "نصائح البحث", en: "Search Tips" },
  searchTipSurah: {
    ar: 'ابحث باسم السورة: "الفاتحة" أو "Al-Fatihah"',
    en: 'Search by surah name: "Al-Fatihah" or "الفاتحة"',
  },
  searchTipVerse: {
    ar: 'انتقل إلى آية: "٢:٢٥٥" أو "36:1"',
    en: 'Jump to a verse: "2:255" or "36:1"',
  },
  searchTipMeaning: {
    ar: 'ابحث بالمعنى: "رحمة" أو "هداية"',
    en: 'Search by meaning: "mercy" or "guidance"',
  },
  searchTheQuran: { ar: "ابحث في القرآن", en: "Search the Quran" },
  searchForVerses: {
    ar: "ابحث عن آيات، كلمات، أو مواضيع",
    en: "Search for verses, words, or topics",
  },
  recent: { ar: "الأخيرة", en: "Recent" },
  clearAll: { ar: "مسح الكل", en: "Clear All" },
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
  saveVerseIntoCollections: {
    ar: "احفظ آياتك المفضلة في مجموعات",
    en: "Save your favorite verses into collections",
  },
  createCollection: { ar: "إنشاء مجموعة", en: "Create Collection" },
  newCollection: { ar: "مجموعة جديدة", en: "New Collection" },
  organizeVerses: {
    ar: "نظّم آياتك المحفوظة",
    en: "Organize your saved verses",
  },
  name: { ar: "الاسم", en: "Name" },
  collectionPlaceholder: {
    ar: "مثال: أدعية، مفضلة",
    en: "e.g. Duas, Favorites",
  },
  color: { ar: "اللون", en: "Color" },
  create: { ar: "إنشاء", en: "Create" },
  deleteCollection: { ar: "حذف المجموعة؟", en: "Delete Collection?" },
  deleteCollectionDesc: {
    ar: "سيتم حذف جميع الإشارات في هذه المجموعة. لا يمكن التراجع عن هذا.",
    en: "This will remove all bookmarks in this collection. This cannot be undone.",
  },
  delete: { ar: "حذف", en: "Delete" },
  collection: { ar: "المجموعة", en: "Collection" },
  collectionNotFound: {
    ar: "المجموعة غير موجودة.",
    en: "Collection not found.",
  },
  noSavedVersesYet: {
    ar: "لا توجد آيات محفوظة بعد",
    en: "No saved verses yet",
  },
  saveVersesHint: {
    ar: "احفظ الآيات من القارئ باستخدام أيقونة الإشارة",
    en: "Save verses from the reader using the bookmark icon",
  },

  // Not found
  pageNotFound: { ar: "الصفحة غير موجودة", en: "Page not found" },
  pageNotFoundDesc: {
    ar: "الصفحة التي تبحث عنها غير موجودة.",
    en: "The page you're looking for doesn't exist.",
  },
  goHome: { ar: "العودة للرئيسية", en: "Go Home" },

  // App header
  goBack: { ar: "رجوع", en: "Go back" },

  // Reciter picker
  chooseReciter: { ar: "اختر القارئ", en: "Choose Reciter" },
  selectAReciter: { ar: "اختر قارئ للقرآن", en: "Select a Quran reciter" },

  // Surah list
  noSurahsFound: { ar: "لا توجد سور لـ", en: "No surahs found for" },

  // General
  navigation: { ar: "التنقل", en: "Navigation" },
  more: { ar: "المزيد", en: "More" },
  translationPreview: {
    ar: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    en: "In the name of Allah, the Most Gracious",
  },
  version: { ar: "الإصدار", en: "Version" },
} as const;

export type TranslationKey = keyof typeof translations;
