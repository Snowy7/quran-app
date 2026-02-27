import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import { useChapters } from "../../lib/api/chapters";
import type { Chapter } from "../../lib/api/types";

function padSurahNumber(id: number): string {
  return String(id).padStart(3, "0");
}

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, language } = useTranslation();
  const { data: chapters, isLoading } = useChapters(language);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChapters = useMemo(() => {
    if (!chapters) return [];
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        ch.translated_name.name.toLowerCase().includes(q) ||
        String(ch.id).includes(q),
    );
  }, [chapters, searchQuery]);

  const renderChapter = ({ item }: { item: Chapter }) => {
    const isRTL = language === "ar";

    return (
      <Pressable
        onPress={() => router.push(`/quran/${item.id}`)}
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
          backgroundColor: c.card,
        }}
      >
        {/* Number */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: c.surface,
            alignItems: "center",
            justifyContent: "center",
            marginRight: isRTL ? 0 : 14,
            marginLeft: isRTL ? 14 : 0,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: c.primary,
            }}
          >
            {item.id}
          </Text>
        </View>

        {/* Name & Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: c.foreground,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {item.name_simple}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: c.secondaryText,
              marginTop: 2,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {item.translated_name.name} &middot;{" "}
            {item.verses_count} {t("ayahs")} &middot;{" "}
            {item.revelation_place === "makkah" ? t("meccan") : t("medinan")}
          </Text>
        </View>

        {/* Arabic name */}
        <Text
          style={{
            fontSize: 22,
            color: c.foreground,
            fontFamily: "ScheherazadeNew",
            marginLeft: isRTL ? 0 : 8,
            marginRight: isRTL ? 8 : 0,
          }}
        >
          {item.name_arabic}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 8,
          backgroundColor: c.background,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: c.foreground,
            marginBottom: 12,
          }}
        >
          {t("quran")}
        </Text>

        {/* Search Input */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("searchSurahs")}
          placeholderTextColor={c.muted}
          style={{
            height: 44,
            borderRadius: 14,
            backgroundColor: c.card,
            paddingHorizontal: 16,
            fontSize: 15,
            color: c.foreground,
            borderWidth: 1,
            borderColor: c.border,
          }}
        />
      </View>

      {/* Chapter List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChapters}
          renderItem={renderChapter}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
