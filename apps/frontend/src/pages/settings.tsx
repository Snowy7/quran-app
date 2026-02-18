import { useAuth, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {
  Moon,
  Sun,
  ChevronRight,
  LogIn,
  LogOut,
  Trash2,
  HardDrive,
  Cloud,
  RefreshCw,
  Bell,
  BellOff,
  Send,
} from "lucide-react";
import { Button, Switch, Slider, Label } from "@template/ui";
import {
  useOfflineSettings,
  useConvexSync,
  usePrayerTimes,
  usePrayerNotifications,
  usePushSubscription,
} from "@/lib/hooks";
import { useTheme } from "next-themes";
import { db } from "@/lib/db";
import { InstallAppButton } from "@/components/pwa";
import type { ThemeMode } from "@/types/quran";
import { AppHeader } from "@/components/layout/app-header";

export default function SettingsPage() {
  const { settings, updateSettings } = useOfflineSettings();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const {
    status: syncStatus,
    lastSyncedAt,
    syncAll,
    isSignedIn,
  } = useConvexSync();
  const { times: prayerTimes } = usePrayerTimes();
  const {
    isSupported: notificationsSupported,
    isPermitted: notificationsPermitted,
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
    requestPermission: requestNotificationPermission,
    testNotification,
  } = usePrayerNotifications(prayerTimes);

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    sendTestPush,
  } = usePushSubscription();

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleEnableNotifications = async () => {
    if (!notificationsPermitted) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await updateNotificationSettings({ enabled: true });
        // Auto-subscribe to server push if signed in
        if (pushSupported && isSignedIn) {
          await subscribePush();
        }
      }
    } else {
      const newEnabled = !notificationSettings.enabled;
      await updateNotificationSettings({ enabled: newEnabled });
      // Subscribe/unsubscribe server push
      if (pushSupported && isSignedIn) {
        if (newEnabled) {
          await subscribePush();
        } else {
          await unsubscribePush();
        }
      }
    }
  };

  return (
    <div className="page-container">
      <AppHeader title="Settings" showSearch={false} />

      <div className="px-4 py-6 space-y-8">
        {/* Theme */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Theme
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "light", icon: Sun, label: "Light" },
              { id: "dark", icon: Moon, label: "Dark" },
            ].map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant={theme === id ? "default" : "outline"}
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
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Reading
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Arabic Font Size</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.arabicFontSize}px
                </span>
              </div>
              <Slider
                value={[settings.arabicFontSize]}
                onValueChange={(v: number[]) =>
                  updateSettings({ arabicFontSize: v[0] })
                }
                min={20}
                max={44}
                step={2}
              />
              <p
                className="arabic-text text-center mt-4"
                style={{ fontSize: settings.arabicFontSize }}
              >
                بِسْمِ اللَّهِ
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Translation Font Size</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.translationFontSize}px
                </span>
              </div>
              <Slider
                value={[settings.translationFontSize]}
                onValueChange={(v: number[]) =>
                  updateSettings({ translationFontSize: v[0] })
                }
                min={12}
                max={22}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Show Translation</Label>
              <Switch
                checked={settings.showTranslation}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ showTranslation: checked })
                }
              />
            </div>
          </div>
        </section>

        {/* Audio */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Audio
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Playback Speed</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.playbackSpeed}x
                </span>
              </div>
              <Slider
                value={[settings.playbackSpeed]}
                onValueChange={(v: number[]) =>
                  updateSettings({ playbackSpeed: v[0] })
                }
                min={0.5}
                max={2}
                step={0.25}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Auto-play Next Verse</Label>
              <Switch
                checked={settings.autoPlayNext}
                onCheckedChange={(checked: boolean) =>
                  updateSettings({ autoPlayNext: checked })
                }
              />
            </div>
          </div>
        </section>

        {/* Goals */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Daily Goal
          </h2>
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Ayahs per day</Label>
              <span className="text-sm text-muted-foreground">
                {settings.dailyAyahGoal}
              </span>
            </div>
            <Slider
              value={[settings.dailyAyahGoal]}
              onValueChange={(v: number[]) =>
                updateSettings({ dailyAyahGoal: v[0] })
              }
              min={0}
              max={50}
              step={5}
            />
          </div>
        </section>

        {/* Notifications */}
        {notificationsSupported && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Notifications
            </h2>
            <div className="space-y-4">
              {/* Enable notifications */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {notificationSettings.enabled && notificationsPermitted ? (
                      <Bell className="w-5 h-5 text-primary" />
                    ) : (
                      <BellOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label>Enable Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      {!notificationsPermitted
                        ? "Permission required"
                        : notificationSettings.enabled
                          ? "Notifications are active"
                          : "Notifications are off"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={
                    notificationSettings.enabled && notificationsPermitted
                  }
                  onCheckedChange={handleEnableNotifications}
                />
              </div>

              {notificationSettings.enabled && notificationsPermitted && (
                <>
                  {/* Before prayer time */}
                  <div className="flex items-center justify-between py-2 pl-4 border-l-2 border-border">
                    <div>
                      <Label>
                        Before prayer (
                        {notificationSettings.beforeMinutes || 15} min)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified before prayer begins
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.beforePrayerTime}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({
                          beforePrayerTime: checked,
                        })
                      }
                    />
                  </div>

                  {/* At prayer time */}
                  <div className="flex items-center justify-between py-2 pl-4 border-l-2 border-border">
                    <div>
                      <Label>At prayer time</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when prayer time begins
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.atPrayerTime}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ atPrayerTime: checked })
                      }
                    />
                  </div>

                  {/* Reminder after */}
                  <div className="flex items-center justify-between py-2 pl-4 border-l-2 border-border">
                    <div>
                      <Label>
                        Reminder after {notificationSettings.reminderMinutes}{" "}
                        min
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Remind if you haven't prayed
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.reminderAfter}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ reminderAfter: checked })
                      }
                    />
                  </div>

                  {/* Daily reading reminder */}
                  <div className="flex items-center justify-between py-2 pl-4 border-l-2 border-primary/30">
                    <div>
                      <Label>Daily reading reminder</Label>
                      <p className="text-xs text-muted-foreground">
                        Remind to read Quran at{" "}
                        {notificationSettings.dailyReadingReminderTime ||
                          "20:00"}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailyReadingReminder}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({
                          dailyReadingReminder: checked,
                        })
                      }
                    />
                  </div>

                  {/* Push notification status (signed-in users) */}
                  {isSignedIn && pushSupported && (
                    <div className="flex items-center justify-between py-2 pl-4 border-l-2 border-primary/30">
                      <div>
                        <Label>Server Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          {pushSubscribed
                            ? "Active — works even when app is closed"
                            : "Enable for reliable background notifications"}
                        </p>
                      </div>
                      <Switch
                        checked={pushSubscribed}
                        disabled={pushLoading}
                        onCheckedChange={async (checked) => {
                          if (checked) {
                            await subscribePush();
                          } else {
                            await unsubscribePush();
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Test notification buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testNotification}
                      className="flex-1"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Test Local
                    </Button>
                    {isSignedIn && pushSubscribed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={sendTestPush}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Test Server Push
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Account */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Account
          </h2>
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
                    <p className="text-sm text-muted-foreground">
                      Sync across devices
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Keep local data
                    </p>
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
            <h2 className="text-sm font-medium text-muted-foreground mb-4">
              Cloud Sync
            </h2>
            <div className="space-y-1">
              <button
                onClick={() => syncAll()}
                disabled={syncStatus === "syncing"}
                className="flex items-center justify-between p-4 -mx-4 w-[calc(100%+2rem)] rounded-xl hover:bg-secondary transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {syncStatus === "syncing" ? (
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Cloud className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lastSyncedAt
                        ? `Last synced ${formatSyncTime(lastSyncedAt)}`
                        : "Sync your data across devices"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </section>
        )}

        {/* Install App */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            App
          </h2>
          <InstallAppButton />
        </section>

        {/* Data */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Data
          </h2>
          <div className="space-y-1">
            <button
              onClick={async () => {
                if (confirm("Clear cached Quran data?")) {
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
                  <p className="text-sm text-muted-foreground">
                    Free up storage space
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={async () => {
                if (confirm("Delete all data? This cannot be undone.")) {
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
                  <p className="font-medium text-destructive">
                    Delete All Data
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Remove everything
                  </p>
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
    return "just now";
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}
