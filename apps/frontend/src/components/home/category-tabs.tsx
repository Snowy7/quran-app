import { useState } from 'react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'all', label: 'جميع التصنيفات' },
  { id: 'media', label: 'كل الوسائط' },
  { id: 'prayer', label: 'أوقات الصلاة' },
];

export function CategoryTabs() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="flex items-center gap-1.5 bg-primary rounded-xl p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            'flex-1 px-3 py-2 rounded-lg text-xs font-arabic-ui font-bold',
            'transition-all duration-200',
            activeTab === tab.id
              ? 'bg-accent text-white shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          )}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
