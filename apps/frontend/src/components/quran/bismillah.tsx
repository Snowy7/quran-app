interface BismillahProps {
  chapterId: number;
}

const BISMILLAH_TEXT =
  '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u064e\u0651\u062d\u0650\u064a\u0645\u0650';

export function Bismillah({ chapterId }: BismillahProps) {
  // Surah 1 includes Bismillah in verse 1; Surah 9 has no Bismillah.
  if (chapterId === 1 || chapterId === 9) return null;

  return (
    <div className="py-8 text-center">
      <div className="inline-flex items-center gap-4 w-full max-w-md">
        <div className="flex-1 h-px bg-border" />
        <p
          className="arabic-text text-2xl text-foreground/80 leading-loose"
          dir="rtl"
          style={{ fontFamily: "'Scheherazade New', 'quran_common', serif" }}
        >
          {BISMILLAH_TEXT}
        </p>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}

