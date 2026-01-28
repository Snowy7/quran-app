// Juz (Para) data - 30 parts of the Quran
export interface Juz {
  id: number;
  name: string;
  arabicName: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export const JUZ_DATA: Juz[] = [
  { id: 1, name: 'Alif Lam Mim', arabicName: 'الم', startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
  { id: 2, name: 'Sayaqul', arabicName: 'سَيَقُولُ', startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
  { id: 3, name: 'Tilkal Rusul', arabicName: 'تِلْكَ الرُّسُلُ', startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
  { id: 4, name: 'Lan Tanaloo', arabicName: 'لَنْ تَنَالُوا', startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
  { id: 5, name: 'Wal Muhsanat', arabicName: 'وَالْمُحْصَنَاتُ', startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
  { id: 6, name: 'La Yuhibbullah', arabicName: 'لَا يُحِبُّ اللَّهُ', startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
  { id: 7, name: 'Wa Iza Samiu', arabicName: 'وَإِذَا سَمِعُوا', startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
  { id: 8, name: 'Wa Lau Annana', arabicName: 'وَلَوْ أَنَّنَا', startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
  { id: 9, name: 'Qalal Malau', arabicName: 'قَالَ الْمَلَأُ', startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
  { id: 10, name: 'Wa A\'lamu', arabicName: 'وَاعْلَمُوا', startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
  { id: 11, name: 'Ya\'tazirun', arabicName: 'يَعْتَذِرُونَ', startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
  { id: 12, name: 'Wa Mamin Dabbah', arabicName: 'وَمَا مِنْ دَابَّةٍ', startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
  { id: 13, name: 'Wa Ma Ubarriu', arabicName: 'وَمَا أُبَرِّئُ', startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
  { id: 14, name: 'Rubama', arabicName: 'رُبَمَا', startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
  { id: 15, name: 'Subhanallazi', arabicName: 'سُبْحَانَ الَّذِي', startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
  { id: 16, name: 'Qal Alam', arabicName: 'قَالَ أَلَمْ', startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
  { id: 17, name: 'Iqtaraba', arabicName: 'اقْتَرَبَ', startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
  { id: 18, name: 'Qad Aflaha', arabicName: 'قَدْ أَفْلَحَ', startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
  { id: 19, name: 'Wa Qalallazina', arabicName: 'وَقَالَ الَّذِينَ', startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
  { id: 20, name: 'Amman Khalaq', arabicName: 'أَمَّنْ خَلَقَ', startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
  { id: 21, name: 'Utlu Ma Uhiya', arabicName: 'اتْلُ مَا أُوحِيَ', startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
  { id: 22, name: 'Wa Manyaqnut', arabicName: 'وَمَنْ يَقْنُتْ', startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
  { id: 23, name: 'Wa Mali', arabicName: 'وَمَا لِيَ', startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
  { id: 24, name: 'Faman Azlam', arabicName: 'فَمَنْ أَظْلَمُ', startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
  { id: 25, name: 'Ilaihi Yurad', arabicName: 'إِلَيْهِ يُرَدُّ', startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
  { id: 26, name: 'Ha Mim', arabicName: 'حم', startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
  { id: 27, name: 'Qala Fama Khatbukum', arabicName: 'قَالَ فَمَا خَطْبُكُمْ', startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
  { id: 28, name: 'Qad Sami Allah', arabicName: 'قَدْ سَمِعَ اللَّهُ', startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
  { id: 29, name: 'Tabarakallazi', arabicName: 'تَبَارَكَ الَّذِي', startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
  { id: 30, name: 'Amma Yatasa\'alun', arabicName: 'عَمَّ يَتَسَاءَلُونَ', startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];

export function getJuzById(id: number): Juz | undefined {
  return JUZ_DATA.find(j => j.id === id);
}
