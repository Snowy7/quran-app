import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  UIManager,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import { useChapters } from "../../lib/api/chapters";
import { getDefaultTafsirId, useTafsirByChapter } from "../../lib/api/tafsirs";
import { useVersesByChapter } from "../../lib/api/verses";
import { saveLastRead } from "../../lib/db/storage";
import type { Chapter, Verse, Word } from "../../lib/api/types";
import {
  getPageFontFamily,
  prefetchPageFonts,
  usePageFont,
} from "../../lib/fonts/mushaf-font-loader";
import { FadeInView } from "../../components/fade-in-view";
import { ArrowLeftIcon, ChevronDownIcon } from "../../components/icons/tab-icons";

const BISMILLAH_TEXT =
  "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0640\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";
const WORD_FIELDS =
  "code_v2,text_uthmani,text,code_v1,position,page_number,line_number,v2_page,translation,transliteration";

type ReadingMode = "translation" | "word-by-word" | "mushaf" | "tafsir";
type VerseItem = Verse;
type MushafWord = {
  code_v2?: string;
  text_uthmani?: string;
  text?: string;
};
type MushafPage = {
  key: string;
  pageNumber: number;
  lines: Array<{
    key: string;
    lineNumber: number;
    words: MushafWord[];
    verseKeys: string[];
  }>;
};

const CENTER_ALIGNED_PAGES = [1, 2];

const CENTER_ALIGNED_PAGE_LINES: Record<number, number[]> = {
  255: [2],
  528: [9],
  534: [6],
  545: [6],
  586: [1],
  593: [2],
  594: [5],
  600: [10],
  602: [5, 15],
  603: [10, 15],
  604: [4, 9, 14, 15],
};

