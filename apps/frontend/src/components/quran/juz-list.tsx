import { Link } from "react-router-dom";
import { Skeleton } from "@template/ui";

const JUZ_DATA = [
  { juz: 1, surah: "Al-Fatiha", start: "1:1" },
  { juz: 2, surah: "Al-Baqarah", start: "2:142" },
  { juz: 3, surah: "Al-Baqarah", start: "2:253" },
  { juz: 4, surah: "Ali 'Imran", start: "3:93" },
  { juz: 5, surah: "An-Nisa'", start: "4:24" },
  { juz: 6, surah: "An-Nisa'", start: "4:148" },
  { juz: 7, surah: "Al-Ma'idah", start: "5:83" },
  { juz: 8, surah: "Al-An'am", start: "6:111" },
  { juz: 9, surah: "Al-A'raf", start: "7:88" },
  { juz: 10, surah: "Al-Anfal", start: "8:41" },
  { juz: 11, surah: "At-Tawbah", start: "9:93" },
  { juz: 12, surah: "Hud", start: "11:6" },
  { juz: 13, surah: "Yusuf", start: "12:53" },
  { juz: 14, surah: "Al-Hijr", start: "15:1" },
  { juz: 15, surah: "Al-Isra", start: "17:1" },
  { juz: 16, surah: "Al-Kahf", start: "18:75" },
  { juz: 17, surah: "Al-Anbya", start: "21:1" },
  { juz: 18, surah: "Al-Mu'minun", start: "23:1" },
  { juz: 19, surah: "Al-Furqan", start: "25:21" },
  { juz: 20, surah: "An-Naml", start: "27:56" },
  { juz: 21, surah: "Al-'Ankabut", start: "29:46" },
  { juz: 22, surah: "Al-Ahzab", start: "33:31" },
  { juz: 23, surah: "Ya-Sin", start: "36:28" },
  { juz: 24, surah: "Az-Zumar", start: "39:32" },
  { juz: 25, surah: "Fussilat", start: "41:47" },
  { juz: 26, surah: "Al-Ahqaf", start: "46:1" },
  { juz: 27, surah: "Adh-Dhariyat", start: "51:31" },
  { juz: 28, surah: "Al-Mujadila", start: "58:1" },
  { juz: 29, surah: "Al-Mulk", start: "67:1" },
  { juz: 30, surah: "An-Naba", start: "78:1" },
];

interface JuzListProps {
  isLoading?: boolean;
}

export function JuzList({ isLoading }: JuzListProps) {
  if (isLoading) {
    return (
      <div className="px-6 space-y-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-3 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-6">
      {JUZ_DATA.map(({ juz, surah, start }) => (
        <Link
          key={juz}
          to={`/quran/juz/${juz}`}
          className="flex items-center gap-4 py-4 border-b border-border/30 last:border-0 hover:bg-secondary/30 -mx-6 px-6 transition-colors active:bg-secondary/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary font-bold text-sm shrink-0">
            {juz}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] text-foreground">
              Juz {juz}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Starts at {surah} ({start})
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
