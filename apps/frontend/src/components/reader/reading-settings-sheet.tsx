import { useRef, useEffect, useState, useCallback } from "react";
import {
  X,
  Type,
  Languages,
  Volume2,
  SkipForward,
  Eye,
  ALargeSmall,
} from "lucide-react";
import {
  Button,
  Slider,
  Switch,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@template/ui";
import { useOfflineSettings } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { ArabicFontFamily } from "@/types/quran";

interface ReadingSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const fontFamilies: { id: ArabicFontFamily; name: string; sample: string }[] = [
  { id: "uthmani", name: "Uthmani", sample: "Amiri Quran" },
  { id: "scheherazade", name: "Scheherazade", sample: "Scheherazade New" },
  { id: "amiri", name: "Amiri", sample: "Amiri" },
];

export function ReadingSettingsSheet({
  isOpen,
  onClose,
}: ReadingSettingsSheetProps) {
  const { settings, updateSettings } = useOfflineSettings();
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const content = contentRef.current;
    const target = e.target as HTMLElement;
    const isHandle = target.closest("[data-sheet-handle]");
    const isAtTop = content ? content.scrollTop <= 0 : true;

    if (isHandle || isAtTop) {
      dragStartRef.current = { y: touch.clientY, time: Date.now() };
    }
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartRef.current.y;
    if (deltaY > 0) {
      setIsDragging(true);
      setDragOffset(deltaY);
      e.preventDefault();
    }
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!dragStartRef.current || !isDragging) {
      dragStartRef.current = null;
      return;
    }
    const velocity =
      (dragOffset / (Date.now() - dragStartRef.current.time)) * 1000;
    if (dragOffset > 150 || velocity > 500) {
      onClose();
    }
    setDragOffset(0);
    setIsDragging(false);
    dragStartRef.current = null;
  }, [dragOffset, isDragging, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
      dragStartRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: Math.max(0, 1 - dragOffset / 400) }}
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-1/2 z-50",
          "w-full max-w-lg",
          "bg-background rounded-t-2xl shadow-2xl shadow-black/20",
          "max-h-[80vh] flex flex-col",
          !isDragging && "transition-all duration-300 ease-out",
          "animate-in slide-in-from-bottom duration-300",
        )}
        style={{
          transform: `translateX(-50%) translateY(${dragOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div
          data-sheet-handle
          className="flex-shrink-0 pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
        >
          <div className="w-10 h-1 bg-border/80 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3">
          <h2 className="text-sm font-semibold text-foreground/90">
            Reading Settings
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="mx-5 h-px bg-border/50" />

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6"
        >
          {/* ── Arabic Font Size ── */}
          <SettingSection
            icon={<ALargeSmall className="w-4 h-4" />}
            label="Arabic Font Size"
            value={`${settings.arabicFontSize}px`}
          >
            <Slider
              value={[settings.arabicFontSize]}
              onValueChange={(v: number[]) =>
                updateSettings({ arabicFontSize: v[0] })
              }
              min={20}
              max={44}
              step={2}
            />
            {/* Live preview */}
            <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
              <p
                className={cn(
                  "arabic-text text-center",
                  settings.arabicFontFamily === "scheherazade" &&
                    "arabic-scheherazade",
                  settings.arabicFontFamily === "uthmani" && "arabic-uthmani",
                  settings.arabicFontFamily === "amiri" && "arabic-amiri",
                )}
                style={{ fontSize: settings.arabicFontSize }}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          </SettingSection>

          {/* ── Arabic Font Family ── */}
          <SettingSection
            icon={<Type className="w-4 h-4" />}
            label="Arabic Font"
          >
            <div className="grid grid-cols-3 gap-2">
              {fontFamilies.map(({ id, name }) => (
                <button
                  key={id}
                  onClick={() => updateSettings({ arabicFontFamily: id })}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-center transition-all duration-200",
                    "border",
                    settings.arabicFontFamily === id
                      ? "bg-[hsl(var(--mushaf-active))]/10 border-[hsl(var(--mushaf-active))]/30 text-[hsl(var(--mushaf-active))]"
                      : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  <span
                    className={cn(
                      "arabic-text block text-base leading-tight mb-0.5",
                      id === "scheherazade" && "arabic-scheherazade",
                      id === "uthmani" && "arabic-uthmani",
                      id === "amiri" && "arabic-amiri",
                    )}
                  >
                    بسم
                  </span>
                  <span className="text-[10px] font-medium">{name}</span>
                </button>
              ))}
            </div>
          </SettingSection>

          {/* ── Translation Font Size ── */}
          <SettingSection
            icon={<Languages className="w-4 h-4" />}
            label="Translation Size"
            value={`${settings.translationFontSize}px`}
          >
            <Slider
              value={[settings.translationFontSize]}
              onValueChange={(v: number[]) =>
                updateSettings({ translationFontSize: v[0] })
              }
              min={12}
              max={22}
              step={1}
            />
            <p
              className="text-muted-foreground text-center mt-3 leading-relaxed"
              style={{ fontSize: settings.translationFontSize }}
            >
              In the name of Allah, the Most Gracious, the Most Merciful.
            </p>
          </SettingSection>

          {/* ── Toggle: Show Translation ── */}
          <SettingToggle
            icon={<Eye className="w-4 h-4" />}
            label="Show Translation"
            description="Display English translation below each verse"
            checked={settings.showTranslation}
            onCheckedChange={(checked) =>
              updateSettings({ showTranslation: checked })
            }
          />

          {/* ── Playback Speed ── */}
          <SettingSection
            icon={<Volume2 className="w-4 h-4" />}
            label="Playback Speed"
            value={`${settings.playbackSpeed}x`}
          >
            <div className="flex items-center gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => updateSettings({ playbackSpeed: speed })}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                    settings.playbackSpeed === speed
                      ? "bg-[hsl(var(--mushaf-active))]/10 text-[hsl(var(--mushaf-active))] border border-[hsl(var(--mushaf-active))]/30"
                      : "bg-secondary/30 text-muted-foreground hover:bg-secondary/60 border border-transparent",
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </SettingSection>

          {/* ── Toggle: Auto-play Next ── */}
          <SettingToggle
            icon={<SkipForward className="w-4 h-4" />}
            label="Auto-play Next"
            description="Continue to next verse automatically"
            checked={settings.autoPlayNext}
            onCheckedChange={(checked) =>
              updateSettings({ autoPlayNext: checked })
            }
          />

          {/* Bottom padding */}
          <div className="h-2" />
        </div>

        {/* Safe area for iOS */}
        <div className="safe-area-bottom flex-shrink-0" />
      </div>
    </>
  );
}

// ── Reusable Setting Section ──

function SettingSection({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-foreground/80">
          <span className="text-muted-foreground/60">{icon}</span>
          <span className="text-[13px] font-medium">{label}</span>
        </div>
        {value && (
          <span className="text-[11px] text-muted-foreground/50 tabular-nums font-medium">
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Reusable Setting Toggle ──

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-muted-foreground/60 shrink-0">{icon}</span>
        <div className="min-w-0">
          <span className="text-[13px] font-medium text-foreground/80 block">
            {label}
          </span>
          {description && (
            <span className="text-[11px] text-muted-foreground/50 block mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
