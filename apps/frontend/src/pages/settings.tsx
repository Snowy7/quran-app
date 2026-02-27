import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Trash2, Download, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  Label,
  Separator,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { useTheme } from 'next-themes';
import { getSetting, setSetting } from '@/lib/db/settings';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAudioStore, RECITERS } from '@/lib/stores/audio-store';
import { notifySettingsChange } from '@/lib/hooks/use-settings';
import { ReciterPicker } from '@/components/audio/reciter-picker';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [arabicFontSize, setArabicFontSize] = useState(28);
  const [translationFontSize, setTranslationFontSize] = useState(16);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const { reciterId } = useAudioStore();
  const currentReciter = RECITERS.find((r) => r.id === reciterId);

  useEffect(() => {
    getSetting<number>('arabicFontSize', 28).then(setArabicFontSize);
    getSetting<number>('translationFontSize', 16).then(setTranslationFontSize);
    getSetting<boolean>('autoPlayNext', true).then(setAutoPlayNext);
  }, []);

  const updateSetting = async (key: string, value: unknown) => {
    await setSetting(key, value);
  };

  const handleClearCache = async () => {
    await db.apiCache.clear();
    toast.success('Cache cleared');
    setClearConfirm(false);
  };

  const handleExport = async () => {
    const data = {
      collections: await db.collections.toArray(),
      bookmarks: await db.bookmarks.toArray(),
      hifzProgress: await db.hifzProgress.toArray(),
      readingHistory: await db.readingHistory.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noor-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  return (
    <div>
      <AppHeader title="Settings" showBack />

      <div className="px-5 pb-8 space-y-6">
        {/* Appearance */}
        <SettingsSection title="Appearance">
          <div>
            <Label className="text-xs text-muted-foreground mb-2.5 block">Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all',
                    theme === value
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/50 hover:border-border',
                  )}
                >
                  <Icon className={cn('h-4 w-4', theme === value ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-xs font-medium', theme === value ? 'text-foreground' : 'text-muted-foreground')}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Reading */}
        <SettingsSection title="Reading">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Arabic Font Size</Label>
              <span className="text-xs font-medium tabular-nums text-foreground">{arabicFontSize}px</span>
            </div>
            <Slider
              value={[arabicFontSize]}
              min={18}
              max={44}
              step={2}
              onValueChange={([v]) => {
                setArabicFontSize(v);
                updateSetting('arabicFontSize', v);
                notifySettingsChange('arabicFontSize', v);
              }}
            />
            <p
              className="mt-3 text-center text-foreground leading-loose"
              dir="rtl"
              style={{
                fontFamily: "'Amiri Quran', 'Amiri', serif",
                fontSize: `${arabicFontSize}px`,
              }}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ
            </p>
          </div>

          <Separator className="opacity-50" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Translation Font Size</Label>
              <span className="text-xs font-medium tabular-nums text-foreground">{translationFontSize}px</span>
            </div>
            <Slider
              value={[translationFontSize]}
              min={12}
              max={24}
              step={1}
              onValueChange={([v]) => {
                setTranslationFontSize(v);
                updateSetting('translationFontSize', v);
                notifySettingsChange('translationFontSize', v);
              }}
            />
            <p
              className="mt-3 text-muted-foreground leading-relaxed"
              style={{ fontSize: `${translationFontSize}px` }}
            >
              In the name of Allah, the Most Gracious
            </p>
          </div>
        </SettingsSection>

        {/* Audio */}
        <SettingsSection title="Audio">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Reciter</Label>
            <button
              onClick={() => setReciterPickerOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/50 hover:border-border transition-colors"
            >
              <span className="text-sm font-medium text-foreground truncate">
                {currentReciter?.name ?? 'Select reciter'}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">Change</span>
            </button>
          </div>

          <Separator className="opacity-50" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-play Next</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Continue to next verse after playback
              </p>
            </div>
            <Switch
              checked={autoPlayNext}
              onCheckedChange={(checked) => {
                setAutoPlayNext(checked);
                updateSetting('autoPlayNext', checked);
              }}
            />
          </div>
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => setClearConfirm(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Cache
          </Button>
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <div className="flex items-center gap-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Noor</p>
              <p className="text-xs text-muted-foreground">Version 2.0.0</p>
            </div>
          </div>
        </SettingsSection>
      </div>

      <ReciterPicker open={reciterPickerOpen} onOpenChange={setReciterPickerOpen} />

      {/* Clear Cache Confirmation */}
      <Dialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle className="text-base">Clear Cache?</DialogTitle>
            <DialogDescription className="text-xs">
              This removes cached API data. Your bookmarks and progress are not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={handleClearCache}>
              Clear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </p>
      <Card>
        <CardContent className="p-4 space-y-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
