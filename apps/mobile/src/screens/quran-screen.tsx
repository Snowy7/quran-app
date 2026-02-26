import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { memo, useCallback, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState } from "../components/loading-state";
import { useQuranCatalog } from "../hooks/use-quran-catalog";
import type { RootStackParamList } from "../navigation/types";
import { palette, fonts, radii, shadows, spacing } from "../theme/palette";
import type { SurahSummary } from "../types/quran";

type QuranNavigation = NativeStackNavigationProp<RootStackParamList>;

/* ─── Tab Selector (Matches web 3-tab toggle: Surah/Juz/Page) ─── */
function TabSelector({
  active,
  onChange,
}: {
  active: string;
  onChange: (tab: string) => void;
}) {
  const tabs = ["Surah", "Juz", "Page"];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = active === tab;
        return (
          <Pressable
            key={tab}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Surah Row (Matches web surah index style) ─── */
interface SurahRowProps {
  surah: SurahSummary;
  onPress: (surah: SurahSummary) => void;
}

const SurahRow = memo(function SurahRow({ surah, onPress }: SurahRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onPress(surah)}
    >
      {/* Number Badge */}
      <View style={styles.rowBadge}>
        <Text style={styles.rowBadgeText}>{surah.id}</Text>
      </View>

      {/* Info */}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{surah.nameSimple}</Text>
        <Text style={styles.rowSubTitle}>
          {surah.translatedName} · {surah.versesCount} ayahs
        </Text>
      </View>

      {/* Arabic Name */}
      <View style={styles.rowRight}>
        <Text style={styles.rowArabic}>{surah.nameArabic}</Text>
        <View style={styles.revelationBadge}>
          <Text style={styles.revelationText}>
            {surah.revelationPlace === "makkah" ? "Meccan" : "Medinan"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

/* ─── Main Quran Screen ─── */
export function QuranScreen() {
  const navigation = useNavigation<QuranNavigation>();
  const insets = useSafeAreaInsets();
  const { chapters, loading, error } = useQuranCatalog();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Surah");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return chapters;

    return chapters.filter((surah) => {
      if (`${surah.id}` === needle) return true;
      if (surah.nameSimple.toLowerCase().includes(needle)) return true;
      if (surah.translatedName.toLowerCase().includes(needle)) return true;
      return surah.nameArabic.includes(query);
    });
  }, [chapters, query]);

  const handleOpen = useCallback(
    (surah: SurahSummary) => {
      navigation.navigate("Reader", {
        surahId: surah.id,
        surahName: surah.nameSimple,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SurahSummary>) => (
      <SurahRow surah={item} onPress={handleOpen} />
    ),
    [handleOpen],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>القرآن الكريم</Text>
        <Text style={styles.subtitle}>The Noble Quran · 114 Surahs</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabWrap}>
        <TabSelector active={activeTab} onChange={setActiveTab} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={palette.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          placeholder="Search surah name or number..."
          placeholderTextColor={palette.textMuted}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={palette.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Loading / Error */}
      {loading && <LoadingState label="Loading surahs..." />}
      {!loading && error && <Text style={styles.errorText}>{error}</Text>}

      {/* Surah List */}
      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    alignItems: "center",
    gap: 2,
  },
  title: {
    color: palette.brand,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Amiri-Regular",
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
  },

  /* ── Tabs ── */
  tabWrap: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: palette.brand,
    ...shadows.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textMuted,
  },
  tabTextActive: {
    color: palette.textOnBrand,
  },

  /* ── Search ── */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
  },
  search: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 15,
    paddingVertical: 12,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },

  /* ── Row ── */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: 10,
  },
  rowPressed: {
    backgroundColor: palette.surfaceRaised,
    transform: [{ scale: 0.98 }],
  },
  rowBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.brand + "14",
  },
  rowBadgeText: {
    color: palette.brand,
    fontWeight: "800",
    fontSize: 13,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  rowSubTitle: {
    color: palette.textMuted,
    fontSize: 12,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  rowArabic: {
    color: palette.textPrimary,
    fontSize: 20,
    fontFamily: "Amiri-Regular",
  },
  revelationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: palette.brand + "10",
  },
  revelationText: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.brand,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  errorText: {
    color: palette.danger,
    fontWeight: "600",
    textAlign: "center",
    padding: spacing.xl,
  },
});