function isCenterAlignedLine(pageNumber: number, lineNumber: number): boolean {
  const centered = CENTER_ALIGNED_PAGE_LINES[pageNumber] ?? [];
  return CENTER_ALIGNED_PAGES.includes(pageNumber) || centered.includes(lineNumber);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getWebContentFontScale(viewportWidth: number): number {
  // Mirrors web content-width scaling tiers: 100/90/80/70 => 1.15/1.08/1.0/0.95
  if (viewportWidth >= 1400) return 1.15;
  if (viewportWidth >= 1100) return 1.08;
  if (viewportWidth >= 960) return 1.0;
  return 0.95;
}

function stripHtml(input: string | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

function withArabicWordSpacing(input: string | undefined): string {
  if (!input) return "";
  // Keep natural wrapping while slightly widening inter-word spacing.
  return input.replace(/\s+/g, " \u2009");
}

function normalizeArabicDigits(input: string) {
  const arabicDigits =
    "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";
  return input.replace(/[\u0660-\u0669]/g, (digit) =>
    String(arabicDigits.indexOf(digit)),
  );
}

function MushafPageBlock({
  item,
  colors: c,
  t,
  mushafFontSize,
  mushafLineHeight,
  readerViewportWidth,
  chapterId,
  singlePageChapter,
}: {
  item: MushafPage;
  colors: ReturnType<typeof useColors>;
  t: ReturnType<typeof useTranslation>["t"];
  mushafFontSize: number;
  mushafLineHeight: number;
  readerViewportWidth: number;
  chapterId: number;
  singlePageChapter: boolean;
}) {
  const fontLoaded = usePageFont(item.pageNumber);
  const pageFamily = getPageFontFamily(item.pageNumber);

  return (
    <View
      style={{
        maxWidth: readerViewportWidth,
        alignSelf: "center",
        marginHorizontal: 0,
        marginBottom: 6,
        paddingHorizontal: 0,
        paddingVertical: 8,
        alignItems: "stretch",
      }}
    >
      <View
        style={{
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: c.secondaryText,
            fontWeight: "500",
            letterSpacing: 1.2,
          }}
        >
          {t("page")} {item.pageNumber}
        </Text>
      </View>

      <View
        style={{
          maxWidth: readerViewportWidth,
          alignSelf: "center",
          alignItems: "flex-end",
        }}
      >
        {item.lines.map((line) => {
          const text = fontLoaded
            ? line.words
                .map((word) => word.code_v2 || word.text_uthmani || word.text || "")
                .join("")
            : line.words
                .map((word) => word.text_uthmani || word.text || word.code_v2 || "")
                .join(" ");
          const boostedIntroLine =
            chapterId === 2 && item.pageNumber <= 2 && line.lineNumber <= 3;
          const lineScale = singlePageChapter
            ? 1.18
            : boostedIntroLine
              ? 1.1
              : 1;
          const lineFontSize = Math.round(mushafFontSize * lineScale);
          const lineHeight = Math.round(mushafLineHeight * lineScale);

          return (
            <Text
              key={line.key}
              style={{
                fontSize: lineFontSize,
                lineHeight,
                color: c.foreground,
                textAlign: isCenterAlignedLine(item.pageNumber, line.lineNumber)
                  ? "center"
                  : "right",
                writingDirection: "rtl",
                fontFamily: fontLoaded ? pageFamily : "ScheherazadeNew",
                letterSpacing: fontLoaded ? 0.12 : 0,
                maxWidth: readerViewportWidth,
                alignSelf: isCenterAlignedLine(item.pageNumber, line.lineNumber)
                  ? "center"
                  : "flex-end",
              }}
            >
              {text}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

export default function SurahReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string | string[] }>();
  const resolvedSurahId = Array.isArray(surahId) ? surahId[0] : surahId;
  const chapterId = Number(resolvedSurahId);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const c = useColors();
  const { t, language } = useTranslation();
  const readerViewportWidth = Math.min(width * 0.96, 980);
  const webFontScale = getWebContentFontScale(width);
  const mushafFontSize = clamp(
    readerViewportWidth * 0.049,
    21,
    Math.round(38 * webFontScale),
  );
  const mushafLineHeight = Math.round(mushafFontSize * 1.58);
  const verseArabicFontSize = clamp(Math.round(28 * webFontScale), 26, 36);
  const verseArabicLineHeight = Math.round(verseArabicFontSize * 2.2);
  const verseTranslationFontSize = clamp(Math.round(16 * webFontScale), 14, 20);
  const verseTranslationLineHeight = Math.round(verseTranslationFontSize * 1.9);
  const endPullThreshold = 110;
  const singlePageScrollPad = Math.max(120, Math.round(height * 0.45));

  const [readingMode, setReadingMode] = useState<ReadingMode>("translation");
  const [surahPickerOpen, setSurahPickerOpen] = useState(false);
  const [surahQuery, setSurahQuery] = useState("");
  const [endPullProgress, setEndPullProgress] = useState(0);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
  const headerTitleMaxWidth = Math.max(180, width - 140);
  const endPullProgressRef = useRef(0);
  const isNavigatingNextRef = useRef(false);

  const isMushafMode = readingMode === "mushaf";
  const isWordMode = readingMode === "word-by-word";
  const showTranslation = readingMode === "translation";
  const showTafsir = readingMode === "tafsir";
  const loadWords = isMushafMode || isWordMode;

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const { data: chapters } = useChapters(language);
  const chapter = chapters?.find((ch) => ch.id === chapterId);
  const nextChapterId = useMemo(() => {
    if (!chapters || chapters.length === 0) {
      return chapterId < 114 ? chapterId + 1 : null;
    }
    const idx = chapters.findIndex((ch) => ch.id === chapterId);
    if (idx >= 0 && idx < chapters.length - 1) return chapters[idx + 1].id;
    return chapterId < 114 ? chapterId + 1 : null;
  }, [chapters, chapterId]);
  const singlePageChapter = !!(
    chapter?.pages &&
    chapter.pages.length >= 2 &&
    chapter.pages[0] === chapter.pages[1]
  );
  const filteredChapters = useMemo(() => {
    if (!chapters) return [];
    const query = normalizeArabicDigits(surahQuery.trim().toLowerCase());
    if (!query) return chapters;
    return chapters.filter((entry) => {
      const id = String(entry.id);
      const simple = entry.name_simple.toLowerCase();
      const translated = entry.translated_name.name.toLowerCase();
      const arabic = entry.name_arabic;
      return (
        id.includes(query) ||
        simple.includes(query) ||
        translated.includes(query) ||
        arabic.includes(query)
      );
    });
  }, [chapters, surahQuery]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVersesByChapter(chapterId, {
    translations: showTranslation && language !== "ar" ? "85" : undefined,
    fields: "text_uthmani",
    language,
    words: loadWords,
    wordFields: loadWords ? WORD_FIELDS : undefined,
  });

  const tafsirId = getDefaultTafsirId(language);
  const {
    data: tafsirData,
    fetchNextPage: fetchNextTafsirPage,
    hasNextPage: hasNextTafsirPage,
    isFetchingNextPage: isFetchingNextTafsirPage,
  } = useTafsirByChapter(showTafsir ? tafsirId : undefined, chapterId);

  const verses = useMemo(() => data?.pages.flatMap((page) => page.verses) ?? [], [data]);

  const tafsirMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const page of tafsirData?.pages ?? []) {
      for (const item of page.tafsirs) {
        map.set(item.verse_key, stripHtml(item.text));
      }
    }
    return map;
  }, [tafsirData]);

  const mushafPages = useMemo<MushafPage[]>(() => {
    if (!isMushafMode) return [];

    const grouped = new Map<
      number,
      Map<number, { words: MushafWord[]; verseKeys: Set<string> }>
    >();

    for (const verse of verses) {
      const words = (verse.words ?? []).filter(
        (w) => !!(w.text_uthmani || w.text || w.code_v2),
      );

      if (words.length === 0) {
        const pageNumber = verse.page_number || 1;
        const lineNumber = verse.verse_number;
        if (!grouped.has(pageNumber)) grouped.set(pageNumber, new Map());
        const pageLines = grouped.get(pageNumber)!;
        if (!pageLines.has(lineNumber)) {
          pageLines.set(lineNumber, { words: [], verseKeys: new Set<string>() });
        }
        const line = pageLines.get(lineNumber)!;
        if (verse.text_uthmani) line.words.push({ text_uthmani: verse.text_uthmani });
        line.verseKeys.add(verse.verse_key);
        continue;
      }

      for (const word of words) {
        const pageNumber = word.page_number || verse.page_number || 1;
        const lineNumber = word.line_number || 1;
        if (!grouped.has(pageNumber)) grouped.set(pageNumber, new Map());
        const pageLines = grouped.get(pageNumber)!;
        if (!pageLines.has(lineNumber)) {
          pageLines.set(lineNumber, { words: [], verseKeys: new Set<string>() });
        }
        const line = pageLines.get(lineNumber)!;
        line.words.push({
          code_v2: word.code_v2,
          text_uthmani: word.text_uthmani,
          text: word.text,
        });
        line.verseKeys.add(verse.verse_key);
      }
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNumber, linesMap]) => ({
        key: `page-${pageNumber}`,
        pageNumber,
        lines: Array.from(linesMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([lineNumber, line]) => ({
            key: `page-${pageNumber}-line-${lineNumber}`,
            lineNumber,
            words: line.words,
            verseKeys: Array.from(line.verseKeys),
          })),
      }));
  }, [isMushafMode, verses]);
  const isSingleMushafPage = isMushafMode && mushafPages.length === 1;

  useEffect(() => {
    if (!isMushafMode || mushafPages.length === 0) return;
    prefetchPageFonts(mushafPages.slice(0, 3).map((p) => p.pageNumber));
  }, [isMushafMode, mushafPages]);

  const resetEndPullProgress = useCallback(() => {
    endPullProgressRef.current = 0;
    setEndPullProgress(0);
  }, []);

  const goToNextSurah = useCallback(() => {
    if (!nextChapterId || isNavigatingNextRef.current) return;
    isNavigatingNextRef.current = true;
    router.replace(`/quran/${nextChapterId}`);
  }, [nextChapterId]);

  const canAdvanceToNextSurah =
    !hasNextPage &&
    (!showTafsir || !hasNextTafsirPage) &&
    !isFetchingNextPage &&
    (!showTafsir || !isFetchingNextTafsirPage) &&
    !!nextChapterId;

  const registerEndPull = useCallback(
    (delta: number) => {
      if (!canAdvanceToNextSurah) return;
      const next = Math.min(endPullThreshold + 40, endPullProgressRef.current + delta);
      endPullProgressRef.current = next;
      setEndPullProgress(next);
      if (next >= endPullThreshold) {
        goToNextSurah();
      }
    },
    [canAdvanceToNextSurah, endPullThreshold, goToNextSurah],
  );

  const onReaderScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!canAdvanceToNextSurah) return;
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromEnd =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromEnd > 32 || contentOffset.y < 48) {
        if (endPullProgressRef.current > 0 && distanceFromEnd > 120) {
          resetEndPullProgress();
        }
        return;
      }

      const overscroll = Math.max(0, -distanceFromEnd);
      if (overscroll > endPullProgressRef.current) {
        endPullProgressRef.current = overscroll;
        setEndPullProgress(overscroll);
      }
      if (overscroll >= endPullThreshold) {
        goToNextSurah();
      }
    },
    [canAdvanceToNextSurah, endPullThreshold, goToNextSurah, resetEndPullProgress],
  );

  useEffect(() => {
    resetEndPullProgress();
    isNavigatingNextRef.current = false;
  }, [chapterId, readingMode, resetEndPullProgress]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (isMushafMode) {
        const mushafItems = viewableItems as Array<
          ViewToken & { item?: MushafPage }
        >;
        const visiblePages = mushafItems
          .map((token) => token.item?.pageNumber)
          .filter((page): page is number => typeof page === "number");
        if (visiblePages.length > 0) {
          const focus = visiblePages[0];
          prefetchPageFonts([
            ...visiblePages,
            focus - 1,
            focus + 1,
            focus + 2,
          ]);
        }
        return;
      }

      const items = viewableItems as Array<ViewToken & { item?: VerseItem }>;
      const lastVisible = items[items.length - 1];
      if (!lastVisible?.item) return;

      saveLastRead({
        chapterId,
        verseNumber: lastVisible.item.verse_number,
        readingMode,
      }).catch(() => {});
    },
    [chapterId, readingMode, isMushafMode],
  );

  const renderWordRow = useCallback(
    (words: Word[]) => {
      const contentWords = words.filter(
        (word) => word.char_type_name === "word" || word.char_type_name === "end",
      );
      return (
        <View
          style={{
            flexDirection: "row-reverse",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignSelf: "stretch",
            width: "100%",
            gap: 8,
          }}
        >
          {contentWords.map((word) => (
            <View
              key={word.id}
              style={{
                minWidth: 70,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.card,
                paddingVertical: 8,
                paddingHorizontal: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  lineHeight: 32,
                  color: c.foreground,
                  textAlign: "center",
                  writingDirection: "rtl",
                  fontFamily: "UthmanicHafs",
                }}
              >
                {word.text_uthmani || word.text || word.code_v2}
              </Text>
              {word.translation?.text ? (
                <Text
                  style={{
                    fontSize: 10,
                    color: c.secondaryText,
                    textAlign: "center",
                    writingDirection: "ltr",
                    marginTop: 4,
                    maxWidth: 90,
                  }}
                >
                  {word.translation.text}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      );
    },
    [c],
  );

  const renderVerse = useCallback(
    ({ item }: { item: VerseItem }) => {
      const translationText =
        item.translations && item.translations.length > 0
          ? stripHtml(item.translations[0].text)
          : null;
      const tafsirText = tafsirMap.get(item.verse_key);

      return (
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderBottomWidth: 1,
            borderBottomColor: c.border + "4D",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 16,
                backgroundColor: c.primary + "14",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: c.primary,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {item.verse_number}
              </Text>
            </View>
          </View>

          {isWordMode ? (
            renderWordRow(item.words ?? [])
          ) : (
            <Text
              style={{
                fontSize: verseArabicFontSize,
                lineHeight: verseArabicLineHeight,
                color: c.foreground,
                textAlign: "right",
                writingDirection: "rtl",
                fontFamily: "ScheherazadeNew",
                alignSelf: "stretch",
                width: "100%",
                marginBottom: showTranslation && translationText ? 12 : 0,
              }}
            >
              {withArabicWordSpacing(item.text_uthmani)}
            </Text>
          )}

          {showTranslation && translationText ? (
            <Text
              style={{
                fontSize: verseTranslationFontSize,
                lineHeight: verseTranslationLineHeight,
                color: c.secondaryText,
                textAlign: "left",
                writingDirection: "ltr",
                alignSelf: "stretch",
                width: "100%",
              }}
            >
              {translationText}
            </Text>
          ) : null}

          {showTafsir && tafsirText ? (
            <Text
              style={{
                fontSize: 14,
                lineHeight: 24,
                color: c.secondaryText,
                marginTop: 12,
                textAlign: "left",
                writingDirection: "ltr",
                alignSelf: "stretch",
                width: "100%",
              }}
            >
              {tafsirText}
            </Text>
          ) : null}
        </View>
      );
    },
    [
      c,
      isWordMode,
      renderWordRow,
      showTranslation,
      showTafsir,
      tafsirMap,
      verseArabicFontSize,
      verseArabicLineHeight,
      verseTranslationFontSize,
      verseTranslationLineHeight,
    ],
  );

  const renderMushafPage = useCallback(
    ({ item }: { item: MushafPage }) => {
      return (
        <MushafPageBlock
          item={item}
          colors={c}
          t={t}
          mushafFontSize={mushafFontSize}
          mushafLineHeight={mushafLineHeight}
          readerViewportWidth={readerViewportWidth}
          chapterId={chapterId}
          singlePageChapter={singlePageChapter}
        />
      );
    },
    [c, mushafFontSize, mushafLineHeight, readerViewportWidth, t, chapterId, singlePageChapter],
  );

  if (!Number.isFinite(chapterId) || chapterId <= 0) {
    return (
      <View
        style={{
          flex: 1,
          direction: "ltr",
          backgroundColor: c.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: c.error, fontSize: 15 }}>{t("surahNotFound")}</Text>
      </View>
    );
  }

  const modeTabs: Array<{ key: ReadingMode; label: string }> = [
    { key: "translation", label: t("translation") },
    { key: "word-by-word", label: t("wordByWord") },
    { key: "mushaf", label: t("mushaf") },
    { key: "tafsir", label: t("tafseer") },
  ];

  const handleReadingModeChange = useCallback(
    (mode: ReadingMode) => {
      if (mode === readingMode) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setReadingMode(mode);
    },
    [readingMode],
  );

  return (
    <View style={{ flex: 1, direction: "ltr", backgroundColor: c.background }}>
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: c.background + "F0",
          borderBottomWidth: 1,
          borderBottomColor: c.border + "40",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            height: 56,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeftIcon color={c.foreground} size={20} />
          </Pressable>

          <Pressable
            onPress={() => setSurahPickerOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              maxWidth: headerTitleMaxWidth,
            }}
          >
            <View style={{ alignItems: "center", minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 19,
                  fontFamily: "SurahNames",
                  color: c.foreground,
                  lineHeight: 24,
                }}
              >
                {String(chapterId).padStart(3, "0")}
              </Text>
              <Text
                style={{ fontSize: 11, color: c.secondaryText, maxWidth: headerTitleMaxWidth - 24 }}
                numberOfLines={1}
              >
                {chapter?.name_simple ?? t("surah")}
              </Text>
            </View>
            <ChevronDownIcon color={c.secondaryText} size={14} />
          </Pressable>

          <View style={{ width: 40, height: 40 }} />
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: c.surface + "80",
            borderRadius: 12,
            padding: 3,
            marginHorizontal: 16,
            marginBottom: 10,
          }}
        >
          {modeTabs.map((tab) => {
            const isActive = readingMode === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleReadingModeChange(tab.key)}
                style={{
                  flex: 1,
                  borderRadius: 9,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: isActive ? c.card : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? c.foreground : c.secondaryText,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FadeInView
        key={`${chapterId}-${readingMode}`}
        duration={220}
        slideUp={6}
        style={{ flex: 1, direction: "ltr" }}
      >
        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        ) : isError ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: c.error, fontSize: 14 }}>{t("failedToLoadVerses")}</Text>
          </View>
        ) : isMushafMode ? (
          <FlatList<MushafPage>
            data={mushafPages}
            style={{ direction: "ltr" }}
            renderItem={renderMushafPage}
            keyExtractor={(item) => item.key}
            bounces
            alwaysBounceVertical
            overScrollMode="always"
            onEndReached={() => {
              if (hasNextPage) {
                fetchNextPage();
                return;
              }
              registerEndPull(34);
            }}
            onEndReachedThreshold={0.5}
            onScroll={onReaderScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfigRef.current}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: isSingleMushafPage ? singlePageScrollPad : 24,
              paddingTop: 8,
              alignItems: "center",
              flexGrow: isSingleMushafPage ? 1 : 0,
              justifyContent: isSingleMushafPage ? "center" : "flex-start",
            }}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <ActivityIndicator color={c.primary} />
                </View>
              ) : canAdvanceToNextSurah ? (
                <View style={{ paddingBottom: 18, alignItems: "center" }}>
                  <Text style={{ color: c.secondaryText, fontSize: 11 }}>
                    Keep scrolling for next surah ({Math.round(
                      clamp((endPullProgress / endPullThreshold) * 100, 0, 100),
                    )}
                    %)
                  </Text>
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList<VerseItem>
            data={verses}
            style={{ direction: "ltr" }}
            renderItem={renderVerse}
            keyExtractor={(item) => item.verse_key}
            onEndReached={() => {
              if (hasNextPage) fetchNextPage();
              if (showTafsir && hasNextTafsirPage) fetchNextTafsirPage();
              if (!hasNextPage && (!showTafsir || !hasNextTafsirPage)) {
                registerEndPull(34);
              }
            }}
            onEndReachedThreshold={0.5}
            onScroll={onReaderScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfigRef.current}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 36 }}
            ListHeaderComponent={
              chapter ? (
                <View>
                  <View
                    style={{
                      marginHorizontal: 16,
                      marginTop: 12,
                      marginBottom: 8,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: c.border + "60",
                      paddingVertical: 22,
                      alignItems: "center",
                      backgroundColor: c.primary + "0D",
                    }}
                  >
                    <Text style={{ fontSize: 33, color: c.foreground, fontFamily: "SurahNames", lineHeight: 44 }}>
                      {String(chapter.id).padStart(3, "0")}
                    </Text>
                    <Text style={{ fontSize: 14, color: c.secondaryText, marginTop: 2 }}>{chapter.name_simple}</Text>
                  </View>

                  {chapter.bismillah_pre ? (
                    <Text
                      style={{
                        fontSize: 30,
                        color: c.primary,
                        fontFamily: "UthmanicHafs",
                        textAlign: "center",
                        writingDirection: "rtl",
                        lineHeight: 50,
                        paddingHorizontal: 20,
                        marginBottom: 6,
                      }}
                    >
                      {BISMILLAH_TEXT}
                    </Text>
                  ) : null}
                </View>
              ) : null
            }
            ListFooterComponent={
              isFetchingNextPage || (showTafsir && isFetchingNextTafsirPage) ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <ActivityIndicator color={c.primary} />
                </View>
              ) : canAdvanceToNextSurah ? (
                <View style={{ paddingBottom: 18, alignItems: "center" }}>
                  <Text style={{ color: c.secondaryText, fontSize: 11 }}>
                    Keep scrolling for next surah ({Math.round(
                      clamp((endPullProgress / endPullThreshold) * 100, 0, 100),
                    )}
                    %)
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </FadeInView>

      <SurahPickerModal
        visible={surahPickerOpen}
        chapters={filteredChapters}
        currentChapterId={chapterId}
        searchPlaceholder={t("searchSurahs")}
        query={surahQuery}
        onChangeQuery={setSurahQuery}
        onClose={() => {
          setSurahPickerOpen(false);
          setSurahQuery("");
        }}
        onSelect={(nextId) => {
          if (nextId === chapterId) {
            setSurahPickerOpen(false);
            setSurahQuery("");
            return;
          }
          setSurahPickerOpen(false);
          setSurahQuery("");
          router.replace(`/quran/${nextId}`);
        }}
        colors={c}
      />
    </View>
  );
}

