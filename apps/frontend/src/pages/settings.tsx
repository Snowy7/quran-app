import { AppHeader } from '@/components/layout/app-header';

export default function SettingsPage() {
  return (
    <div>
      <AppHeader title="Settings" showBack />
      <div className="px-5 py-4">
        <p className="text-muted-foreground text-sm">Settings coming in Phase 5...</p>
      </div>
    </div>
  );
}
