import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "../context/app-state";
import { palette, radii, shadows, spacing } from "../theme/palette";
import type { SyncStatus } from "../types/quran";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ─── Section Component (Matches web settings sections) ─── */
function SettingsSection({
  title,
  icon,
  iconColor,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: iconColor + "14" }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/* ─── Setting Row ─── */
function SettingRow({
  label,
  subtitle,
  right,
}: {
  label: string;
  subtitle?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

/* ─── Stepper Row ─── */
interface StepperRowProps {
  label: string;
  subtitle?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (next: number) => void;
}

function StepperRow({
  label,
  subtitle,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: StepperRowProps) {
  return (
    <SettingRow
      label={label}
      subtitle={subtitle}
      right={
        <View style={styles.stepper}>
          <Pressable
            style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
            onPress={() => onChange(clamp(value - step, min, max))}
            disabled={value <= min}
          >
            <Ionicons
              name="remove"
              size={16}
              color={value <= min ? palette.textMuted : palette.brand}
            />
          </Pressable>
          <Text style={styles.stepperValue}>
            {value}{unit || ""}
          </Text>
          <Pressable
            style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]}
            onPress={() => onChange(clamp(value + step, min, max))}
            disabled={value >= max}
          >
            <Ionicons
              name="add"
              size={16}
              color={value >= max ? palette.textMuted : palette.brand}
            />
          </Pressable>
        </View>
      }
    />
  );
}

/* ─── Main Settings Screen ─── */
export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    preferences,
    updatePreferences,
    syncNow,
    syncStatus,
    syncError,
    lastSyncedAt,
    backendEnabled,
  } = useAppState();

  const syncLabelByState: Record<SyncStatus, string> = {
    idle: "Ready",
    syncing: "Syncing...",
    success: "Synced ✓",
    error: "Sync failed",
    disabled: "Local only",
  };

  const syncStatusColor: Record<SyncStatus, string> = {
    idle: palette.textMuted,
    syncing: palette.brand,
    success: palette.success,
    error: palette.danger,
    disabled: palette.textMuted,
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Reading Preferences */}
        <SettingsSection
          title="Reading"
          icon="book-outline"
          iconColor={palette.brand}
        >
          <SettingRow
            label="Show translation"
            subtitle="Display English translation below Arabic"
            right={
              <Switch
                value={preferences.showTranslation}
                onValueChange={(val) =>
                  updatePreferences({ showTranslation: val })
                }
                trackColor={{
                  false: palette.border,
                  true: palette.brand + "60",
                }}
                thumbColor={
                  preferences.showTranslation ? palette.brand : palette.surfaceSoft
                }
              />
            }
          />

          <View style={styles.divider} />

          <StepperRow
            label="Arabic font size"
            subtitle="Quran text display size"
            value={preferences.arabicFontSize}
            min={20}
            max={44}
            step={2}
            unit="px"
            onChange={(v) => updatePreferences({ arabicFontSize: v })}
          />

          <View style={styles.divider} />

          <StepperRow
            label="Translation size"
            subtitle="English text display size"
            value={preferences.translationFontSize}
            min={12}
            max={24}
            step={1}
            unit="px"
            onChange={(v) => updatePreferences({ translationFontSize: v })}
          />
        </SettingsSection>

        {/* Goals */}
        <SettingsSection
          title="Daily Goal"
          icon="flag-outline"
          iconColor={palette.success}
        >
          <StepperRow
            label="Daily ayah goal"
            subtitle="Set your reading target"
            value={preferences.dailyAyahGoal}
            min={1}
            max={100}
            step={1}
            onChange={(v) => updatePreferences({ dailyAyahGoal: v })}
          />
        </SettingsSection>

        {/* Cloud Sync */}
        <SettingsSection
          title="Cloud Sync"
          icon="cloud-outline"
          iconColor={palette.quickQibla}
        >
          <View style={styles.syncStatusRow}>
            <View style={styles.syncStatusLeft}>
              <View
                style={[
                  styles.syncDot,
                  { backgroundColor: syncStatusColor[syncStatus] },
                ]}
              />
              <Text style={styles.syncStatusText}>
                {syncLabelByState[syncStatus]}
              </Text>
            </View>
            {!backendEnabled && (
              <Text style={styles.syncHint}>Set EXPO_PUBLIC_CONVEX_URL</Text>
            )}
          </View>

          {syncError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={14} color={palette.danger} />
              <Text style={styles.errorText}>{syncError}</Text>
            </View>
          )}

          {lastSyncedAt && (
            <Text style={styles.syncTime}>
              Last synced: {new Date(lastSyncedAt).toLocaleString()}
            </Text>
          )}

          <Pressable
            style={[
              styles.syncButton,
              syncStatus === "syncing" && styles.syncButtonBusy,
            ]}
            onPress={() => void syncNow()}
            disabled={syncStatus === "syncing"}
          >
            <Ionicons
              name="sync"
              size={16}
              color={palette.textOnBrand}
            />
            <Text style={styles.syncButtonText}>
              {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
            </Text>
          </Pressable>
        </SettingsSection>

        {/* About */}
        <SettingsSection
          title="About"
          icon="information-circle-outline"
          iconColor={palette.accent}
        >
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>Noor Mobile v0.1.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Data</Text>
            <Text style={styles.aboutValue}>Quran.com API v4</Text>
          </View>
        </SettingsSection>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },

  /* ── Header ── */
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
  },

  /* ── Scroll ── */
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },

  /* ── Sections ── */
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionBody: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },

  /* ── Setting Row ── */
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  settingLeft: {
    flex: 1,
    gap: 1,
  },
  settingLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  settingSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border + "60",
  },

  /* ── Stepper ── */
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.brand + "10",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    color: palette.brand,
    fontSize: 18,
    fontWeight: "700",
    marginTop: -1,
  },
  stepperValue: {
    width: 42,
    textAlign: "center",
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },

  /* ── Sync ── */
  syncStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  syncStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncStatusText: {
    color: palette.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  syncHint: {
    color: palette.textMuted,
    fontSize: 11,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.danger + "10",
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  syncTime: {
    color: palette.textMuted,
    fontSize: 12,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.md,
    backgroundColor: palette.brand,
    paddingVertical: 14,
    ...shadows.sm,
  },
  syncButtonBusy: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: palette.textOnBrand,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  /* ── About ── */
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aboutLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  aboutValue: {
    color: palette.textSecondary,
    fontSize: 14,
  },
});
