import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import { useChapters } from "../../lib/api/chapters";
import { useVersesByChapter } from "../../lib/api/verses";
import { saveLastRead } from "../../lib/db/storage";
import type { Verse } from "../../lib/api/types";
import { ChevronLeftIcon } from "../(tabs)/tab-icons";

// Bismillah SVG text fallback
const BISMILLAH_TEXT =
  "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650";

export default function SurahReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, language } = useTranslation();
  const chapterId = Number(surahId);

  const { data: chapters } = useChapters(language);
  const chapter = chapters?.find((ch) => ch.id === chapterId);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useVersesByChapter(chapterId, {
      translations: language === "ar" ? undefined : "85",
      fields: "text_uthmani",
      language,
    });

  const allVerses = data?.pages.flatMap((page) => page.verses) ?? [];

  // Track reading position
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: Verse }> }) => {
      const lastVisible = viewableItems[viewableItems.length - 1];
      if (lastVisible?.item) {
        saveLastRead({
          chapterId,
          verseNumber: lastVisible.item.verse_number,
          readingMode: "translation",
        });
      }
    },
    [chapterId],
  );

  const renderVerse = ({ item }: { item: Verse }) => {
    const translationText =
      item.translations && item.translations.length > 0
        ? item.translations[0].text.replace(/<[^>]*>/g, "")
        : null;

    return (
      <View
        style={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        {/* Verse number badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: c.primary,
              }}
            >
              {item.verse_number}
            </Text>
          </View>
        </View>

        {/* Arabic text */}
        <Text
          style={{
            fontSize: 28,
            lineHeight: 52,
            color: c.foreground,
            textAlign: "right",
            fontFamily: "ScheherazadeNew",
            marginBottom: translationText ? 12 : 0,
          }}
        >
          {item.text_uthmani}
        </Text>

        {/* Translation */}
        {translationText && (
          <Text
            style={{
              fontSize: 15,
              lineHeight: 24,
              color: c.secondaryText,
            }}
          >
            {translationText}
          </Text>
        )}
      </View>
    );
  };

  const ListHeader = () => {
    if (!chapter) return null;

    return (
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <Text
          style={{
            fontSize: 30,
            color: c.foreground,
            fontFamily: "ScheherazadeNew",
            marginBottom: 4,
          }}
        >
          {chapter.name_arabic}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: c.foreground,
          }}
        >
          {chapter.name_simple}
        </Text>
        <Text style={{ fontSize: 13, color: c.secondaryText, marginTop: 4 }}>
          {chapter.translated_name.name} &middot; {chapter.verses_count}{" "}
          {t("ayahs")} &middot;{" "}
          {chapter.revelation_place === "makkah" ? t("meccan") : t("medinan")}
        </Text>

        {/* Bismillah */}
        {chapter.bismillah_pre && (
          <Text
            style={{
              fontSize: 26,
              color: c.primary,
              fontFamily: "ScheherazadeNew",
              marginTop: 20,
              textAlign: "center",
              lineHeight: 44,
            }}
          >
            {BISMILLAH_TEXT}
          </Text>
        )}

        <View
          style={{
            height: 1,
            backgroundColor: c.border,
            width: "100%",
            marginTop: 16,
          }}
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header bar */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: c.background,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeftIcon color={c.foreground} size={24} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: c.foreground,
            }}
          >
            {chapter?.name_simple ?? t("surah")}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={allVerses}
          renderItem={renderVerse}
          keyExtractor={(item) => item.verse_key}
          ListHeaderComponent={ListHeader}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={c.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
