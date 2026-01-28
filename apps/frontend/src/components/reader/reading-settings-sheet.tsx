import { useRef, useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button, Slider, Switch, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@template/ui';
import { useOfflineSettings } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { ArabicFontFamily } from '@/types/quran';

interface ReadingSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const fontFamilies: { id: ArabicFontFamily; name: string }[] = [
  { id: 'uthmani', name: 'Uthmani (Amiri Quran)' },
  { id: 'scheherazade', name: 'Scheherazade New' },
  { id: 'amiri', name: 'Amiri' },
];

export function ReadingSettingsSheet({ isOpen, onClose }: ReadingSettingsSheetProps) {
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

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const content = contentRef.current;

    // Only start drag if at top of scroll or touching the handle area
    const target = e.target as HTMLElement;
    const isHandle = target.closest('[data-sheet-handle]');
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

    // Only allow dragging down
    if (deltaY > 0) {
      setIsDragging(true);
      setDragOffset(deltaY);
      // Prevent scroll when dragging
      e.preventDefault();
    }
  }, []);

  // Handle touch end
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

  // Reset drag state when closing
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
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200',
          dragOffset > 0 ? 'opacity-50' : 'opacity-100'
        )}
        style={{ opacity: Math.max(0, 1 - dragOffset / 400) }}
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl shadow-xl',
          'max-h-[85vh] flex flex-col',
          !isDragging && 'transition-transform duration-200'
        )}
        style={{
          transform: `translateY(${dragOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle - always draggable */}
        <div
          data-sheet-handle
          className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1.5 bg-border rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold">Reading Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 space-y-6"
        >
          {/* Arabic Font Size */}
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
            <p
              className={cn(
                'arabic-text text-center mt-4',
                settings.arabicFontFamily === 'scheherazade' && 'arabic-scheherazade',
                settings.arabicFontFamily === 'uthmani' && 'arabic-uthmani'
              )}
              style={{ fontSize: settings.arabicFontSize }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>

          {/* Arabic Font Family */}
          <div>
            <Label className="mb-3 block">Arabic Font</Label>
            <Select
              value={settings.arabicFontFamily}
              onValueChange={(value: ArabicFontFamily) => updateSettings({ arabicFontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Translation Font Size */}
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
            <p
              className="text-muted-foreground text-center mt-3"
              style={{ fontSize: settings.translationFontSize }}
            >
              In the name of Allah, the Most Gracious, the Most Merciful.
            </p>
          </div>

          {/* Show Translation */}
          <div className="flex items-center justify-between py-2">
            <Label>Show Translation</Label>
            <Switch
              checked={settings.showTranslation}
              onCheckedChange={(checked: boolean) => updateSettings({ showTranslation: checked })}
            />
          </div>

          {/* Playback Speed */}
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

          {/* Auto-play Next */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Auto-play Next Verse</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Continue to next verse automatically
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
    </>
  );
}
