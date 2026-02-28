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
import { hapticLight, hapticSelection } from "../../lib/haptics";
import { SearchIcon } from "../../components/icons/tab-icons";
import type { Chapter } from "../../lib/api/types";

type BrowseTab = "surah" | "juz" | "page";

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, language } = useTranslation();
  const { data: chapters, isLoading } = useChapters(language);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<BrowseTab>("surah");

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
    return (
      <Pressable
        onPress={() => {
          hapticLight();
          router.push(`/quran/${item.id}`);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 20,
        }}
      >
        {/* Number badge */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: c.primary + "0D",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: c.primary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {item.id}
          </Text>
        </View>

        {/* Name & Info */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: c.foreground,
            }}
            numberOfLines={1}
          >
            {item.name_simple}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: c.secondaryText,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {item.translated_name.name} · {item.verses_count} {t("ayahs")} ·{" "}
            {item.revelation_place === "makkah" ? t("meccan") : t("medinan")}
          </Text>
        </View>

        {/* Arabic name via surah_names font (matching web) */}
        <Text
          style={{
            fontSize: 18,
            color: c.foreground + "B3",
            fontFamily: "SurahNames",
            marginLeft: 8,
          }}
        >
          {String(item.id).padStart(3, "0")}
        </Text>
      </Pressable>
    );
  };

  const tabs: Array<{ key: BrowseTab; label: string }> = [
    { key: "surah", label: t("surah") || "Surah" },
    { key: "juz", label: t("juz") || "Juz" },
    { key: "page", label: t("page") || "Page" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 4,
          backgroundColor: c.background,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: c.foreground,
            marginBottom: 12,
            fontFamily: "Poppins",
          }}
        >
          {t("quran")}
        </Text>

        {/* Search Input - matching web style */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 48,
            borderRadius: 16,
            backgroundColor: c.surface + "80",
            paddingHorizontal: 14,
            marginBottom: 10,
          }}
        >
          <SearchIcon color={c.muted} size={18} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("searchSurahs")}
            placeholderTextColor={c.muted}
            style={{
              flex: 1,
              fontSize: 15,
              color: c.foreground,
              paddingHorizontal: 10,
              paddingVertical: 0,
            }}
          />
        </View>

        {/* Browse tabs - matching web segmented control */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: c.surface + "80",
            borderRadius: 14,
            padding: 3,
            marginBottom: 4,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  hapticSelection();
                  setActiveTab(tab.key);
                }}
                style={{
                  flex: 1,
                  borderRadius: 11,
                  paddingVertical: 10,
                  alignItems: "center",
                  backgroundColor: isActive ? c.card : "transparent",
                  ...(isActive
                    ? {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 3,
                        elevation: 2,
                      }
                    : {}),
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? "600" : "500",
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

      {/* Chapter List */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : activeTab === "surah" ? (
        <FlatList
          data={filteredChapters}
          renderItem={renderChapter}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: c.border + "40",
                marginLeft: 70,
                marginRight: 20,
              }}
            />
          )}
        />
      ) : activeTab === "juz" ? (
        <FlatList
          data={Array.from({ length: 30 }, (_, i) => i + 1)}
          keyExtractor={(item) => String(item)}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                hapticLight();
                // Juz navigation placeholder
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: c.border + "40",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: c.primary + "0D",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.primary,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {item}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: c.foreground,
                }}
              >
                {t("juz")} {item}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        /* Page grid - matching web style */
        <FlatList
          data={Array.from({ length: 604 }, (_, i) => i + 1)}
          keyExtractor={(item) => String(item)}
          numColumns={6}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            paddingBottom: 100,
          }}
          columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                hapticLight();
                // Page navigation placeholder
              }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                backgroundColor: c.surface + "60",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: c.secondaryText,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
