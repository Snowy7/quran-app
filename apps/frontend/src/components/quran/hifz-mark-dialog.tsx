import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@template/ui';
import { markVerse } from '@/lib/db/hifz';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HifzMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verseKey: string;
  chapterId: number;
  verseNumber: number;
}

type Confidence = 'new' | 'learning' | 'shaky' | 'good' | 'solid';

const CONFIDENCE_OPTIONS: {
  value: Confidence;
  emoji: string;
  label: string;
  description: string;
  color: string;
}[] = [
  { value: 'new', emoji: '🌱', label: 'New', description: 'Just started learning', color: 'hover:bg-blue-500/10 hover:border-blue-500/30' },
  { value: 'learning', emoji: '📖', label: 'Learning', description: 'Still practicing', color: 'hover:bg-amber-500/10 hover:border-amber-500/30' },
  { value: 'shaky', emoji: '🤔', label: 'Shaky', description: 'Know it but not confident', color: 'hover:bg-orange-500/10 hover:border-orange-500/30' },
  { value: 'good', emoji: '😊', label: 'Good', description: 'Recall it well', color: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' },
  { value: 'solid', emoji: '💪', label: 'Solid', description: 'Fully memorized', color: 'hover:bg-primary/10 hover:border-primary/30' },
];

export function HifzMarkDialog({
  open,
  onOpenChange,
  verseKey,
  chapterId,
  verseNumber,
}: HifzMarkDialogProps) {
  const handleMark = async (confidence: Confidence) => {
    await markVerse({ verseKey, chapterId, verseNumber, confidence });
    toast.success(`${verseKey} marked as ${confidence}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-base">Mark {verseKey}</DialogTitle>
          <DialogDescription className="text-xs">
            How well do you know this verse?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {CONFIDENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleMark(option.value)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-3 rounded-xl border border-border/50 text-left transition-all active:scale-[0.98]',
                option.color,
              )}
            >
              <span className="text-lg">{option.emoji}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="text-[10px] text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
