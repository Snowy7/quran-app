import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../components/empty-state";
import { useAppState } from "../context/app-state";
import type { RootStackParamList } from "../navigation/types";
import { palette, radii, shadows, spacing } from "../theme/palette";
import type { BookmarkEntry } from "../types/quran";

type BookmarksNavigation = NativeStackNavigationProp<RootStackParamList>;

/* ─── Bookmark Row (Matches web bookmark card style) ─── */
interface BookmarkRowProps {
  bookmark: BookmarkEntry;
  onOpen: (bookmark: BookmarkEntry) => void;
  onRemove: (bookmark: BookmarkEntry) => void;
}

const BookmarkRow = memo(function BookmarkRow({
  bookmark,
  onOpen,
  onRemove,
}: BookmarkRowProps) {
  const timeAgo = getTimeAgo(bookmark.updatedAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onOpen(bookmark)}
    >
      {/* Left: Bookmark Icon */}
      <View style={styles.cardIconWrap}>
        <Ionicons name="bookmark" size={16} color={palette.accent} />
      </View>

      {/* Center: Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {bookmark.surahName}
          </Text>
          <View style={styles.ayahChip}>
            <Text style={styles.ayahChipText}>
              Ayah {bookmark.ayahNumber}
            </Text>
          </View>
        </View>

        {bookmark.ayahText ? (
          <Text style={styles.cardArabic} numberOfLines={1}>
            {bookmark.ayahText}
          </Text>
        ) : (
          <Text style={styles.cardHint}>
            Tap to continue reading
          </Text>
        )}

        <Text style={styles.cardTime}>{timeAgo}</Text>
      </View>

      {/* Right: Actions */}
      <View style={styles.cardActions}>
        <Pressable
          style={styles.removeBtn}
          onPress={() => onRemove(bookmark)}
          hitSlop={10}
        >
          <Ionicons name="trash-outline" size={16} color={palette.danger} />
        </Pressable>
        <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
      </View>
    </Pressable>
  );
});

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/* ─── Main Bookmarks Screen ─── */
export function BookmarksScreen() {
  const navigation = useNavigation<BookmarksNavigation>();
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark } = useAppState();

  const sortedBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => b.updatedAt - a.updatedAt),
    [bookmarks],
  );

  const handleOpen = useCallback(
    (bookmark: BookmarkEntry) => {
      navigation.navigate("Reader", {
        surahId: bookmark.surahId,
        surahName: bookmark.surahName,
      });
    },
    [navigation],
  );

  const handleRemove = useCallback(
    (bookmark: BookmarkEntry) => {
      toggleBookmark(
        bookmark.surahId,
        bookmark.surahName,
        bookmark.ayahNumber,
        bookmark.ayahText,
      );
    },
    [toggleBookmark],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BookmarkEntry>) => (
      <BookmarkRow bookmark={item} onOpen={handleOpen} onRemove={handleRemove} />
    ),
    [handleOpen, handleRemove],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="bookmark" size={18} color={palette.accent} />
          </View>
          <View>
            <Text style={styles.title}>Bookmarks</Text>
            <Text style={styles.subtitle}>
              {bookmarks.length} saved ayah{bookmarks.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      </View>

      {sortedBookmarks.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          subtitle="While reading, tap the bookmark icon on any ayah to save it here."
          icon="bookmark-outline"
        />
      ) : (
        <FlashList
          data={sortedBookmarks}
          keyExtractor={(item) => `${item.surahId}:${item.ayahNumber}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.accent + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 13,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },

  /* ── Card ── */
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    backgroundColor: palette.surfaceRaised,
    transform: [{ scale: 0.98 }],
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.accent + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
  },
  ayahChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: palette.brand + "10",
  },
  ayahChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: palette.brand,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardArabic: {
    color: palette.textPrimary,
    fontSize: 16,
    fontFamily: "AmiriQuranColored",
    writingDirection: "rtl",
    textAlign: "right",
  },
  cardHint: {
    color: palette.textMuted,
    fontSize: 13,
    fontStyle: "italic",
  },
  cardTime: {
    color: palette.textMuted,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.danger + "10",
  },
});
