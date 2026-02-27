import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@template/ui';
import { useAudioStore, RECITERS } from '@/lib/stores/audio-store';
import { cn } from '@/lib/utils';

interface ReciterPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReciterPicker({ open, onOpenChange }: ReciterPickerProps) {
  const { reciterId, setReciter } = useAudioStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-base">Choose Reciter</DialogTitle>
          <DialogDescription className="text-xs">
            Select a Quran reciter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0.5 max-h-[320px] overflow-y-auto -mx-1 px-1">
          {RECITERS.map((reciter) => {
            const isSelected = reciter.id === reciterId;
            return (
              <button
                key={reciter.id}
                onClick={() => {
                  setReciter(reciter.id, reciter.subfolder);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-3 rounded-lg text-left transition-all',
                  isSelected
                    ? 'bg-primary/10 ring-1 ring-primary/20'
                    : 'hover:bg-secondary/80',
                )}
              >
                <span className="flex-1 text-sm font-medium truncate">{reciter.name}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
