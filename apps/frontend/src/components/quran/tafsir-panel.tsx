import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Skeleton } from '@template/ui';
import { useTafsirForVerse } from '@/lib/api/tafsirs';
import { cn } from '@/lib/utils';

interface TafsirPanelProps {
  verseKey: string;
  isOpen: boolean;
  onToggle: () => void;
}

// Default tafsir: Ibn Kathir (English) = 169
const DEFAULT_TAFSIR_ID = 169;

export function TafsirPanel({ verseKey, isOpen, onToggle }: TafsirPanelProps) {
  const { data: tafsir, isLoading, isError } = useTafsirForVerse(
    isOpen ? DEFAULT_TAFSIR_ID : undefined,
    isOpen ? verseKey : undefined,
  );

  return (
    <div className="border-t border-border/30">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Tafsir</span>
        {isOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          )}

          {isError && (
            <p className="text-xs text-muted-foreground">
              Failed to load tafsir.
            </p>
          )}

          {tafsir && (
            <div
              className="tafsir-content text-sm leading-relaxed text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(tafsir.text),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
