import { Ionicons } from "@expo/vector-icons";
import { Audio, type AVPlaybackStatus } from "expo-av";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState } from "../components/loading-state";
import { useAppState } from "../context/app-state";
import { useChapterVerses } from "../hooks/use-chapter-verses";
import { useQuranCatalog } from "../hooks/use-quran-catalog";
import { useTafsir } from "../hooks/use-tafsir";
import { getAyahAudioUrls } from "../lib/quran-api";
import type { RootStackParamList } from "../navigation/types";
import { fonts, palette, radii, shadows, spacing } from "../theme/palette";
import type { Ayah, SurahSummary, TafsirEntry } from "../types/quran";

type ReaderProps = NativeStackScreenProps<RootStackParamList, "Reader">;
type ReadingMode = "ayah" | "mushaf";

const BISMILLAH =
  "\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u0631\u062d\u064a\u0645";
const SURAHS_WITHOUT_BISMILLAH = [1, 9];
const ARABIC_DIGITS = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";

function toArabicNumerals(n: number): string {
  return n.toString().replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)] ?? d);
}

function parseAyahNumber(verseKey: string): number {
  const ayah = Number(verseKey.split(":")[1]);
  return Number.isFinite(ayah) ? ayah : 1;
}

interface SurahPickerSheetProps {
  visible: boolean;
  chapters: SurahSummary[];
  currentSurahId: number;
  onClose: () => void;
  onSelect: (surah: SurahSummary) => void;
}