function SurahPickerModal({
  visible,
  chapters,
  currentChapterId,
  searchPlaceholder,
  query,
  onChangeQuery,
  onClose,
  onSelect,
  colors,
}: {
  visible: boolean;
  chapters: Chapter[];
  currentChapterId: number;
  searchPlaceholder: string;
  query: string;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onSelect: (chapterId: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          direction: "ltr",
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        <View
          style={{
            maxHeight: "78%",
            direction: "ltr",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border + "80",
            backgroundColor: colors.card,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TextInput
              value={query}
              onChangeText={onChangeQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.muted}
              autoFocus
              style={{
                height: 44,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.foreground,
                paddingHorizontal: 14,
                backgroundColor: colors.surface + "60",
                fontSize: 15,
                textAlign: "left",
                writingDirection: "ltr",
              }}
            />
          </View>

          <FlatList
            data={chapters}
            keyExtractor={(item) => String(item.id)}
            initialNumToRender={30}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isCurrent = item.id === currentChapterId;
              return (
                <Pressable
                  onPress={() => onSelect(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: isCurrent
                      ? colors.primary + "14"
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      width: 28,
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: "500",
                      color: colors.secondaryText,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {item.id}
                  </Text>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isCurrent ? colors.primary : colors.foreground,
                        textAlign: "left",
                        writingDirection: "ltr",
                      }}
                      numberOfLines={1}
                    >
                      {item.name_simple}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 18,
                      color: colors.foreground + "B3",
                      fontFamily: "SurahNames",
                    }}
                  >
                    {String(item.id).padStart(3, "0")}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}


