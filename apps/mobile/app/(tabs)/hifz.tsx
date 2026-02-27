import { useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation } from "../../lib/i18n";
import { getDueReviews, getTotalProgress, getStreak } from "../../lib/db/storage";
import { AcademicCapIcon, BookOpenIcon } from "./tab-icons";

export default function HifzScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dueCount, setDueCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalProgress, setTotalProgress] = useState({
    total: 6236,
    memorized: 0,
  });

  useFocusEffect(
    useCallback(() => {
      Promise.all([getDueReviews(), getTotalProgress(), getStreak()]).then(
        ([due, progress, s]) => {
          setDueCount(due.length);
          setTotalProgress(progress);
          setStreak(s);
          setLoading(false);
        },
      );
    }, []),
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

  const progressPercent =
    totalProgress.total > 0
      ? Math.round((totalProgress.memorized / totalProgress.total) * 100)
      : 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.background,
        paddingTop: insets.top + 8,
      }}
    >
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: c.foreground,
          }}
        >
          {t("hifz")}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Stats Cards */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              borderRadius: 16,
              backgroundColor: c.card,
              padding: 16,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 28, fontWeight: "700", color: c.primary }}
            >
              {totalProgress.memorized}
            </Text>
            <Text style={{ fontSize: 12, color: c.secondaryText, marginTop: 4 }}>
              {t("versesMemorized")}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              borderRadius: 16,
              backgroundColor: c.card,
              padding: 16,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 28, fontWeight: "700", color: c.accent }}
            >
              {streak}
            </Text>
            <Text style={{ fontSize: 12, color: c.secondaryText, marginTop: 4 }}>
              {t("dayStreak")}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            borderRadius: 16,
            backgroundColor: c.card,
            padding: 16,
            borderWidth: 1,
            borderColor: c.border,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
              {t("memorization")}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: c.primary }}>
              {progressPercent}%
            </Text>
          </View>
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: c.surface,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                borderRadius: 4,
                backgroundColor: c.primary,
                width: `${progressPercent}%`,
              }}
            />
          </View>
          <Text
            style={{ fontSize: 12, color: c.secondaryText, marginTop: 8 }}
          >
            {totalProgress.memorized} / {totalProgress.total} {t("ayahs")}
          </Text>
        </View>

        {/* Due Reviews or Empty State */}
        {dueCount > 0 ? (
          <View
            style={{
              borderRadius: 16,
              backgroundColor: c.primary,
              padding: 20,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}
            >
              {dueCount} {t("dueNow")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                marginTop: 4,
              }}
            >
              {t("noVersesDue").replace("No verses", `${dueCount} verses`)}
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/quran")}
              style={{
                marginTop: 14,
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                {t("startReview")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 40,
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
              <AcademicCapIcon color={c.muted} size={28} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: c.foreground,
                marginBottom: 8,
              }}
            >
              {t("startMemorizing")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: c.secondaryText,
                textAlign: "center",
                lineHeight: 20,
                paddingHorizontal: 20,
              }}
            >
              {t("noVersesDue")}
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/quran")}
              style={{
                marginTop: 16,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: c.primary,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                {t("openQuran")}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
