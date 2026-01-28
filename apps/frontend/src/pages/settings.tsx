import { useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import {
  Moon, Sun, ChevronRight, LogIn, LogOut, Trash2, HardDrive, ArrowLeft, Cloud, RefreshCw
} from 'lucide-react';
import { Button, Switch, Slider, Label } from '@template/ui';
import { useOfflineSettings, useConvexSync } from '@/lib/hooks';
import { useTheme } from 'next-themes';
import { db } from '@/lib/db';
import type { ThemeMode } from '@/types/quran';

export default function SettingsPage() {
  const { settings, updateSettings } = useOfflineSettings();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { status: syncStatus, lastSyncedAt, syncAll, isSignedIn } = useConvexSync();

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Theme */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Theme</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
            ].map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant={theme === id ? 'default' : 'outline'}
                className="flex-col h-auto py-4"
                onClick={() => handleThemeChange(id as ThemeMode)}
              >
                <Icon className="w-5 h-5 mb-2" />
                <span className="text-sm">{label}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Reading */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Reading</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Arabic Font Size</Label>
                <span className="text-sm text-muted-foreground">{settings.arabicFontSize}px</span>
              </div>
              <Slider
                value={[settings.arabicFontSize]}
                onValueChange={(v: number[]) => updateSettings({ arabicFontSize: v[0] })}
                min={20}
                max={44}
                step={2}
              />
              <p className="arabic-text text-center mt-4" style={{ fontSize: settings.arabicFontSize }}>
                بِسْمِ اللَّهِ
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Translation Font Size</Label>
                <span className="text-sm text-muted-foreground">{settings.translationFontSize}px</span>
              </div>
              <Slider
                value={[settings.translationFontSize]}
                onValueChange={(v: number[]) => updateSettings({ translationFontSize: v[0] })}
                min={12}
                max={22}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Show Translation</Label>
              <Switch
                checked={settings.showTranslation}
                onCheckedChange={(checked: boolean) => updateSettings({ showTranslation: checked })}
              />
            </div>
          </div>
        </section>

        {/* Audio */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Audio</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Playback Speed</Label>
                <span className="text-sm text-muted-foreground">{settings.playbackSpeed}x</span>
              </div>
              <Slider
                value={[settings.playbackSpeed]}
                onValueChange={(v: number[]) => updateSettings({ playbackSpeed: v[0] })}
                min={0.5}
                max={2}
                step={0.25}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Auto-play Next Verse</Label>
              <Switch
                checked={settings.autoPlayNext}
                onCheckedChange={(checked: boolean) => updateSettings({ autoPlayNext: checked })}
              />
            </div>
          </div>
        </section>

        {/* Goals */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Daily Goal</h2>
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Ayahs per day</Label>
              <span className="text-sm text-muted-foreground">{settings.dailyAyahGoal}</span>
            </div>
            <Slider
              value={[settings.dailyAyahGoal]}
              onValueChange={(v: number[]) => updateSettings({ dailyAyahGoal: v[0] })}
              min={0}
              max={50}
              step={5}
            />
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Account</h2>
          <div className="space-y-1">
            <SignedOut>
              <Link
                to="/sign-in"
                className="flex items-center justify-between p-4 -mx-4 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Sign In</p>
                    <p className="text-sm text-muted-foreground">Sync across devices</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => signOut()}
                className="flex items-center justify-between p-4 -mx-4 w-[calc(100%+2rem)] rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-muted-foreground">Keep local data</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </SignedIn>
          </div>
        </section>

        {/* Cloud Sync */}
        {isSignedIn && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Cloud Sync</h2>
            <div className="space-y-1">
              <button
                onClick={() => syncAll()}
                disabled={syncStatus === 'syncing'}
                className="flex items-center justify-between p-4 -mx-4 w-[calc(100%+2rem)] rounded-xl hover:bg-secondary transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {syncStatus === 'syncing' ? (
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Cloud className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lastSyncedAt
                        ? `Last synced ${formatSyncTime(lastSyncedAt)}`
                        : 'Sync your data across devices'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </section>
        )}

        {/* Data */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Data</h2>
          <div className="space-y-1">
            <button
              onClick={async () => {
                if (confirm('Clear cached Quran data?')) {
                  await db.cachedSurahData.clear();
                  await db.cachedTranslations.clear();
                }
              }}
              className="flex items-center justify-between p-4 -mx-4 w-[calc(100%+2rem)] rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Clear Cache</p>
                  <p className="text-sm text-muted-foreground">Free up storage space</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={async () => {
                if (confirm('Delete all data? This cannot be undone.')) {
                  await db.delete();
                  window.location.reload();
                }
              }}
              className="flex items-center justify-between p-4 -mx-4 w-[calc(100%+2rem)] rounded-xl hover:bg-destructive/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">Delete All Data</p>
                  <p className="text-sm text-muted-foreground">Remove everything</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Version */}
        <div className="text-center py-4 text-sm text-muted-foreground">
          <p>Noor v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

function formatSyncTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return 'just now';
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
