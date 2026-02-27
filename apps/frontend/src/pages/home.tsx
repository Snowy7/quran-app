import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  ChevronRight,
  Search,
  Bookmark,
  Flame,
  Settings,
} from 'lucide-react';
import { Button, Card, CardContent, Progress } from '@template/ui';
import { cn } from '@/lib/utils';
import { useChapters } from '@/lib/api/chapters';
import { getLastRead, type ReadingHistoryEntry } from '@/lib/db';
import { getDueReviews, getTotalProgress, getStreak } from '@/lib/db/hifz';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Peace be upon you';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Peace be upon you';
}

// A curated set of short, impactful verses
const DAILY_VERSES = [
  { key: '2:286', arabic: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.' },
  { key: '94:5', arabic: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship comes ease.' },
  { key: '2:152', arabic: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', translation: 'So remember Me; I will remember you.' },
  { key: '3:139', arabic: 'وَلَا تَهِنُوا۟ وَلَا تَحْزَنُوا۟ وَأَنتُمُ ٱلْأَعْلَوْنَ', translation: 'Do not weaken and do not grieve, for you are superior.' },
  { key: '13:28', arabic: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest.' },
  { key: '65:3', arabic: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ', translation: 'And whoever relies upon Allah — then He is sufficient for him.' },
  { key: '39:53', arabic: 'لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ', translation: 'Do not despair of the mercy of Allah.' },
];

function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { data: chapters } = useChapters();
  const [lastRead, setLastRead] = useState<ReadingHistoryEntry | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalProgress, setTotalProgress] = useState({ total: 6236, memorized: 0 });

  useEffect(() => {
    getLastRead().then((r) => setLastRead(r ?? null));
    getDueReviews().then((r) => setDueCount(r.length));
    getStreak().then(setStreak);
    getTotalProgress().then(setTotalProgress);
  }, []);

  const lastReadChapter = lastRead && chapters
    ? chapters.find((c) => c.id === lastRead.chapterId)
    : null;

  const dailyVerse = getDailyVerse();
  const greeting = getGreeting();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm safe-area-top">
        <div className="flex items-center justify-between h-14 px-5">
          <h1
            className="text-xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Noor
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="px-5 pb-8 space-y-5">
        {/* Greeting */}
        <div className="pt-2">
          <p className="text-sm text-muted-foreground">{greeting}</p>
        </div>

        {/* Continue Reading */}
        {lastReadChapter && lastRead ? (
          <Link to={`/quran/${lastRead.chapterId}?verse=${lastRead.verseNumber}`}>
            <Card className="overflow-hidden border-primary/15 hover:border-primary/30 transition-colors">
              <CardContent className="p-0">
                <div className="relative px-5 py-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-primary/3" />
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Continue reading</p>
                      <p className="font-semibold text-sm text-foreground truncate">
                        {lastReadChapter.name_simple}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Verse {lastRead.verseNumber} of {lastReadChapter.verses_count}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <div className="relative mt-3">
                    <Progress
                      value={Math.round((lastRead.verseNumber / lastReadChapter.verses_count) * 100)}
                      className="h-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link to="/quran">
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Start Reading</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Begin your Quran journey
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/quran">
            <QuickAction
              icon={BookOpen}
              label="Browse"
              color="text-primary"
              bg="bg-primary/8"
            />
          </Link>
          <Link to="/collections">
            <QuickAction
              icon={Bookmark}
              label="Saved"
              color="text-amber-600 dark:text-amber-400"
              bg="bg-amber-500/8"
            />
          </Link>
          <Link to="/search">
            <QuickAction
              icon={Search}
              label="Search"
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/8"
            />
          </Link>
        </div>

        {/* Hifz Review Card */}
        <Link to="/hifz">
          <Card className="hover:border-emerald-500/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 shrink-0">
                  <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">Memorization</p>
                    {streak > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                        <Flame className="h-2.5 w-2.5" />
                        {streak}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dueCount > 0
                      ? `${dueCount} verse${dueCount !== 1 ? 's' : ''} due for review`
                      : totalProgress.memorized > 0
                        ? `${totalProgress.memorized} verses memorized`
                        : 'Start tracking your hifz'
                    }
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Verse of the Day */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative px-5 py-5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-accent/4" />
              <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Verse of the Day
                </p>
                <p
                  className="text-[1.35rem] leading-[2.2] text-foreground text-center mb-3"
                  dir="rtl"
                  style={{ fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', serif" }}
                >
                  {dailyVerse.arabic}
                </p>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {dailyVerse.translation}
                </p>
                <p className="text-[10px] text-muted-foreground/60 text-center mt-2 font-medium">
                  {dailyVerse.key}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3 flex flex-col items-center gap-2">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', bg)}>
          <Icon className={cn('h-4.5 w-4.5', color)} />
        </div>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
