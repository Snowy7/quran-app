import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BookOpen, AlertCircle, ChevronRight, ChevronLeft, Check, MoreVertical } from 'lucide-react';
import { Button, Progress, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@template/ui';
import { toast } from 'sonner';
import { useOfflineMemorization } from '@/lib/hooks';
import { SURAHS } from '@/data/surahs';
import type { MemorizationStatus } from '@/types/quran';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { AppHeader } from '@/components/layout/app-header';

type FilterTab = 'all' | MemorizationStatus;

export default function MemorizePage() {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { memorizations, stats, markAyahMemorized, updateMemorizationStatus } = useOfflineMemorization();
  const [bulkMarkDialog, setBulkMarkDialog] = useState<{ isOpen: boolean; surah: typeof SURAHS[0] | null }>({
    isOpen: false,
    surah: null,
  });

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: t('all') },
    { id: 'memorized', label: t('done') },
    { id: 'learning', label: t('learning') },
    { id: 'needs_revision', label: t('review') },
  ];

  const getMemorizationForSurah = (surahId: number) => {
    return memorizations.find((m) => m.surahId === surahId);
  };

  // Mark entire surah as memorized
  const markSurahAsMemorized = useCallback(async (surah: typeof SURAHS[0]) => {
    try {
      for (let i = 1; i <= surah.numberOfAyahs; i++) {
        await markAyahMemorized(surah.id, i);
      }
      setBulkMarkDialog({ isOpen: false, surah: null });
      toast.success(isRTL ? `تم تعليم ${surah.name} كمحفوظة` : `${surah.englishName} marked as memorized`);
    } catch (error) {
      toast.error(isRTL ? 'فشل في تعليم السورة كمحفوظة' : 'Failed to mark surah as memorized');
    }
  }, [markAyahMemorized, isRTL]);

  // Reset surah memorization
  const resetSurahMemorization = useCallback(async (surahId: number) => {
    try {
      await updateMemorizationStatus(surahId, 'not_started');
      toast.success(isRTL ? 'تمت إعادة تعيين التقدم' : 'Progress reset');
    } catch (error) {
      toast.error(isRTL ? 'فشل في إعادة تعيين التقدم' : 'Failed to reset progress');
    }
  }, [updateMemorizationStatus, isRTL]);

  const filteredSurahs = SURAHS.filter((surah) => {
    if (activeTab === 'all') return true;
    const mem = getMemorizationForSurah(surah.id);
    if (activeTab === 'not_started') return !mem || mem.status === 'not_started';
    return mem?.status === activeTab;
  });

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="page-container" dir={isRTL ? 'rtl' : 'ltr'}>
      <AppHeader title={t('memorization')} />

      {/* Progress Overview */}
      <div className="px-4 py-6 border-b border-border">
        <div className="flex items-center gap-6">
          {/* Progress Ring */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(stats.memorized / 114) * 226.2} 226.2`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-semibold">{stats.memorized}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <p className={cn('text-sm text-muted-foreground mb-3', isRTL && 'font-arabic-ui')}>
              {stats.memorized} {t('ofSurahs')}
            </p>
            <div className="flex gap-4">
              <div>
                <p className="text-lg font-semibold text-primary">{stats.memorized}</p>
                <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic-ui')}>{t('done')}</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{stats.learning}</p>
                <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic-ui')}>{t('learning')}</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{stats.needsRevision}</p>
                <p className={cn('text-xs text-muted-foreground', isRTL && 'font-arabic-ui')}>{t('review')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            className={cn('shrink-0', isRTL && 'font-arabic-ui')}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Surah List */}
      <div className="divide-y divide-border">
        {filteredSurahs.map((surah) => {
          const memorization = getMemorizationForSurah(surah.id);
          const status = memorization?.status || 'not_started';
          const memorizedCount = memorization?.memorizedAyahs.length || 0;
          const percentage = (memorizedCount / surah.numberOfAyahs) * 100;

          const statusConfig = {
            not_started: { icon: BookOpen, color: 'text-muted-foreground' },
            learning: { icon: BookOpen, color: 'text-amber-500' },
            memorized: { icon: CheckCircle, color: 'text-primary' },
            needs_revision: { icon: AlertCircle, color: 'text-orange-500' },
          };

          const config = statusConfig[status];
          const Icon = config.icon;

          return (
            <div key={surah.id} className="flex items-center hover:bg-secondary/50 transition-colors">
              <Link
                to={`/quran/${surah.id}`}
                className="flex items-center gap-4 px-4 py-3 flex-1 min-w-0"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Icon className={cn('w-5 h-5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn('font-medium truncate', isRTL && 'font-arabic-ui')}>
                      {isRTL ? surah.name : surah.englishName}
                    </p>
                    <span className="text-xs text-muted-foreground ms-2">
                      {memorizedCount}/{surah.numberOfAyahs}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
                <ChevronIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
              {/* Quick actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 me-2 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  {status !== 'memorized' && (
                    <DropdownMenuItem onClick={() => setBulkMarkDialog({ isOpen: true, surah })} className={cn(isRTL && 'font-arabic-ui')}>
                      <Check className="w-4 h-4 me-2" />
                      {t('markAsMemorized')}
                    </DropdownMenuItem>
                  )}
                  {status !== 'not_started' && (
                    <DropdownMenuItem
                      onClick={() => resetSurahMemorization(surah.id)}
                      className={cn('text-destructive', isRTL && 'font-arabic-ui')}
                    >
                      {t('resetProgress')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {filteredSurahs.length === 0 && (
        <div className="text-center py-16">
          <p className={cn('text-muted-foreground', isRTL && 'font-arabic-ui')}>{t('noSurahsInCategory')}</p>
        </div>
      )}

      {/* Bulk mark as memorized dialog */}
      <Dialog open={bulkMarkDialog.isOpen} onOpenChange={(open) => !open && setBulkMarkDialog({ isOpen: false, surah: null })}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={cn(isRTL && 'font-arabic-ui')}>{t('markAsMemorizedTitle')}</DialogTitle>
            <DialogDescription className={cn(isRTL && 'font-arabic-ui')}>
              {t('markAsMemorizedDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkMarkDialog({ isOpen: false, surah: null })} className={cn(isRTL && 'font-arabic-ui')}>
              {t('cancel')}
            </Button>
            <Button onClick={() => bulkMarkDialog.surah && markSurahAsMemorized(bulkMarkDialog.surah)} className={cn(isRTL && 'font-arabic-ui')}>
              {t('markAsMemorized')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
