import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import {
  getCollections,
  getBookmarks,
  type Collection,
  type Bookmark,
} from "../../lib/db/storage";
import { BookmarkIcon } from "../../components/icons/tab-icons";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [cols, bms] = await Promise.all([getCollections(), getBookmarks()]);
    setCollections(cols);
    setBookmarks(bms);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.background,
        }}
      >
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const isEmpty = collections.length === 0 && bookmarks.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: c.foreground,
          }}
        >
          {t("saved")}
        </Text>
      </View>

      {isEmpty ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <BookmarkIcon color={c.muted} size={28} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: c.foreground,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {t("noBookmarks")}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: c.secondaryText,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {t("tapBookmarkHint")}
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/quran")}
            style={{
              marginTop: 20,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: c.primary,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              {t("browseQuran")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push(`/quran/${item.chapterId}`);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                borderRadius: 14,
                backgroundColor: c.card,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: c.border,
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
                <BookmarkIcon color={c.accent} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: c.foreground,
                  }}
                >
                  {item.verseKey}
                </Text>
                {item.note && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.secondaryText,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.note}
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
