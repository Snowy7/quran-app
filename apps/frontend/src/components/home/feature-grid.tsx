import { Link } from 'react-router-dom';
import { BookOpen, HandHeart, Clock, Sparkles, BookMarked, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'quran',
    label: 'القرآن',
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    href: '/quran',
  },
  {
    id: 'azkar',
    label: 'الأذكار',
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    href: '/bookmarks',
  },
  {
    id: 'dua',
    label: 'الأدعية',
    icon: <HandHeart className="w-8 h-8 text-primary" />,
    href: '/search',
  },
  {
    id: 'hadith',
    label: 'الأحاديث',
    icon: <BookMarked className="w-8 h-8 text-primary" />,
    href: '/bookmarks',
  },
  {
    id: 'tasbeeh',
    label: 'التسبيح الالكتروني',
    icon: <Mic className="w-8 h-8 text-primary" />,
    href: '/memorize',
  },
  {
    id: 'names',
    label: 'أسماء الله الحسنى',
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    href: '/search',
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
      {FEATURES.map((feature, index) => (
        <Link
          key={feature.id}
          to={feature.href}
          className={cn(
            'flex flex-col items-center justify-center gap-3',
            'bg-secondary rounded-xl px-3 py-5',
            'border-b-[3px] border-b-primary',
            'transition-all duration-200',
            'hover:shadow-md hover:-translate-y-0.5',
            'active:scale-95',
            'animate-slide-up'
          )}
          style={{
            animationDelay: `${200 + index * 50}ms`,
            animationFillMode: 'both',
          }}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            {feature.icon}
          </div>
          <span className="font-arabic-ui text-xs text-primary text-center leading-tight truncate w-full">
            {feature.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
