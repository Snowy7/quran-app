import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  Monitor,
  Trash2,
  Download,
  Info,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  Label,
  Separator,
  Switch,
  Slider,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import { useTheme } from "next-themes";
import { getSetting, setSetting } from "@/lib/db/settings";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAudioStore, RECITERS } from "@/lib/stores/audio-store";
import {
  notifySettingsChange,
  notifyContentWidthChange,
  type ContentWidthOption,
} from "@/lib/hooks/use-settings";
import { ReciterPicker } from "@/components/audio/reciter-picker";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [arabicFontSize, setArabicFontSize] = useState(28);
  const [translationFontSize, setTranslationFontSize] = useState(16);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [contentWidth, setContentWidth] = useState<ContentWidthOption>("100");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const { reciterId } = useAudioStore();
  const currentReciter = RECITERS.find((r) => r.id === reciterId);

  useEffect(() => {
    getSetting<number>("arabicFontSize", 28).then(setArabicFontSize);
    getSetting<number>("translationFontSize", 16).then(setTranslationFontSize);
    getSetting<boolean>("autoPlayNext", true).then(setAutoPlayNext);
    getSetting<string>("contentWidth", "100").then((v) => {
      const valid: ContentWidthOption[] = ["100", "90", "80", "70"];
      setContentWidth(
        valid.includes(v as ContentWidthOption)
          ? (v as ContentWidthOption)
          : "100",
      );
    });
  }, []);

  const updateSetting = async (
    key: string,
    value: string | number | boolean,
  ) => {
    await setSetting(key, value);
  };

  const handleClearCache = async () => {
    await db.apiCache.clear();
    toast.success(t("cacheCleared"));
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
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noor-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("dataExported"));
  };

  return (
    <div className="animate-fade-in">
      <AppHeader title={t("settings")} showBack />

      <div className="px-6 pb-8 space-y-7">
        {/* Appearance */}
        <SettingsSection title={t("appearance")}>
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">
              {t("theme")}
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", icon: Sun, label: t("light") },
                { value: "dark", icon: Moon, label: t("dark") },
                { value: "system", icon: Monitor, label: t("system") },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200",
                    theme === value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-secondary/50 hover:bg-secondary/80",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      theme === value
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      theme === value
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Language */}
        <SettingsSection title={t("language")}>
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "en" as const, label: t("english") },
                { value: "ar" as const, label: t("arabic") },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200",
                    language === value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-secondary/50 hover:bg-secondary/80",
                  )}
                >
                  <Globe
                    className={cn(
                      "h-5 w-5",
                      language === value
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      language === value
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Layout */}
        <SettingsSection title={t("layout")}>
          <div>
            <Label className="text-xs text-muted-foreground mb-3 block">
              {t("contentWidth")}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { value: "100", label: t("full") },
                  { value: "90", label: "90%" },
                  { value: "80", label: "80%" },
                  { value: "70", label: "70%" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setContentWidth(value);
                    updateSetting("contentWidth", value);
                    notifyContentWidthChange(value);
                  }}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                    contentWidth === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary/80",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {t("contentWidthDesc")}
            </p>
          </div>
        </SettingsSection>

        {/* Reading */}
        <SettingsSection title={t("reading")}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-foreground">
                {t("arabicFontSize")}
              </Label>
              <span className="text-xs font-bold tabular-nums text-primary bg-primary/8 px-2 py-0.5 rounded-lg">
                {arabicFontSize}px
              </span>
            </div>
            <Slider
              value={[arabicFontSize]}
              min={18}
              max={44}
              step={2}
              onValueChange={([v]) => {
                setArabicFontSize(v);
                updateSetting("arabicFontSize", v);
                notifySettingsChange("arabicFontSize", v);
              }}
            />
            <p
              className="mt-4 text-center text-foreground leading-loose"
              dir="rtl"
              style={{
                fontFamily: "'Scheherazade New', 'quran_common', serif",
                fontSize: `${arabicFontSize}px`,
              }}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ
            </p>
          </div>

          <Separator className="opacity-30" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-foreground">
                {t("translationFontSize")}
              </Label>
              <span className="text-xs font-bold tabular-nums text-primary bg-primary/8 px-2 py-0.5 rounded-lg">
                {translationFontSize}px
              </span>
            </div>
            <Slider
              value={[translationFontSize]}
              min={12}
              max={24}
              step={1}
              onValueChange={([v]) => {
                setTranslationFontSize(v);
                updateSetting("translationFontSize", v);
                notifySettingsChange("translationFontSize", v);
              }}
            />
            <p
              className="mt-4 text-muted-foreground leading-relaxed"
              style={{ fontSize: `${translationFontSize}px` }}
            >
              {t("translationPreview")}
            </p>
          </div>
        </SettingsSection>

        {/* Audio */}
        <SettingsSection title={t("audio")}>
          <div>
            <Label className="text-sm font-medium text-foreground mb-2.5 block">
              {t("reciter")}
            </Label>
            <button
              onClick={() => setReciterPickerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
            >
              <span className="text-sm font-medium text-foreground truncate">
                {currentReciter?.name ?? t("selectReciter")}
              </span>
              <span className="text-xs font-semibold text-primary shrink-0 ml-2">
                {t("change")}
              </span>
            </button>
          </div>

          <Separator className="opacity-30" />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t("autoPlayNext")}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t("autoPlayNextDesc")}
              </p>
            </div>
            <Switch
              checked={autoPlayNext}
              onCheckedChange={(checked) => {
                setAutoPlayNext(checked);
                updateSetting("autoPlayNext", checked);
              }}
            />
          </div>
        </SettingsSection>

        {/* Data */}
        <SettingsSection title={t("data")}>
          <Button
            variant="outline"
            size="default"
            className="w-full justify-start gap-3 rounded-2xl h-12"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            {t("exportData")}
          </Button>

          <Button
            variant="outline"
            size="default"
            className="w-full justify-start gap-3 rounded-2xl h-12 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5"
            onClick={() => setClearConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t("clearCache")}
          </Button>
        </SettingsSection>

        {/* About */}
        <SettingsSection title={t("about")}>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 shrink-0">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{t("noor")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("version")} 2.0.0
              </p>
            </div>
          </div>
        </SettingsSection>
      </div>

      <ReciterPicker
        open={reciterPickerOpen}
        onOpenChange={setReciterPickerOpen}
      />

      <Dialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <DialogContent className="sm:max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {t("clearCacheConfirm")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("clearCacheDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setClearConfirm(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleClearCache}
            >
              {t("clear")}
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
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
        {title}
      </p>
      <Card className="border-0 shadow-card rounded-2xl">
        <CardContent className="p-5 space-y-5">{children}</CardContent>
      </Card>
    </div>
  );
}
