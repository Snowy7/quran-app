import { useRef, useEffect, useState, useCallback } from 'react';
import {
  X,
  Type,
  Languages,
  Volume2,
  SkipForward,
  Eye,
  ALargeSmall,
  Palette,
  MoveHorizontal,
  BookText,
} from 'lucide-react';
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
} from '@template/ui';
import { useOfflineSettings } from '@/lib/hooks';
import { AVAILABLE_TAFSIRS } from '@/lib/api/quran-api';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ArabicFontFamily, TextColorMode } from '@/types/quran';

interface ReadingSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const fontFamilies: { id: ArabicFontFamily; name: string }[] = [
  { id: 'uthmani', name: 'Amiri Quran' },
  { id: 'scheherazade', name: 'Scheherazade' },
  { id: 'amiri', name: 'Amiri' },
  { id: 'noto-naskh', name: 'Noto Naskh' },
  { id: 'lateef', name: 'Lateef' },
  { id: 'noto-nastaliq', name: 'Nastaliq' },
  { id: 'aref-ruqaa', name: 'Aref Ruqaa' },
  { id: 'reem-kufi', name: 'Reem Kufi' },
  { id: 'marhey', name: 'Marhey' },
  { id: 'alkalami', name: 'Alkalami' },
  { id: 'cairo', name: 'Cairo' },
  { id: 'tajawal', name: 'Tajawal' },
];

/** Maps font family id to the actual CSS font-family value */
export const FONT_FAMILY_MAP: Record<ArabicFontFamily, string> = {
  uthmani: '"Amiri Quran", serif',
  scheherazade: '"Scheherazade New", serif',
  amiri: '"Amiri", serif',
  'noto-naskh': '"Noto Naskh Arabic", serif',
  lateef: '"Lateef", serif',
  'noto-nastaliq': '"Noto Nastaliq Urdu", serif',
  'aref-ruqaa': '"Aref Ruqaa", serif',
  'reem-kufi': '"Reem Kufi", sans-serif',
  marhey: '"Marhey", sans-serif',
  alkalami: '"Alkalami", serif',
  cairo: '"Cairo", sans-serif',
  tajawal: '"Tajawal", sans-serif',
};

/** Returns the CSS class for a given font family id (kept for backward compat) */
export function getFontClass(id: ArabicFontFamily): string {
  return `arabic-${id}`;
}

/** Returns inline style object for a given font family */
export function getFontStyle(id: ArabicFontFamily): React.CSSProperties {
  return { fontFamily: FONT_FAMILY_MAP[id] };
}

