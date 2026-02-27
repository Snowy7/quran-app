interface BismillahProps {
  chapterId: number;
}

export function Bismillah({ chapterId }: BismillahProps) {
  // Surah 1 (Al-Fatiha) has bismillah as part of its verses
  // Surah 9 (At-Tawbah) has no bismillah
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
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}
