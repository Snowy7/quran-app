import type { Surah } from '@/types/quran';

// Static Surah metadata - available offline immediately
export const SURAHS: Surah[] = [
  { id: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan', startJuz: 1, endJuz: 1 },
  { id: 2, name: 'البقرة', englishName: 'Al-Baqarah', englishNameTranslation: 'The Cow', numberOfAyahs: 286, revelationType: 'Medinan', startJuz: 1, endJuz: 3 },
  { id: 3, name: 'آل عمران', englishName: 'Aal-Imran', englishNameTranslation: 'The Family of Imran', numberOfAyahs: 200, revelationType: 'Medinan', startJuz: 3, endJuz: 4 },
  { id: 4, name: 'النساء', englishName: 'An-Nisa', englishNameTranslation: 'The Women', numberOfAyahs: 176, revelationType: 'Medinan', startJuz: 4, endJuz: 6 },
  { id: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', englishNameTranslation: 'The Table Spread', numberOfAyahs: 120, revelationType: 'Medinan', startJuz: 6, endJuz: 7 },
  { id: 6, name: 'الأنعام', englishName: 'Al-An\'am', englishNameTranslation: 'The Cattle', numberOfAyahs: 165, revelationType: 'Meccan', startJuz: 7, endJuz: 8 },
  { id: 7, name: 'الأعراف', englishName: 'Al-A\'raf', englishNameTranslation: 'The Heights', numberOfAyahs: 206, revelationType: 'Meccan', startJuz: 8, endJuz: 9 },
  { id: 8, name: 'الأنفال', englishName: 'Al-Anfal', englishNameTranslation: 'The Spoils of War', numberOfAyahs: 75, revelationType: 'Medinan', startJuz: 9, endJuz: 10 },
  { id: 9, name: 'التوبة', englishName: 'At-Tawbah', englishNameTranslation: 'The Repentance', numberOfAyahs: 129, revelationType: 'Medinan', startJuz: 10, endJuz: 11 },
  { id: 10, name: 'يونس', englishName: 'Yunus', englishNameTranslation: 'Jonah', numberOfAyahs: 109, revelationType: 'Meccan', startJuz: 11, endJuz: 11 },
  { id: 11, name: 'هود', englishName: 'Hud', englishNameTranslation: 'Hud', numberOfAyahs: 123, revelationType: 'Meccan', startJuz: 11, endJuz: 12 },
  { id: 12, name: 'يوسف', englishName: 'Yusuf', englishNameTranslation: 'Joseph', numberOfAyahs: 111, revelationType: 'Meccan', startJuz: 12, endJuz: 13 },
  { id: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', englishNameTranslation: 'The Thunder', numberOfAyahs: 43, revelationType: 'Medinan', startJuz: 13, endJuz: 13 },
  { id: 14, name: 'إبراهيم', englishName: 'Ibrahim', englishNameTranslation: 'Abraham', numberOfAyahs: 52, revelationType: 'Meccan', startJuz: 13, endJuz: 13 },
  { id: 15, name: 'الحجر', englishName: 'Al-Hijr', englishNameTranslation: 'The Rocky Tract', numberOfAyahs: 99, revelationType: 'Meccan', startJuz: 14, endJuz: 14 },
  { id: 16, name: 'النحل', englishName: 'An-Nahl', englishNameTranslation: 'The Bee', numberOfAyahs: 128, revelationType: 'Meccan', startJuz: 14, endJuz: 14 },
  { id: 17, name: 'الإسراء', englishName: 'Al-Isra', englishNameTranslation: 'The Night Journey', numberOfAyahs: 111, revelationType: 'Meccan', startJuz: 15, endJuz: 15 },
  { id: 18, name: 'الكهف', englishName: 'Al-Kahf', englishNameTranslation: 'The Cave', numberOfAyahs: 110, revelationType: 'Meccan', startJuz: 15, endJuz: 16 },
  { id: 19, name: 'مريم', englishName: 'Maryam', englishNameTranslation: 'Mary', numberOfAyahs: 98, revelationType: 'Meccan', startJuz: 16, endJuz: 16 },
  { id: 20, name: 'طه', englishName: 'Ta-Ha', englishNameTranslation: 'Ta-Ha', numberOfAyahs: 135, revelationType: 'Meccan', startJuz: 16, endJuz: 16 },
  { id: 21, name: 'الأنبياء', englishName: 'Al-Anbiya', englishNameTranslation: 'The Prophets', numberOfAyahs: 112, revelationType: 'Meccan', startJuz: 17, endJuz: 17 },
  { id: 22, name: 'الحج', englishName: 'Al-Hajj', englishNameTranslation: 'The Pilgrimage', numberOfAyahs: 78, revelationType: 'Medinan', startJuz: 17, endJuz: 17 },
  { id: 23, name: 'المؤمنون', englishName: 'Al-Mu\'minun', englishNameTranslation: 'The Believers', numberOfAyahs: 118, revelationType: 'Meccan', startJuz: 18, endJuz: 18 },
  { id: 24, name: 'النور', englishName: 'An-Nur', englishNameTranslation: 'The Light', numberOfAyahs: 64, revelationType: 'Medinan', startJuz: 18, endJuz: 18 },
  { id: 25, name: 'الفرقان', englishName: 'Al-Furqan', englishNameTranslation: 'The Criterion', numberOfAyahs: 77, revelationType: 'Meccan', startJuz: 18, endJuz: 19 },
  { id: 26, name: 'الشعراء', englishName: 'Ash-Shu\'ara', englishNameTranslation: 'The Poets', numberOfAyahs: 227, revelationType: 'Meccan', startJuz: 19, endJuz: 19 },
  { id: 27, name: 'النمل', englishName: 'An-Naml', englishNameTranslation: 'The Ant', numberOfAyahs: 93, revelationType: 'Meccan', startJuz: 19, endJuz: 20 },
  { id: 28, name: 'القصص', englishName: 'Al-Qasas', englishNameTranslation: 'The Stories', numberOfAyahs: 88, revelationType: 'Meccan', startJuz: 20, endJuz: 20 },
  { id: 29, name: 'العنكبوت', englishName: 'Al-Ankabut', englishNameTranslation: 'The Spider', numberOfAyahs: 69, revelationType: 'Meccan', startJuz: 20, endJuz: 21 },
  { id: 30, name: 'الروم', englishName: 'Ar-Rum', englishNameTranslation: 'The Romans', numberOfAyahs: 60, revelationType: 'Meccan', startJuz: 21, endJuz: 21 },
  { id: 31, name: 'لقمان', englishName: 'Luqman', englishNameTranslation: 'Luqman', numberOfAyahs: 34, revelationType: 'Meccan', startJuz: 21, endJuz: 21 },
  { id: 32, name: 'السجدة', englishName: 'As-Sajdah', englishNameTranslation: 'The Prostration', numberOfAyahs: 30, revelationType: 'Meccan', startJuz: 21, endJuz: 21 },
  { id: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', englishNameTranslation: 'The Combined Forces', numberOfAyahs: 73, revelationType: 'Medinan', startJuz: 21, endJuz: 22 },
  { id: 34, name: 'سبأ', englishName: 'Saba', englishNameTranslation: 'Sheba', numberOfAyahs: 54, revelationType: 'Meccan', startJuz: 22, endJuz: 22 },
  { id: 35, name: 'فاطر', englishName: 'Fatir', englishNameTranslation: 'Originator', numberOfAyahs: 45, revelationType: 'Meccan', startJuz: 22, endJuz: 22 },
  { id: 36, name: 'يس', englishName: 'Ya-Sin', englishNameTranslation: 'Ya-Sin', numberOfAyahs: 83, revelationType: 'Meccan', startJuz: 22, endJuz: 23 },
  { id: 37, name: 'الصافات', englishName: 'As-Saffat', englishNameTranslation: 'Those Who Set The Ranks', numberOfAyahs: 182, revelationType: 'Meccan', startJuz: 23, endJuz: 23 },
  { id: 38, name: 'ص', englishName: 'Sad', englishNameTranslation: 'Sad', numberOfAyahs: 88, revelationType: 'Meccan', startJuz: 23, endJuz: 23 },
  { id: 39, name: 'الزمر', englishName: 'Az-Zumar', englishNameTranslation: 'The Troops', numberOfAyahs: 75, revelationType: 'Meccan', startJuz: 23, endJuz: 24 },
  { id: 40, name: 'غافر', englishName: 'Ghafir', englishNameTranslation: 'The Forgiver', numberOfAyahs: 85, revelationType: 'Meccan', startJuz: 24, endJuz: 24 },
  { id: 41, name: 'فصلت', englishName: 'Fussilat', englishNameTranslation: 'Explained in Detail', numberOfAyahs: 54, revelationType: 'Meccan', startJuz: 24, endJuz: 25 },
  { id: 42, name: 'الشورى', englishName: 'Ash-Shura', englishNameTranslation: 'The Consultation', numberOfAyahs: 53, revelationType: 'Meccan', startJuz: 25, endJuz: 25 },
  { id: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', englishNameTranslation: 'The Ornaments of Gold', numberOfAyahs: 89, revelationType: 'Meccan', startJuz: 25, endJuz: 25 },
  { id: 44, name: 'الدخان', englishName: 'Ad-Dukhan', englishNameTranslation: 'The Smoke', numberOfAyahs: 59, revelationType: 'Meccan', startJuz: 25, endJuz: 25 },
  { id: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', englishNameTranslation: 'The Crouching', numberOfAyahs: 37, revelationType: 'Meccan', startJuz: 25, endJuz: 25 },
  { id: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', englishNameTranslation: 'The Wind-Curved Sandhills', numberOfAyahs: 35, revelationType: 'Meccan', startJuz: 26, endJuz: 26 },
  { id: 47, name: 'محمد', englishName: 'Muhammad', englishNameTranslation: 'Muhammad', numberOfAyahs: 38, revelationType: 'Medinan', startJuz: 26, endJuz: 26 },
  { id: 48, name: 'الفتح', englishName: 'Al-Fath', englishNameTranslation: 'The Victory', numberOfAyahs: 29, revelationType: 'Medinan', startJuz: 26, endJuz: 26 },
  { id: 49, name: 'الحجرات', englishName: 'Al-Hujurat', englishNameTranslation: 'The Rooms', numberOfAyahs: 18, revelationType: 'Medinan', startJuz: 26, endJuz: 26 },
  { id: 50, name: 'ق', englishName: 'Qaf', englishNameTranslation: 'Qaf', numberOfAyahs: 45, revelationType: 'Meccan', startJuz: 26, endJuz: 26 },
  { id: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', englishNameTranslation: 'The Winnowing Winds', numberOfAyahs: 60, revelationType: 'Meccan', startJuz: 26, endJuz: 27 },
  { id: 52, name: 'الطور', englishName: 'At-Tur', englishNameTranslation: 'The Mount', numberOfAyahs: 49, revelationType: 'Meccan', startJuz: 27, endJuz: 27 },
  { id: 53, name: 'النجم', englishName: 'An-Najm', englishNameTranslation: 'The Star', numberOfAyahs: 62, revelationType: 'Meccan', startJuz: 27, endJuz: 27 },
  { id: 54, name: 'القمر', englishName: 'Al-Qamar', englishNameTranslation: 'The Moon', numberOfAyahs: 55, revelationType: 'Meccan', startJuz: 27, endJuz: 27 },
  { id: 55, name: 'الرحمن', englishName: 'Ar-Rahman', englishNameTranslation: 'The Beneficent', numberOfAyahs: 78, revelationType: 'Medinan', startJuz: 27, endJuz: 27 },
  { id: 56, name: 'الواقعة', englishName: 'Al-Waqi\'ah', englishNameTranslation: 'The Inevitable', numberOfAyahs: 96, revelationType: 'Meccan', startJuz: 27, endJuz: 27 },
  { id: 57, name: 'الحديد', englishName: 'Al-Hadid', englishNameTranslation: 'The Iron', numberOfAyahs: 29, revelationType: 'Medinan', startJuz: 27, endJuz: 27 },
  { id: 58, name: 'المجادلة', englishName: 'Al-Mujadila', englishNameTranslation: 'The Pleading Woman', numberOfAyahs: 22, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 59, name: 'الحشر', englishName: 'Al-Hashr', englishNameTranslation: 'The Exile', numberOfAyahs: 24, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', englishNameTranslation: 'She That Is To Be Examined', numberOfAyahs: 13, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 61, name: 'الصف', englishName: 'As-Saf', englishNameTranslation: 'The Ranks', numberOfAyahs: 14, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 62, name: 'الجمعة', englishName: 'Al-Jumu\'ah', englishNameTranslation: 'The Congregation', numberOfAyahs: 11, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', englishNameTranslation: 'The Hypocrites', numberOfAyahs: 11, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 64, name: 'التغابن', englishName: 'At-Taghabun', englishNameTranslation: 'The Mutual Disillusion', numberOfAyahs: 18, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 65, name: 'الطلاق', englishName: 'At-Talaq', englishNameTranslation: 'The Divorce', numberOfAyahs: 12, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 66, name: 'التحريم', englishName: 'At-Tahrim', englishNameTranslation: 'The Prohibition', numberOfAyahs: 12, revelationType: 'Medinan', startJuz: 28, endJuz: 28 },
  { id: 67, name: 'الملك', englishName: 'Al-Mulk', englishNameTranslation: 'The Sovereignty', numberOfAyahs: 30, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 68, name: 'القلم', englishName: 'Al-Qalam', englishNameTranslation: 'The Pen', numberOfAyahs: 52, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 69, name: 'الحاقة', englishName: 'Al-Haqqah', englishNameTranslation: 'The Reality', numberOfAyahs: 52, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 70, name: 'المعارج', englishName: 'Al-Ma\'arij', englishNameTranslation: 'The Ascending Stairways', numberOfAyahs: 44, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 71, name: 'نوح', englishName: 'Nuh', englishNameTranslation: 'Noah', numberOfAyahs: 28, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 72, name: 'الجن', englishName: 'Al-Jinn', englishNameTranslation: 'The Jinn', numberOfAyahs: 28, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 73, name: 'المزمل', englishName: 'Al-Muzzammil', englishNameTranslation: 'The Enshrouded One', numberOfAyahs: 20, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 74, name: 'المدثر', englishName: 'Al-Muddathir', englishNameTranslation: 'The Cloaked One', numberOfAyahs: 56, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 75, name: 'القيامة', englishName: 'Al-Qiyamah', englishNameTranslation: 'The Resurrection', numberOfAyahs: 40, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 76, name: 'الإنسان', englishName: 'Al-Insan', englishNameTranslation: 'The Man', numberOfAyahs: 31, revelationType: 'Medinan', startJuz: 29, endJuz: 29 },
  { id: 77, name: 'المرسلات', englishName: 'Al-Mursalat', englishNameTranslation: 'The Emissaries', numberOfAyahs: 50, revelationType: 'Meccan', startJuz: 29, endJuz: 29 },
  { id: 78, name: 'النبأ', englishName: 'An-Naba', englishNameTranslation: 'The Tidings', numberOfAyahs: 40, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 79, name: 'النازعات', englishName: 'An-Nazi\'at', englishNameTranslation: 'Those Who Drag Forth', numberOfAyahs: 46, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 80, name: 'عبس', englishName: '\'Abasa', englishNameTranslation: 'He Frowned', numberOfAyahs: 42, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 81, name: 'التكوير', englishName: 'At-Takwir', englishNameTranslation: 'The Overthrowing', numberOfAyahs: 29, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 82, name: 'الانفطار', englishName: 'Al-Infitar', englishNameTranslation: 'The Cleaving', numberOfAyahs: 19, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', englishNameTranslation: 'The Defrauding', numberOfAyahs: 36, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaq', englishNameTranslation: 'The Sundering', numberOfAyahs: 25, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 85, name: 'البروج', englishName: 'Al-Buruj', englishNameTranslation: 'The Mansions of the Stars', numberOfAyahs: 22, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 86, name: 'الطارق', englishName: 'At-Tariq', englishNameTranslation: 'The Night-Comer', numberOfAyahs: 17, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 87, name: 'الأعلى', englishName: 'Al-A\'la', englishNameTranslation: 'The Most High', numberOfAyahs: 19, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', englishNameTranslation: 'The Overwhelming', numberOfAyahs: 26, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 89, name: 'الفجر', englishName: 'Al-Fajr', englishNameTranslation: 'The Dawn', numberOfAyahs: 30, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 90, name: 'البلد', englishName: 'Al-Balad', englishNameTranslation: 'The City', numberOfAyahs: 20, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 91, name: 'الشمس', englishName: 'Ash-Shams', englishNameTranslation: 'The Sun', numberOfAyahs: 15, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 92, name: 'الليل', englishName: 'Al-Layl', englishNameTranslation: 'The Night', numberOfAyahs: 21, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 93, name: 'الضحى', englishName: 'Ad-Duhaa', englishNameTranslation: 'The Morning Hours', numberOfAyahs: 11, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 94, name: 'الشرح', englishName: 'Ash-Sharh', englishNameTranslation: 'The Relief', numberOfAyahs: 8, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 95, name: 'التين', englishName: 'At-Tin', englishNameTranslation: 'The Fig', numberOfAyahs: 8, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 96, name: 'العلق', englishName: 'Al-Alaq', englishNameTranslation: 'The Clot', numberOfAyahs: 19, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 97, name: 'القدر', englishName: 'Al-Qadr', englishNameTranslation: 'The Power', numberOfAyahs: 5, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 98, name: 'البينة', englishName: 'Al-Bayyinah', englishNameTranslation: 'The Clear Proof', numberOfAyahs: 8, revelationType: 'Medinan', startJuz: 30, endJuz: 30 },
  { id: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', englishNameTranslation: 'The Earthquake', numberOfAyahs: 8, revelationType: 'Medinan', startJuz: 30, endJuz: 30 },
  { id: 100, name: 'العاديات', englishName: 'Al-Adiyat', englishNameTranslation: 'The Chargers', numberOfAyahs: 11, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 101, name: 'القارعة', englishName: 'Al-Qari\'ah', englishNameTranslation: 'The Calamity', numberOfAyahs: 11, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 102, name: 'التكاثر', englishName: 'At-Takathur', englishNameTranslation: 'The Rivalry in Worldly Increase', numberOfAyahs: 8, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 103, name: 'العصر', englishName: 'Al-Asr', englishNameTranslation: 'The Declining Day', numberOfAyahs: 3, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 104, name: 'الهمزة', englishName: 'Al-Humazah', englishNameTranslation: 'The Traducer', numberOfAyahs: 9, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 105, name: 'الفيل', englishName: 'Al-Fil', englishNameTranslation: 'The Elephant', numberOfAyahs: 5, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 106, name: 'قريش', englishName: 'Quraysh', englishNameTranslation: 'Quraysh', numberOfAyahs: 4, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 107, name: 'الماعون', englishName: 'Al-Ma\'un', englishNameTranslation: 'The Small Kindnesses', numberOfAyahs: 7, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 108, name: 'الكوثر', englishName: 'Al-Kawthar', englishNameTranslation: 'The Abundance', numberOfAyahs: 3, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 109, name: 'الكافرون', englishName: 'Al-Kafirun', englishNameTranslation: 'The Disbelievers', numberOfAyahs: 6, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 110, name: 'النصر', englishName: 'An-Nasr', englishNameTranslation: 'The Divine Support', numberOfAyahs: 3, revelationType: 'Medinan', startJuz: 30, endJuz: 30 },
  { id: 111, name: 'المسد', englishName: 'Al-Masad', englishNameTranslation: 'The Palm Fiber', numberOfAyahs: 5, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', englishNameTranslation: 'The Sincerity', numberOfAyahs: 4, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 113, name: 'الفلق', englishName: 'Al-Falaq', englishNameTranslation: 'The Daybreak', numberOfAyahs: 5, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
  { id: 114, name: 'الناس', englishName: 'An-Nas', englishNameTranslation: 'The Mankind', numberOfAyahs: 6, revelationType: 'Meccan', startJuz: 30, endJuz: 30 },
];

// Helper function to get a surah by ID
export function getSurahById(id: number): Surah | undefined {
  return SURAHS.find((s) => s.id === id);
}

// Helper function to search surahs
export function searchSurahs(query: string): Surah[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return SURAHS;

  return SURAHS.filter(
    (s) =>
      s.name.includes(query) ||
      s.englishName.toLowerCase().includes(lowerQuery) ||
      s.englishNameTranslation.toLowerCase().includes(lowerQuery) ||
      s.id.toString() === lowerQuery
  );
}

// Total ayahs in the Quran
export const TOTAL_AYAHS = 6236;

// Bismillah text (used at the start of most surahs)
export const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

// Surah that doesn't start with Bismillah
export const SURAH_WITHOUT_BISMILLAH = 9; // At-Tawbah