function SurahPickerSheet({
  visible,
  chapters,
  currentSurahId,
  onClose,
  onSelect,
}: SurahPickerSheetProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuery("");
    }
  }, [visible]);

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.surahSheetWrap}>
        <View style={styles.surahSheet}>
          <View style={styles.surahSheetHeader}>
            <Text style={styles.surahSheetTitle}>Select Surah</Text>
            <Pressable onPress={onClose} style={styles.iconBtnSmall}>
              <Ionicons name="close" size={18} color={palette.textMuted} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={palette.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder="Search surah..."
              placeholderTextColor={palette.textMuted}
            />
          </View>

          <ScrollView
            contentContainerStyle={styles.surahListContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((surah) => {
              const isActive = surah.id === currentSurahId;
              return (
                <Pressable
                  key={surah.id}
                  style={[styles.surahRow, isActive && styles.surahRowActive]}
                  onPress={() => {
                    onSelect(surah);
                    onClose();
                  }}
                >
                  <View style={[styles.surahBadge, isActive && styles.surahBadgeActive]}>
                    <Text style={[styles.surahBadgeText, isActive && styles.surahBadgeTextActive]}>
                      {surah.id}
                    </Text>
                  </View>
                  <View style={styles.surahRowMain}>
                    <Text style={styles.surahName}>{surah.nameSimple}</Text>
                    <Text style={styles.surahMeta}>
                      {surah.translatedName} - {surah.versesCount} ayahs
                    </Text>
                  </View>
                  <Text style={styles.surahNameArabic}>{surah.nameArabic}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface TafsirSheetProps {
  visible: boolean;
  entry?: TafsirEntry;
  ayahNumber: number | null;
  surahName: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

function TafsirSheet({
  visible,
  entry,
  ayahNumber,
  surahName,
  loading,
  error,
  onClose,
}: TafsirSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.tafsirSheetWrap}>
        <View style={styles.tafsirSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.tafsirHeader}>
            <View>
              <Text style={styles.tafsirTitle}>Tafsir</Text>
              <Text style={styles.tafsirMeta}>
                {surahName} - Ayah {ayahNumber ?? "-"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.iconBtnSmall}>
              <Ionicons name="close" size={18} color={palette.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.tafsirBody}
            contentContainerStyle={styles.tafsirBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.centerInline}>
                <ActivityIndicator color={palette.brand} />
                <Text style={styles.tafsirBodyText}>Loading tafsir...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : entry ? (
              <Text style={styles.tafsirBodyText}>{entry.text}</Text>
            ) : (
              <Text style={styles.tafsirBodyText}>No tafsir available for this ayah.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface AyahRowProps {
  ayah: Ayah;
  bookmarked: boolean;
  showTranslation: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  isCurrentAyah: boolean;
  isPlaying: boolean;
  isAudioLoading: boolean;
  onToggleBookmark: (ayah: Ayah) => void;
  onRead: (ayah: Ayah) => void;
  onShare: (ayah: Ayah) => void;
  onPlay: (ayah: Ayah) => void;
  onOpenTafsir: (ayah: Ayah) => void;
}

const AyahRow = memo(function AyahRow({
  ayah,
  bookmarked,
  showTranslation,
  arabicFontSize,
  translationFontSize,
  isCurrentAyah,
  isPlaying,
  isAudioLoading,
  onToggleBookmark,
  onRead,
  onShare,
  onPlay,
  onOpenTafsir,
}: AyahRowProps) {
  return (
    <Pressable
      style={[styles.ayahCard, isCurrentAyah && styles.ayahCardActive]}
      onPress={() => onRead(ayah)}
      onLongPress={() => onOpenTafsir(ayah)}
    >
      <View style={styles.ayahArabicWrap}>
        <Text
          style={[
            styles.ayahArabic,
            { fontSize: arabicFontSize, lineHeight: arabicFontSize * 1.8 },
          ]}
        >
          {ayah.textUthmani}{" "}
          <Text style={styles.ayahNumberInline}>
            {"\uFD3F"}
            {toArabicNumerals(ayah.ayahNumber)}
            {"\uFD3E"}
          </Text>
        </Text>
      </View>

      {showTranslation && ayah.translationText ? (
        <View style={styles.translationWrap}>
          <Text style={[styles.ayahTranslation, { fontSize: translationFontSize }]}>
            {ayah.translationText}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionBar}>
        <View style={[styles.ayahBadge, isCurrentAyah && styles.ayahBadgeActive]}>
          <Text style={[styles.ayahBadgeText, isCurrentAyah && styles.ayahBadgeTextActive]}>
            {ayah.ayahNumber}
          </Text>
        </View>

        <View style={styles.actionBarRight}>
          <Pressable style={styles.actionBtn} onPress={() => onToggleBookmark(ayah)} hitSlop={6}>
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={16}
              color={bookmarked ? palette.accent : palette.textMuted}
            />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => onOpenTafsir(ayah)} hitSlop={6}>
            <Ionicons name="book-outline" size={16} color={palette.textMuted} />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => onShare(ayah)} hitSlop={6}>
            <Ionicons name="share-outline" size={16} color={palette.textMuted} />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => onPlay(ayah)} hitSlop={6}>
            {isAudioLoading ? (
              <ActivityIndicator size="small" color={palette.textMuted} />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={16}
                color={isCurrentAyah ? palette.brand : palette.textMuted}
              />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

interface MushafPageCardProps {
  pageNumber: number;
  ayahs: Ayah[];
  showBismillah: boolean;
  currentAyah: number | null;
  isPlaying: boolean;
  onPressAyah: (ayah: Ayah) => void;
  onLongPressAyah: (ayah: Ayah) => void;
}

function MushafPageCard({
  pageNumber,
  ayahs,
  showBismillah,
  currentAyah,
  isPlaying,
  onPressAyah,
  onLongPressAyah,
}: MushafPageCardProps) {
  return (
    <View style={styles.mushafCard}>
      {showBismillah && <Text style={styles.bismillahText}>{BISMILLAH}</Text>}

      <Text style={styles.mushafText}>
        {ayahs.map((ayah) => {
          const isCurrent = currentAyah === ayah.ayahNumber;
          return (
            <Text
              key={ayah.id}
              onPress={() => onPressAyah(ayah)}
              onLongPress={() => onLongPressAyah(ayah)}
              style={[styles.mushafAyah, isCurrent && isPlaying && styles.mushafAyahActive]}
            >
              {ayah.textUthmani}{" "}
              <Text style={styles.mushafAyahMarker}>
                {"\uFD3F"}
                {toArabicNumerals(ayah.ayahNumber)}
                {"\uFD3E "}
              </Text>
            </Text>
          );
        })}
      </Text>

      <View style={styles.pageBadge}>
        <Text style={styles.pageBadgeText}>Page {pageNumber}</Text>
      </View>
    </View>
  );
}

function ReaderHeader({
  surahName,
  ayahCount,
  mode,
  onBack,
  onOpenSurahPicker,
  onChangeMode,
  onOpenSettings,
}: {
  surahName: string;
  ayahCount: number;
  mode: ReadingMode;
  onBack: () => void;
  onOpenSurahPicker: () => void;
  onChangeMode: (mode: ReadingMode) => void;
  onOpenSettings: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.readerHeader, { paddingTop: insets.top }]}>
      <View style={styles.readerHeaderInner}>
        <Pressable style={styles.headerBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={palette.brand} />
        </Pressable>

        <Pressable style={styles.headerCenter} onPress={onOpenSurahPicker}>
          <Text style={styles.headerSurahName} numberOfLines={1}>
            {surahName}
          </Text>
          <Ionicons name="chevron-down" size={14} color={palette.brand + "99"} />
        </Pressable>

        <Pressable style={styles.headerBtn} onPress={onOpenSettings}>
          <Ionicons name="settings-outline" size={20} color={palette.brand} />
        </Pressable>
      </View>

      <View style={styles.headerMetaRow}>
        <View style={styles.surahInfoChip}>
          <Ionicons name="book-outline" size={12} color={palette.textMuted} />
          <Text style={styles.surahInfoText}>{ayahCount} Ayahs</Text>
        </View>

        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeBtn, mode === "ayah" && styles.modeBtnActive]}
            onPress={() => onChangeMode("ayah")}
          >
            <Ionicons
              name="layers-outline"
              size={14}
              color={mode === "ayah" ? palette.textOnBrand : palette.textMuted}
            />
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === "mushaf" && styles.modeBtnActive]}
            onPress={() => onChangeMode("mushaf")}
          >
            <Ionicons
              name="book-outline"
              size={14}
              color={mode === "mushaf" ? palette.textOnBrand : palette.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function ReaderScreen({ route, navigation }: ReaderProps) {
  const { surahId } = route.params;
  const { ayahs, loading, error } = useChapterVerses(surahId);
  const { chapters } = useQuranCatalog();
  const { entries: tafsirEntries, loading: tafsirLoading, error: tafsirError } = useTafsir(
    surahId,
    16,
  );
  const { bookmarks, preferences, toggleBookmark, recordReadingPosition } = useAppState();

  const [readingMode, setReadingMode] = useState<ReadingMode>("ayah");
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioAyahNumber, setAudioAyahNumber] = useState<number | null>(null);
  const [audioLoadingAyah, setAudioLoadingAyah] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const currentSurah = useMemo(
    () => chapters.find((surah) => surah.id === surahId),
    [chapters, surahId],
  );

  const displayName = currentSurah?.nameSimple ?? route.params.surahName ?? `Surah ${surahId}`;

  const bookmarkSet = useMemo(
    () => new Set(bookmarks.map((bookmark) => `${bookmark.surahId}:${bookmark.ayahNumber}`)),
    [bookmarks],
  );

  const pages = useMemo(() => {
    const grouped = new Map<number, Ayah[]>();
    for (const ayah of ayahs) {
      const existing = grouped.get(ayah.pageNumber) ?? [];
      existing.push(ayah);
      grouped.set(ayah.pageNumber, existing);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNumber, pageAyahs]) => ({ pageNumber, ayahs: pageAyahs }));
  }, [ayahs]);

  const selectedTafsirEntry = useMemo(() => {
    if (tafsirAyah === null) return undefined;
    return tafsirEntries.find((entry) => parseAyahNumber(entry.verseKey) === tafsirAyah);
  }, [tafsirAyah, tafsirEntries]);

  const showBismillah = !SURAHS_WITHOUT_BISMILLAH.includes(surahId);

  const unloadAudio = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.unloadAsync();
    } finally {
      soundRef.current = null;
      setIsAudioPlaying(false);
      setAudioLoadingAyah(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      void unloadAudio();
    };
  }, [unloadAudio]);

  useEffect(() => {
    void unloadAudio();
    setAudioAyahNumber(null);
  }, [surahId, unloadAudio]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsAudioPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setIsAudioPlaying(false);
    }
  }, []);

  const playAyah = useCallback(
    async (ayah: Ayah) => {
      const sameAyah = audioAyahNumber === ayah.ayahNumber;

      if (sameAyah && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsAudioPlaying(false);
          return;
        }
        if (status.isLoaded && !status.isPlaying) {
          await soundRef.current.playAsync();
          setIsAudioPlaying(true);
          return;
        }
      }

      setAudioLoadingAyah(ayah.ayahNumber);
      await unloadAudio();

      const urls = getAyahAudioUrls("Abdul_Basit_Murattal_192kbps", surahId, ayah.ayahNumber);
      let loaded = false;

      for (const url of urls) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: true },
            onPlaybackStatusUpdate,
          );
          soundRef.current = sound;
          setAudioAyahNumber(ayah.ayahNumber);
          setIsAudioPlaying(true);
          loaded = true;
          break;
        } catch {
          // Try next source URL.
        }
      }

      if (!loaded) {
        setAudioAyahNumber(null);
        setIsAudioPlaying(false);
      }

      setAudioLoadingAyah(null);
    },
    [audioAyahNumber, onPlaybackStatusUpdate, surahId, unloadAudio],
  );

  const playPrevious = useCallback(() => {
    if (audioAyahNumber === null) return;
    const index = ayahs.findIndex((ayah) => ayah.ayahNumber === audioAyahNumber);
    if (index <= 0) return;
    const target = ayahs[index - 1];
    if (!target) return;
    void playAyah(target);
  }, [audioAyahNumber, ayahs, playAyah]);

  const playNext = useCallback(() => {
    if (audioAyahNumber === null) return;
    const index = ayahs.findIndex((ayah) => ayah.ayahNumber === audioAyahNumber);
    if (index < 0 || index >= ayahs.length - 1) return;
    const target = ayahs[index + 1];
    if (!target) return;
    void playAyah(target);
  }, [audioAyahNumber, ayahs, playAyah]);

  const handleToggleBookmark = useCallback(
    (ayah: Ayah) => {
      toggleBookmark(
        surahId,
        currentSurah?.nameSimple ?? `Surah ${surahId}`,
        ayah.ayahNumber,
        ayah.textUthmani,
      );
    },
    [currentSurah?.nameSimple, surahId, toggleBookmark],
  );

  const handleRead = useCallback(
    (ayah: Ayah) => {
      recordReadingPosition(surahId, ayah.ayahNumber);
    },
    [recordReadingPosition, surahId],
  );

  const handleShare = useCallback(
    async (ayah: Ayah) => {
      try {
        await Share.share({
          message: `${ayah.textUthmani}\n\n${ayah.translationText}\n\n- ${displayName} ${ayah.verseKey}`,
        });
      } catch {
        // Share sheet dismissed.
      }
    },
    [displayName],
  );

  const openTafsir = useCallback((ayah: Ayah) => {
    setTafsirAyah(ayah.ayahNumber);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item?: Ayah }> }) => {
      const firstAyah = viewableItems[0]?.item;
      if (firstAyah) {
        recordReadingPosition(surahId, firstAyah.ayahNumber);
      }
    },
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Ayah>) => {
      const isCurrentAyah = audioAyahNumber === item.ayahNumber;
      return (
        <AyahRow
          ayah={item}
          bookmarked={bookmarkSet.has(`${surahId}:${item.ayahNumber}`)}
          showTranslation={preferences.showTranslation}
          arabicFontSize={preferences.arabicFontSize}
          translationFontSize={preferences.translationFontSize}
          isCurrentAyah={isCurrentAyah}
          isPlaying={isAudioPlaying && isCurrentAyah}
          isAudioLoading={audioLoadingAyah === item.ayahNumber}
          onToggleBookmark={handleToggleBookmark}
          onRead={handleRead}
          onShare={handleShare}
          onPlay={(ayah) => void playAyah(ayah)}
          onOpenTafsir={openTafsir}
        />
      );
    },
    [
      audioAyahNumber,
      audioLoadingAyah,
      bookmarkSet,
      handleRead,
      handleShare,
      handleToggleBookmark,
      isAudioPlaying,
      openTafsir,
      playAyah,
      preferences.arabicFontSize,
      preferences.showTranslation,
      preferences.translationFontSize,
      surahId,
    ],
  );

  const ayahListHeader = useMemo(
    () =>
      showBismillah ? (
        <View style={styles.bismillahWrap}>
          <Text style={styles.bismillahText}>{BISMILLAH}</Text>
        </View>
      ) : null,
    [showBismillah],
  );

  return (
    <View style={styles.screen}>
      <ReaderHeader
        surahName={displayName}
        ayahCount={ayahs.length}
        mode={readingMode}
        onBack={() => navigation.goBack()}
        onOpenSurahPicker={() => setSurahPickerOpen(true)}
        onChangeMode={setReadingMode}
        onOpenSettings={() => navigation.navigate("Tabs", { screen: "Settings" } as never)}
      />

      {loading && (
        <View style={styles.loadingWrap}>
          <LoadingState label="Loading ayahs..." />
        </View>
      )}

      {!loading && error && <Text style={styles.errorText}>{error}</Text>}

      {!loading &&
        !error &&
        (readingMode === "ayah" ? (
          <FlashList
            data={ayahs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={ayahListHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged.current}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.mushafContent}
            showsVerticalScrollIndicator={false}
          >
            {pages.map((page, index) => {
              const pageHasStart = page.ayahs[0]?.ayahNumber === 1;
              return (
                <MushafPageCard
                  key={page.pageNumber}
                  pageNumber={page.pageNumber}
                  ayahs={page.ayahs}
                  showBismillah={index === 0 && showBismillah && pageHasStart}
                  currentAyah={audioAyahNumber}
                  isPlaying={isAudioPlaying}
                  onPressAyah={(ayah) => {
                    handleRead(ayah);
                    void playAyah(ayah);
                  }}
                  onLongPressAyah={openTafsir}
                />
              );
            })}
            <View style={{ height: 130 }} />
          </ScrollView>
        ))}

      {audioAyahNumber !== null && (
        <View style={styles.audioBar}>
          <View style={styles.audioBarMain}>
            <Text style={styles.audioBarTitle}>{displayName}</Text>
            <Text style={styles.audioBarMeta}>Ayah {audioAyahNumber}</Text>
          </View>

          <View style={styles.audioBarActions}>
            <Pressable style={styles.audioBtn} onPress={playPrevious}>
              <Ionicons name="play-skip-back" size={16} color={palette.textPrimary} />
            </Pressable>
            <Pressable
              style={[styles.audioBtn, styles.audioBtnPrimary]}
              onPress={() => {
                const ayah = ayahs.find((a) => a.ayahNumber === audioAyahNumber);
                if (ayah) {
                  void playAyah(ayah);
                }
              }}
            >
              <Ionicons
                name={isAudioPlaying ? "pause" : "play"}
                size={16}
                color={palette.textOnBrand}
              />
            </Pressable>
            <Pressable style={styles.audioBtn} onPress={playNext}>
              <Ionicons name="play-skip-forward" size={16} color={palette.textPrimary} />
            </Pressable>
          </View>
        </View>
      )}

      <SurahPickerSheet
        visible={surahPickerOpen}
        chapters={chapters}
        currentSurahId={surahId}
        onClose={() => setSurahPickerOpen(false)}
        onSelect={(surah) => {
          navigation.replace("Reader", {
            surahId: surah.id,
            surahName: surah.nameSimple,
          });
        }}
      />

      <TafsirSheet
        visible={tafsirAyah !== null}
        ayahNumber={tafsirAyah}
        surahName={displayName}
        entry={selectedTafsirEntry}
        loading={tafsirLoading}
        error={tafsirError}
        onClose={() => setTafsirAyah(null)}
      />
    </View>
  );
}

