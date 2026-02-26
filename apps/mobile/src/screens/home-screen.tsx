import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeaturedAyah } from "../hooks/use-featured-ayah";
import { useAppState } from "../context/app-state";
import { palette, radii, spacing } from "../theme/palette";
import { LoadingState } from "../components/loading-state";
import { SidebarSheet } from "../components/sidebar-sheet";
import type { RootStackParamList } from "../navigation/types";
import { useEffect, useState } from "react";

type HomeNavigation = NativeStackNavigationProp<RootStackParamList>;

/* ─── Prayer Hero Card ─── */
function PrayerHero() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const hours = currentTime.getHours();
  const greeting =
    hours < 6 ? "Night Peace" : hours < 12 ? "Good Morning" : hours < 18 ? "Good Afternoon" : "Good Evening";

  const timeStr = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <LinearGradient
      colors={[palette.heroGradientStart, palette.heroGradientMid, palette.heroGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      {/* Decorative mosque silhouette */}
      <View style={styles.heroDecorative}>
        <Text style={styles.heroDecorativeIcon}>🕌</Text>
      </View>

      <View style={styles.heroContent}>
        <Text style={styles.heroGreeting}>{greeting}</Text>
        <Text style={styles.heroTime}>{timeStr}</Text>

        <View style={styles.heroChipRow}>
          <View style={styles.heroChip}>
            <Ionicons name="sunny-outline" size={13} color="#EAD7C0" />
            <Text style={styles.heroChipText}>
              {currentTime.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

/* ─── Daily Verse Card (Dark) ─── */
function DailyVerseCard({
  ayah,
  loading,
}: {
  ayah: { textUthmani: string; translationText: string; verseKey: string } | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <LinearGradient
        colors={[palette.darkCard, palette.darkCardDeep]}
        style={styles.verseCard}
      >
        <LoadingState label="Loading verse..." light />
      </LinearGradient>
    );
  }

  if (!ayah) return null;

  return (
    <LinearGradient
      colors={[palette.darkCard, palette.darkCardDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.verseCard}
    >
      <View style={styles.verseHeader}>
        <Text style={styles.verseSectionTitle}>Daily Verse</Text>
        <View style={styles.verseBadge}>
          <Ionicons name="book-outline" size={11} color="#CC9B76" />
          <Text style={styles.verseBadgeText}>{ayah.verseKey}</Text>
        </View>
      </View>

      <Text style={styles.verseArabic}>{ayah.textUthmani}</Text>

      <View style={styles.verseDivider} />

      <Text style={styles.verseTranslation}>{ayah.translationText}</Text>
    </LinearGradient>
  );
}

/* ─── Quick Actions Grid (Matches web 4-column grid) ─── */
function QuickActions({ navigation }: { navigation: HomeNavigation }) {
  const actions = [
    {
      icon: "bookmark" as const,
      label: "Bookmarks",
      color: palette.quickBookmark,
      onPress: () => navigation.navigate("Tabs", { screen: "Bookmarks" } as any),
    },
    {
      icon: "time" as const,
      label: "Prayer",
      color: palette.quickPrayer,
      onPress: () => {},
    },
    {
      icon: "compass" as const,
      label: "Qibla",
      color: palette.quickQibla,
      onPress: () => {},
    },
    {
      icon: "school" as const,
      label: "Memorize",
      color: palette.quickMemorize,
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.quickGrid}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={styles.quickItem}
          onPress={action.onPress}
        >
          <View style={[styles.quickIconWrap, { backgroundColor: action.color + "18" }]}>
            <Ionicons name={action.icon} size={22} color={action.color} />
          </View>
          <Text style={styles.quickLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ─── Stats Row (Matches web DailyStats) ─── */
function StatsRow({
  totalRead,
  dailyGoal,
  bookmarks,
}: {
  totalRead: number;
  dailyGoal: number;
  bookmarks: number;
}) {
  const progressRatio = Math.min(totalRead / Math.max(dailyGoal, 1), 1);
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>🔥 0</Text>
        <Text style={styles.statLabel}>Streak</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {Math.min(totalRead, dailyGoal)}/{dailyGoal}
        </Text>
        <Text style={styles.statLabel}>Today</Text>
        <View style={styles.statProgressTrack}>
          <View
            style={[
              styles.statProgressFill,
              { width: `${progressPercent}%` as any },
            ]}
          />
        </View>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{bookmarks}</Text>
        <Text style={styles.statLabel}>Saved</Text>
      </View>
    </View>
  );
}

/* ─── Continue Reading Card ─── */
function ContinueReadingCard({
  surahId,
  ayahNumber,
  onPress,
}: {
  surahId: number;
  ayahNumber: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.continueCard} onPress={onPress}>
      <View style={styles.continueLeft}>
        <View style={styles.continueIcon}>
          <Ionicons name="book" size={18} color={palette.brand} />
        </View>
        <View style={styles.continueTextWrap}>
          <Text style={styles.continueTitle}>Continue Reading</Text>
          <Text style={styles.continueSubtitle}>
            Surah {surahId} - Ayah {ayahNumber}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
    </Pressable>
  );
}

/* ─── Main Home Screen ─── */
export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const insets = useSafeAreaInsets();
  const { ayah, loading: loadingVerse } = useFeaturedAyah();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    readingProgress,
    bookmarks,
    preferences,
  } = useAppState();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* App Header */}
      <View style={styles.appBar}>
        <Pressable
          style={styles.appBarButton}
          onPress={() => navigation.navigate("Tabs", { screen: "Quran" } as any)}
        >
          <Ionicons name="search" size={20} color={palette.brand} />
        </Pressable>

        <Text style={styles.appBarTitle}>Noor</Text>

        <Pressable style={styles.appBarButton} onPress={() => setSidebarOpen(true)}>
          <Ionicons name="menu" size={20} color={palette.brand} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prayer Hero */}
        <PrayerHero />

        {/* Daily Verse */}
        <View style={styles.section}>
          <DailyVerseCard ayah={ayah} loading={loadingVerse} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>QUICK ACCESS</Text>
          <QuickActions navigation={navigation} />
        </View>

        {/* Continue Reading */}
        <View style={styles.section}>
          <ContinueReadingCard
            surahId={readingProgress.lastSurahId || 1}
            ayahNumber={readingProgress.lastAyahNumber || 1}
            onPress={() =>
              navigation.navigate("Reader", {
                surahId: readingProgress.lastSurahId || 1,
              })
            }
          />
        </View>

        {/* Today's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>TODAY'S PROGRESS</Text>
          <StatsRow
            totalRead={readingProgress.totalAyahsRead}
            dailyGoal={preferences.dailyAyahGoal}
            bookmarks={bookmarks.length}
          />
        </View>

        {/* Bottom spacer for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <SidebarSheet
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onGoHome={() => navigation.navigate("Tabs", { screen: "Home" } as any)}
        onGoQuran={() => navigation.navigate("Tabs", { screen: "Quran" } as any)}
        onGoBookmarks={() => navigation.navigate("Tabs", { screen: "Bookmarks" } as any)}
        onGoSettings={() => navigation.navigate("Tabs", { screen: "Settings" } as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  /* ── App Bar ── */
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  appBarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: palette.brand,
    letterSpacing: 0.5,
  },

  /* ── Prayer Hero ── */
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    overflow: "hidden",
    minHeight: 160,
    justifyContent: "flex-end",
  },
  heroDecorative: {
    position: "absolute",
    top: 12,
    right: 16,
    opacity: 0.15,
  },
  heroDecorativeIcon: {
    fontSize: 60,
  },
  heroContent: {
    gap: 4,
  },
  heroGreeting: {
    color: "#EAD7C0",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heroTime: {
    color: "#FFF8EE",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroChipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroChipText: {
    color: "#EAD7C0",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ── Sections ── */
  section: {
    marginTop: spacing.xl,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },

  /* ── Daily Verse ── */
  verseCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  verseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verseSectionTitle: {
    color: "#EAD7C0",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  verseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(204,155,118,0.3)",
    backgroundColor: "rgba(204,155,118,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verseBadgeText: {
    color: "#CC9B76",
    fontSize: 11,
    fontWeight: "700",
  },
  verseArabic: {
    color: "#FFF0DE",
    fontSize: 28,
    textAlign: "right",
    lineHeight: 52,
    writingDirection: "rtl",
    fontFamily: "AmiriQuranColored",
  },
  verseDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  verseTranslation: {
    color: "#CCB196",
    fontSize: 14,
    lineHeight: 22,
  },

  /* ── Quick Actions ── */
  quickGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  quickItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.textSecondary,
    textAlign: "center",
  },

  /* ── Continue Reading ── */
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  continueLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.brand + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  continueTextWrap: {
    gap: 2,
  },
  continueTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  continueSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
  },

  /* ── Stats Row ── */
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statProgressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E1D4BF",
    marginTop: 4,
    overflow: "hidden",
  },
  statProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: palette.brand,
  },
});
