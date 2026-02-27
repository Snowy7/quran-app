import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Brain,
  ChevronRight,
  Search,
  Bookmark,
  Flame,
  Settings,
  Clock,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { Button, Card, CardContent } from "@template/ui";
import { cn } from "@/lib/utils";
import { useChapters } from "@/lib/api/chapters";
import { getLastRead, type ReadingHistoryEntry } from "@/lib/db";
import { getDueReviews, getTotalProgress, getStreak } from "@/lib/db/hifz";
import { useTranslation } from "@/lib/i18n";

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "greetingPeace";
  if (hour < 12) return "greetingMorning";
  if (hour < 17) return "greetingAfternoon";
  if (hour < 21) return "greetingEvening";
  return "greetingPeace";
}

const DAILY_VERSES = [
  {
    key: "2:286",
    arabic: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translation: "Allah does not burden a soul beyond that it can bear.",
  },
  {
    key: "94:5",
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translation: "For indeed, with hardship comes ease.",
  },
  {
    key: "2:152",
    arabic: "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ",
    translation: "So remember Me; I will remember you.",
  },
  {
    key: "3:139",
    arabic: "وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ",
    translation: "Do not weaken and do not grieve, for you are superior.",
  },
  {
    key: "13:28",
    arabic: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    translation: "Verily, in the remembrance of Allah do hearts find rest.",
  },
  {
    key: "65:3",
    arabic: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ",
    translation:
      "And whoever relies upon Allah — then He is sufficient for him.",
  },
  {
    key: "39:53",
    arabic: "لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ",
    translation: "Do not despair of the mercy of Allah.",
  },
];

function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: chapters } = useChapters();
  const [lastRead, setLastRead] = useState<ReadingHistoryEntry | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalProgress, setTotalProgress] = useState({
    total: 6236,
    memorized: 0,
  });

  useEffect(() => {
    getLastRead().then((r) => setLastRead(r ?? null));
    getDueReviews().then((r) => setDueCount(r.length));
    getStreak().then(setStreak);
    getTotalProgress().then(setTotalProgress);
  }, []);

  const lastReadChapter =
    lastRead && chapters
      ? chapters.find((c) => c.id === lastRead.chapterId)
      : null;

  const dailyVerse = getDailyVerse();
  const greetingKey = getGreetingKey();

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="safe-area-top">
        <div className="flex items-center justify-between h-16 px-6">
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {t("noor")}
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-secondary"
              onClick={() => navigate("/search")}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-secondary"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="px-6 pb-4 space-y-4">
        {/* Greeting */}
        <div>
          <p className="text-lg font-semibold text-foreground">
            {t(greetingKey as any)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("mayDayBeBlessed")}
          </p>
        </div>

        {/* Last Read / Continue Reading Card */}
        {lastReadChapter && lastRead ? (
          <Link
            to={`/quran/${lastRead.chapterId}?verse=${lastRead.verseNumber}`}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-5 shadow-elevated">
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full bg-white/5" />
              <div className="absolute top-1/2 right-8 w-8 h-8 rounded-full bg-white/8" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                    <BookOpen className="h-3 w-3 text-white/90" />
                    <span className="text-[11px] font-medium text-white/90">
                      {t("lastRead")}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-0.5">
                  {lastReadChapter.name_simple}
                </h3>
                <p className="text-sm text-white/70">
                  {t("ayah")} {lastRead.verseNumber} /{" "}
                  {lastReadChapter.verses_count}
                </p>

                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/60 transition-all duration-500"
                      style={{
                        width: `${Math.round((lastRead.verseNumber / lastReadChapter.verses_count) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <Link to="/quran">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-5 shadow-elevated">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full bg-white/5" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shrink-0">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base text-white">
                    {t("startReading")}
                  </p>
                  <p className="text-sm text-white/70 mt-0.5">
                    {t("beginQuranJourney")}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/50" />
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          <Link to="/quran">
            <QuickAction
              icon={BookOpen}
              label={t("read")}
              color="text-primary"
              bg="bg-primary/8"
            />
          </Link>
          <Link to="/collections">
            <QuickAction
              icon={Bookmark}
              label={t("saved")}
              color="text-amber-600 dark:text-amber-400"
              bg="bg-amber-500/8"
            />
          </Link>
          <Link to="/hifz">
            <QuickAction
              icon={Brain}
              label={t("hifz")}
              color="text-violet-600 dark:text-violet-400"
              bg="bg-violet-500/8"
            />
          </Link>
          <Link to="/search">
            <QuickAction
              icon={Search}
              label={t("search")}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/8"
            />
          </Link>
        </div>

        {/* Hifz + Prayer Times row */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Hifz Review */}
          <Link to="/hifz">
            <Card className="border-0 shadow-card hover:shadow-soft transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 shrink-0">
                    <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  {streak > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      <Flame className="h-2.5 w-2.5" />
                      {streak}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm text-foreground">
                  {t("memorization")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {dueCount > 0
                    ? `${dueCount} ${dueCount !== 1 ? t("verses") : t("verse")} due`
                    : totalProgress.memorized > 0
                      ? `${totalProgress.memorized} ${t("versesMemorized")}`
                      : t("startTracking")}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Prayer Times */}
          <Link to="/prayer-times">
            <Card className="border-0 shadow-card hover:shadow-soft transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 shrink-0">
                    <Sunrise className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <p className="font-semibold text-sm text-foreground">
                  {t("prayerTimes")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("viewSchedule")}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Verse of the Day */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs font-semibold text-foreground">
              {t("verseOfTheDay")}
            </p>
          </div>
          <Card className="border-0 shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="relative px-5 py-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />
                <div className="relative">
                  <p
                    className="text-xl leading-[2] text-foreground text-center mb-3"
                    dir="rtl"
                    style={{
                      fontFamily: "'Scheherazade New', 'quran_common', serif",
                    }}
                  >
                    {dailyVerse.arabic}
                  </p>
                  <p className="text-sm text-muted-foreground text-center leading-relaxed">
                    {dailyVerse.translation}
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 text-center mt-3 font-medium">
                    {t("surah")} {dailyVerse.key}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2 press-effect">
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl",
          bg,
        )}
      >
        <Icon className={cn("h-4.5 w-4.5", color)} />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