export function ReadingSettingsSheet({ isOpen, onClose }: ReadingSettingsSheetProps) {
  const { settings, updateSettings } = useOfflineSettings();
  const { t, isRTL } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const content = contentRef.current;
    const target = e.target as HTMLElement;
    const isHandle = target.closest('[data-sheet-handle]');
    const isAtTop = content ? content.scrollTop <= 0 : true;

    if (isHandle || isAtTop) {
      dragStartRef.current = { y: touch.clientY, time: Date.now() };
    }
  }, []);

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

  const handleTouchEnd = useCallback(() => {
    if (!dragStartRef.current || !isDragging) {
      dragStartRef.current = null;
      return;
    }

    const velocity = dragOffset / (Date.now() - dragStartRef.current.time) * 1000;
    const shouldClose = dragOffset > 150 || velocity > 500;

    if (shouldClose) {
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
        className="fixed inset-0 z-[70] bg-black/50"
        style={{ opacity: Math.max(0, 1 - dragOffset / 400) }}
        onClick={onClose}
      />

      {/* Sheet — full-width bottom, centered with max-w inside */}
      <div
        className="fixed inset-x-0 bottom-0 z-[70] flex justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            'w-full max-w-lg',
            'bg-background rounded-t-3xl shadow-2xl',
            'max-h-[85vh] flex flex-col',
            !isDragging && 'transition-transform duration-300 ease-out'
          )}
          style={{
            transform: `translateY(${dragOffset}px)`,
            animation: !isDragging ? 'sheet-slide-up 0.3s ease-out' : undefined,
          }}
        >
          {/* Handle */}
          <div
            data-sheet-handle
            className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing"
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto" />
          </div>

          {/* Header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-5 pb-4 border-b border-border"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <h2 className={cn('text-lg font-semibold', isRTL && 'font-arabic-ui')}>
              {t('readingSettings')}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 space-y-6"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Arabic Font Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className={cn(isRTL && 'font-arabic-ui')}>{t('arabicFontSize')}</Label>
                <span className="text-sm text-muted-foreground">{settings.arabicFontSize}px</span>
              </div>
              <Slider
                value={[settings.arabicFontSize]}
                onValueChange={(v: number[]) => updateSettings({ arabicFontSize: v[0] })}
                min={20}
                max={44}
                step={2}
                dir="ltr"
              />
              <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <p
                  className="arabic-text text-center"
                  style={{
                    fontSize: settings.arabicFontSize,
                    ...getFontStyle(settings.arabicFontFamily),
                  }}
                  dir="rtl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            </div>

            {/* Arabic Font Family — 12 fonts with grid picker */}
            <div>
              <Label className={cn('mb-3 block', isRTL && 'font-arabic-ui')}>{t('arabicFont')}</Label>
              <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto overscroll-contain pr-1">
                {fontFamilies.map(({ id, name }) => (
                  <button
                    key={id}
                    onClick={() => updateSettings({ arabicFontFamily: id })}
                    className={cn(
                      'px-2 py-2 rounded-xl text-center transition-all duration-200',
                      'border',
                      settings.arabicFontFamily === id
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/60',
                    )}
                  >
                    <span
                      className="arabic-text block text-base leading-tight mb-0.5"
                      style={getFontStyle(id)}
                    >
                      بسم
                    </span>
                    <span className="text-[10px] font-medium">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color Mode */}
            <div>
              <Label className={cn('mb-3 block', isRTL && 'font-arabic-ui')}>
                {t('textBrightness')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'default' as TextColorMode, label: 'Default', desc: 'Full brightness' },
                  { id: 'soft' as TextColorMode, label: 'Soft', desc: 'Light grey, easier on eyes' },
                ]).map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => updateSettings({ textColorMode: id })}
                    className={cn(
                      'px-3 py-2.5 rounded-xl text-center transition-all duration-200',
                      'border',
                      settings.textColorMode === id
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/60',
                    )}
                  >
                    <span className="text-xs font-medium block">{label}</span>
                    <span className="text-[10px] text-muted-foreground/60 block mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
              {/* Preview */}
              <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <p
                  className={cn(
                    'arabic-text text-center',
                    settings.textColorMode === 'soft' && 'text-[hsl(var(--text-soft))]',
                  )}
                  style={{
                    fontSize: Math.min(settings.arabicFontSize, 28),
                    ...getFontStyle(settings.arabicFontFamily),
                  }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            </div>

            {/* Layout & Spacing controls */}
            <div>
              <Label className={cn('mb-3 block', isRTL && 'font-arabic-ui')}>
                {t('layoutSpacing')}
              </Label>
              <div className="space-y-4">
                {/* Reading Width */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground/70">
                      {t('readingWidth')}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                      {settings.readingWidth}%
                    </span>
                  </div>
                  <Slider
                    value={[settings.readingWidth]}
                    onValueChange={(v: number[]) => updateSettings({ readingWidth: v[0] })}
                    min={50}
                    max={100}
                    step={5}
                    dir="ltr"
                  />
                </div>

                {/* Line Height */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground/70">
                      {t('lineHeight')}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                      {settings.lineHeight.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[settings.lineHeight * 10]}
                    onValueChange={(v: number[]) => updateSettings({ lineHeight: v[0] / 10 })}
                    min={16}
                    max={34}
                    step={1}
                    dir="ltr"
                  />
                </div>

                {/* Word Spacing */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground/70">
                      {t('wordSpacing')}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                      {settings.wordSpacing}px
                    </span>
                  </div>
                  <Slider
                    value={[settings.wordSpacing]}
                    onValueChange={(v: number[]) => updateSettings({ wordSpacing: v[0] })}
                    min={0}
                    max={20}
                    step={1}
                    dir="ltr"
                  />
                </div>

                {/* Letter Spacing */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground/70">
                      {t('letterSpacing')}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                      {settings.letterSpacing}px
                    </span>
                  </div>
                  <Slider
                    value={[settings.letterSpacing]}
                    onValueChange={(v: number[]) => updateSettings({ letterSpacing: v[0] })}
                    min={0}
                    max={10}
                    step={1}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Live preview */}
              <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <p
                  className="arabic-text text-center"
                  style={{
                    fontSize: Math.min(settings.arabicFontSize, 26),
                    lineHeight: settings.lineHeight,
                    wordSpacing: `${settings.wordSpacing}px`,
                    letterSpacing: `${settings.letterSpacing}px`,
                    ...getFontStyle(settings.arabicFontFamily),
                  }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            </div>

            {/* Translation Font Size */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className={cn(isRTL && 'font-arabic-ui')}>{t('translationFontSize')}</Label>
                <span className="text-sm text-muted-foreground">{settings.translationFontSize}px</span>
              </div>
              <Slider
                value={[settings.translationFontSize]}
                onValueChange={(v: number[]) => updateSettings({ translationFontSize: v[0] })}
                min={12}
                max={22}
                step={1}
                dir="ltr"
              />
              <p
                className="text-muted-foreground text-center mt-3"
                style={{ fontSize: settings.translationFontSize }}
              >
                In the name of Allah, the Most Gracious, the Most Merciful.
              </p>
            </div>

            {/* Show Translation */}
            <div className="flex items-center justify-between py-2">
              <Label className={cn(isRTL && 'font-arabic-ui')}>{t('showTranslation')}</Label>
              <Switch
                checked={settings.showTranslation}
                onCheckedChange={(checked: boolean) => updateSettings({ showTranslation: checked })}
              />
            </div>

            {/* Show Tafsir */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className={cn(isRTL && 'font-arabic-ui')}>{t('showTafsir')}</Label>
                <p className={cn('text-xs text-muted-foreground mt-0.5', isRTL && 'font-arabic-ui')}>
                  {t('tafsirDescription')}
                </p>
              </div>
              <Switch
                checked={settings.showTafsir}
                onCheckedChange={(checked: boolean) => updateSettings({ showTafsir: checked })}
              />
            </div>

            {/* Tafsir Selection */}
            {settings.showTafsir && (
              <div>
                <Label className={cn('mb-3 block', isRTL && 'font-arabic-ui')}>{t('tafsirSource')}</Label>
                <Select
                  value={String(settings.primaryTafsir)}
                  onValueChange={(value: string) => updateSettings({ primaryTafsir: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tafsir" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TAFSIRS.map((tf) => (
                      <SelectItem key={tf.id} value={String(tf.id)}>
                        <span className="font-arabic-ui">{tf.nameAr}</span>
                        <span className="text-muted-foreground text-xs ms-2">({tf.language.toUpperCase()})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Playback Speed */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className={cn(isRTL && 'font-arabic-ui')}>{t('playbackSpeed')}</Label>
                <span className="text-sm text-muted-foreground">{settings.playbackSpeed}x</span>
              </div>
              <Slider
                value={[settings.playbackSpeed]}
                onValueChange={(v: number[]) => updateSettings({ playbackSpeed: v[0] })}
                min={0.5}
                max={2}
                step={0.25}
                dir="ltr"
              />
            </div>

            {/* Auto-play Next */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className={cn(isRTL && 'font-arabic-ui')}>{t('autoPlayNext')}</Label>
                <p className={cn('text-xs text-muted-foreground mt-0.5', isRTL && 'font-arabic-ui')}>
                  {t('autoPlayNextDesc')}
                </p>
              </div>
              <Switch
                checked={settings.autoPlayNext}
                onCheckedChange={(checked: boolean) => updateSettings({ autoPlayNext: checked })}
              />
            </div>

            {/* Extra padding at bottom */}
            <div className="h-4" />
          </div>

          {/* Safe area padding for iOS */}
          <div className="safe-area-bottom flex-shrink-0" />
        </div>
      </div>
    </>
  );
}
