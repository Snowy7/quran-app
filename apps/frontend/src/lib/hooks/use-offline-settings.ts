import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS } from "@/lib/db";
import type { UserSettings } from "@/types/quran";

export function useOfflineSettings() {
  const settings = useLiveQuery(
    () => db.settings.get("current"),
    [],
    DEFAULT_SETTINGS,
  );

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const current = await db.settings.get("current");
    const updated: UserSettings = {
      ...(current || DEFAULT_SETTINGS),
      ...updates,
      version: (current?.version || 0) + 1,
      isDirty: true,
    };
    await db.settings.put(updated);
    return updated;
  };

  // Merge with defaults so new fields are always present for existing users
  const mergedSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };

  return {
    settings: mergedSettings,
    updateSettings,
    isLoading: settings === undefined,
  };
}
