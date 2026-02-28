import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../lib/theme";
import { useTranslation } from "../lib/i18n";
import { useChapters } from "../lib/api/chapters";
import { useSearchQuran } from "../lib/api/search";
import type { Chapter, SearchResult } from "../lib/api/types";
import { ChevronLeftIcon, SearchIcon } from "../components/icons/tab-icons";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, language } = useTranslation();
  const [query, setQuery] = useState("");
  const { data: chapters } = useChapters(language);
  const { data: searchResults, isLoading } = useSearchQuran(query, language);

  // Also filter chapters by query
  const matchingChapters = useMemo(() => {
    if (!chapters || query.length < 2) return [];
    const q = query.toLowerCase();
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        ch.translated_name.name.toLowerCase().includes(q),
    );
  }, [chapters, query]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 8,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
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
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            height: 44,
            borderRadius: 14,
            backgroundColor: c.card,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <SearchIcon color={c.muted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={c.muted}
            autoFocus
            style={{
              flex: 1,
              fontSize: 15,
              color: c.foreground,
              marginLeft: 8,
              paddingVertical: 0,
            }}
          />
        </View>
      </View>

      {/* Results */}
      {query.length < 2 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <SearchIcon color={c.muted} size={40} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: c.foreground,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {t("searchTheQuran")}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: c.secondaryText,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {t("searchForVerses")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...matchingChapters.map((ch) => ({
              type: "chapter" as const,
              data: ch,
            })),
            ...(searchResults?.results ?? []).map((r) => ({
              type: "verse" as const,
              data: r,
            })),
          ]}
          keyExtractor={(item, index) =>
            item.type === "chapter"
              ? `ch-${item.data.id}`
              : `v-${(item.data as SearchResult).verse_key}-${index}`
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            isLoading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={c.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 15, color: c.secondaryText }}>
                  {t("noResults")} &ldquo;{query}&rdquo;
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.type === "chapter") {
              const ch = item.data as Chapter;
              return (
                <Pressable
                  onPress={() => router.push(`/quran/${ch.id}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: c.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: c.primary,
                      }}
                    >
                      {ch.id}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: c.foreground,
                      }}
                    >
                      {ch.name_simple}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: c.secondaryText,
                        marginTop: 2,
                      }}
                    >
                      {ch.translated_name.name}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      color: c.foreground,
                      fontFamily: "ScheherazadeNew",
                    }}
                  >
                    {ch.name_arabic}
                  </Text>
                </Pressable>
              );
            }

            const result = item.data as SearchResult;
            return (
              <Pressable
                onPress={() => {
                  const [chId] = result.verse_key.split(":");
                  router.push(`/quran/${chId}`);
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: c.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: c.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: c.primary,
                      }}
                    >
                      {result.verse_key}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 20,
                    lineHeight: 36,
                    color: c.foreground,
                    textAlign: "right",
                    fontFamily: "ScheherazadeNew",
                  }}
                >
                  {result.text}
                </Text>
                {result.translations?.[0] && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: c.secondaryText,
                      marginTop: 4,
                      lineHeight: 20,
                    }}
                    numberOfLines={2}
                  >
                    {result.translations[0].text.replace(/<[^>]*>/g, "")}
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
