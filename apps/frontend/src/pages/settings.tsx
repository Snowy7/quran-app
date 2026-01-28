import { useState } from 'react';
import { useAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import {
  Moon, Sun, Palette, Type, Languages, Volume2, Bell,
  Target, Cloud, LogIn, LogOut, Trash2, ChevronRight, HardDrive
} from 'lucide-react';
import { Button, Card, CardContent, Switch, Slider, Label } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';
import { useOfflineSettings } from '@/lib/hooks';
import { useTheme } from 'next-themes';
import { AVAILABLE_TRANSLATIONS } from '@/lib/api/quran-api';
import { db } from '@/lib/db';
import type { ThemeMode, ArabicFontFamily } from '@/types/quran';

export default function SettingsPage() {
  const { settings, updateSettings } = useOfflineSettings();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleFontSizeChange = (value: number[]) => {
    updateSettings({ arabicFontSize: value[0] });
  };

  const handleTranslationFontSizeChange = (value: number[]) => {
    updateSettings({ translationFontSize: value[0] });
  };

  return (
    <div className="page-container">
      <AppHeader title="Settings" showSearch={false} />

      <main className="px-4 py-4 space-y-6">
        {/* Theme Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Appearance
          </h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Theme Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Theme</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'sepia', icon: Palette, label: 'Sepia' },
                    { id: 'system', icon: Palette, label: 'Auto' },
                  ].map(({ id, icon: Icon, label }) => (
                    <Button
                      key={id}
                      variant={theme === id ? 'default' : 'outline'}
                      size="sm"
                      className="flex-col h-auto py-3"
                      onClick={() => handleThemeChange(id as ThemeMode)}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Arabic Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Arabic Font Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.arabicFontSize}px</span>
                </div>
                <Slider
                  value={[settings.arabicFontSize]}
                  onValueChange={handleFontSizeChange}
                  min={18}
                  max={48}
                  step={2}
                />
                <p className="arabic-text text-center mt-3" style={{ fontSize: settings.arabicFontSize }}>
                  بِسْمِ اللَّهِ
                </p>
              </div>

              {/* Translation Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Translation Font Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.translationFontSize}px</span>
                </div>
                <Slider
                  value={[settings.translationFontSize]}
                  onValueChange={handleTranslationFontSizeChange}
                  min={12}
                  max={24}
                  step={1}
                />
              </div>

              {/* Show Translation */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Show Translation</Label>
                <Switch
                  checked={settings.showTranslation}
                  onCheckedChange={(checked) => updateSettings({ showTranslation: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Audio Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Audio
          </h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Playback Speed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Playback Speed</Label>
                  <span className="text-sm text-muted-foreground">{settings.playbackSpeed}x</span>
                </div>
                <Slider
                  value={[settings.playbackSpeed]}
                  onValueChange={(v) => updateSettings({ playbackSpeed: v[0] })}
                  min={0.5}
                  max={2}
                  step={0.25}
                />
              </div>

              {/* Auto-play */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Auto-play Next Verse</Label>
                <Switch
                  checked={settings.autoPlayNext}
                  onCheckedChange={(checked) => updateSettings({ autoPlayNext: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Goals Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Goals
          </h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Daily Ayah Goal</Label>
                  <span className="text-sm text-muted-foreground">{settings.dailyAyahGoal} ayahs</span>
                </div>
                <Slider
                  value={[settings.dailyAyahGoal]}
                  onValueChange={(v) => updateSettings({ dailyAyahGoal: v[0] })}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Account Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </h2>
          <Card>
            <CardContent className="p-0">
              <SignedOut>
                <Link to="/sign-in" className="flex items-center justify-between p-4 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <LogIn className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Sign In</p>
                      <p className="text-sm text-muted-foreground">Sync your data across devices</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Cloud className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cloud Sync Enabled</p>
                      <p className="text-sm text-muted-foreground">Your data syncs automatically</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center justify-between p-4 w-full hover:bg-muted/50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-sm text-muted-foreground">Your local data will be preserved</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </SignedIn>
            </CardContent>
          </Card>
        </section>

        {/* Data Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Data & Storage
          </h2>
          <Card>
            <CardContent className="p-0">
              <button
                onClick={async () => {
                  if (confirm('Clear all cached Quran data? Your bookmarks and progress will be preserved.')) {
                    await db.cachedSurahData.clear();
                    await db.cachedTranslations.clear();
                    alert('Cache cleared successfully');
                  }
                }}
                className="flex items-center justify-between p-4 w-full hover:bg-muted/50 text-left border-b"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Clear Cache</p>
                    <p className="text-sm text-muted-foreground">Remove cached Quran data</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                onClick={async () => {
                  if (confirm('WARNING: This will delete ALL your data including bookmarks, progress, and settings. This cannot be undone.')) {
                    await db.delete();
                    window.location.reload();
                  }
                }}
                className="flex items-center justify-between p-4 w-full hover:bg-destructive/10 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Delete All Data</p>
                    <p className="text-sm text-muted-foreground">Remove all local data</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </section>

        {/* App Info */}
        <div className="text-center py-4 text-sm text-muted-foreground">
          <p>Noor - Quran App</p>
          <p>Version 1.0.0</p>
        </div>
      </main>
    </div>
  );
}
