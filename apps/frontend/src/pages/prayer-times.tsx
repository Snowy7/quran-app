import { AppHeader } from '@/components/layout/app-header';

export default function PrayerTimesPage() {
  return (
    <div>
      <AppHeader title="Prayer Times" showBack />
      <div className="px-5 py-4">
        <p className="text-muted-foreground text-sm">Prayer times coming in Phase 5...</p>
      </div>
    </div>
  );
}