const styles: any = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  readerHeader: {
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.border + "80",
  },
  readerHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginHorizontal: spacing.sm,
  },
  headerSurahName: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.brand,
    fontFamily: fonts.amiri,
    maxWidth: "85%",
  },
  headerMetaRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  surahInfoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  surahInfoText: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.textMuted,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: 999,
    padding: 3,
    gap: 4,
  },
  modeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnActive: {
    backgroundColor: palette.brand,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay,
  },
  surahSheetWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  surahSheet: {
    maxHeight: "75%",
    borderRadius: radii.xl,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: "hidden",
    ...shadows.lg,
  },
  surahSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  surahSheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.textPrimary,
  },
  iconBtnSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
  },
  searchInput: {
    flex: 1,
    color: palette.textPrimary,
    paddingVertical: 10,
  },
  surahListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  surahRowActive: {
    borderColor: palette.brand + "80",
    backgroundColor: palette.brand + "10",
  },
  surahBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
  surahBadgeActive: {
    backgroundColor: palette.brand,
  },
  surahBadgeText: {
    fontWeight: "700",
    color: palette.brand,
    fontSize: 12,
  },
  surahBadgeTextActive: {
    color: palette.textOnBrand,
  },
  surahRowMain: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  surahName: {
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  surahMeta: {
    color: palette.textMuted,
    fontSize: 11,
  },
  surahNameArabic: {
    color: palette.textPrimary,
    fontFamily: fonts.amiri,
    fontSize: 18,
  },
  tafsirSheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  tafsirSheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    paddingBottom: spacing.lg,
    maxHeight: "70%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: palette.border,
  },
  tafsirHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  tafsirTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.textPrimary,
  },
  tafsirMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  tafsirBody: {
    maxHeight: "100%",
  },
  tafsirBodyContent: {
    padding: spacing.lg,
  },
  tafsirBodyText: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 24,
  },
  centerInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bismillahWrap: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  bismillahText: {
    fontFamily: fonts.amiriQuran,
    fontSize: 28,
    color: palette.brand + "CC",
    textAlign: "center",
    lineHeight: 54,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 130,
  },
  loadingWrap: {
    paddingVertical: spacing.xxxl,
  },
  ayahCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  ayahCardActive: {
    borderColor: palette.brand + "60",
    backgroundColor: palette.brand + "08",
  },
  ayahArabicWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  ayahArabic: {
    color: palette.textPrimary,
    textAlign: "right",
    writingDirection: "rtl",
    fontFamily: fonts.amiriQuran,
  },
  ayahNumberInline: {
    fontSize: 16,
    color: palette.brand,
    fontFamily: fonts.amiri,
  },
  translationWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border + "70",
    marginHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  ayahTranslation: {
    color: palette.textSecondary,
    lineHeight: 24,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border + "50",
    backgroundColor: palette.surfaceRaised + "60",
  },
  actionBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ayahBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
  },
  ayahBadgeActive: {
    backgroundColor: palette.brand,
  },
  ayahBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.brand,
  },
  ayahBadgeTextActive: {
    color: palette.textOnBrand,
  },
  mushafContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  mushafCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  mushafText: {
    color: palette.textPrimary,
    fontFamily: fonts.uthmani,
    fontSize: 24,
    lineHeight: 52,
    writingDirection: "rtl",
    textAlign: "right",
  },
  mushafAyah: {
    color: palette.textPrimary,
  },
  mushafAyahActive: {
    color: palette.brand,
    backgroundColor: palette.brand + "18",
  },
  mushafAyahMarker: {
    fontFamily: fonts.amiri,
    fontSize: 16,
    color: palette.brand,
  },
  pageBadge: {
    alignSelf: "center",
    marginTop: spacing.lg,
    borderRadius: 999,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  pageBadgeText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  audioBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.lg,
  },
  audioBarMain: {
    flex: 1,
  },
  audioBarTitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  audioBarMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  audioBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  audioBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
  },
  audioBtnPrimary: {
    backgroundColor: palette.brand,
  },
  errorText: {
    color: palette.danger,
    fontWeight: "600",
    textAlign: "center",
    padding: spacing.xl,
  },
});
