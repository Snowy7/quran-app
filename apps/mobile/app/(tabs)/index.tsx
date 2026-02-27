import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation, type TranslationKey } from "../../lib/i18n";
import { useChapters } from "../../lib/api/chapters";
import { usePrayerTimes, type PrayerName } from "../../lib/hooks/use-prayer-times";
import { getLastRead, type ReadingHistoryEntry } from "../../lib/db/storage";
import { FadeInView } from "../../components/fade-in-view";
import { hapticLight } from "../../lib/haptics";
import {
  BookOpenIcon,
  SearchIcon,
  SettingsIcon,
  ChevronRightIcon,
} from "./tab-icons";

const GREETING_KEYS: Record<string, TranslationKey> = {
  peace: "greetingPeace",
  morning: "greetingMorning",
  afternoon: "greetingAfternoon",
  evening: "greetingEvening",
};

function getGreetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour < 5) return GREETING_KEYS.peace;
  if (hour < 12) return GREETING_KEYS.morning;
  if (hour < 17) return GREETING_KEYS.afternoon;
  if (hour < 21) return GREETING_KEYS.evening;
  return GREETING_KEYS.peace;
}

const PRAYER_LABEL_KEYS: Record<PrayerName, TranslationKey> = {
  Fajr: "fajr",
  Sunrise: "sunrise",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha",
};

const DAILY_VERSES = [
  {
    key: "2:286",
    arabic: "\u0644\u0627 \u064A\u0643\u0644\u0641 \u0627\u0644\u0644\u0647 \u0646\u0641\u0633\u064B\u0627 \u0625\u0644\u0627 \u0648\u0633\u0639\u0647\u0627",
    translation: "Allah does not burden a soul beyond that it can bear.",
  },
  {
    key: "94:5",
    arabic: "\u0641\u0625\u0646 \u0645\u0639 \u0627\u0644\u0639\u0633\u0631 \u064A\u0633\u0631\u064B\u0627",
    translation: "For indeed, with hardship comes ease.",
  },
  {
    key: "2:152",
    arabic: "\u0641\u0627\u0630\u0643\u0631\u0648\u0646\u064A \u0623\u0630\u0643\u0631\u0643\u0645",
    translation: "So remember Me; I will remember you.",
  },
  {
    key: "3:139",
    arabic: "\u0648\u0644\u0627 \u062A\u0647\u0646\u0648\u0627 \u0648\u0644\u0627 \u062A\u062D\u0632\u0646\u0648\u0627 \u0648\u0623\u0646\u062A\u0645 \u0627\u0644\u0623\u0639\u0644\u0648\u0646",
    translation: "Do not weaken and do not grieve, for you are superior.",
  },
  {
    key: "13:28",
    arabic: "\u0623\u0644\u0627 \u0628\u0630\u0643\u0631 \u0627\u0644\u0644\u0647 \u062A\u0637\u0645\u0626\u0646 \u0627\u0644\u0642\u0644\u0648\u0628",
    translation: "Verily, in the remembrance of Allah do hearts find rest.",
  },
  {
    key: "65:3",
    arabic: "\u0648\u0645\u0646 \u064A\u062A\u0648\u0643\u0644 \u0639\u0644\u0649 \u0627\u0644\u0644\u0647 \u0641\u0647\u0648 \u062D\u0633\u0628\u0647",
    translation: "And whoever relies upon Allah - then He is sufficient for him.",
  },
  {
    key: "39:53",
    arabic: "\u0644\u0627 \u062A\u0642\u0646\u0637\u0648\u0627 \u0645\u0646 \u0631\u062D\u0645\u0629 \u0627\u0644\u0644\u0647",
    translation: "Do not despair of the mercy of Allah.",
  },
];

function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const { data: chapters } = useChapters();
  const [lastRead, setLastRead] = useState<ReadingHistoryEntry | null>(null);

  const {
    prayers,
    nextPrayer,
    countdown,
    loading: prayerLoading,
    location,
  } = usePrayerTimes();

  useEffect(() => {
    getLastRead().then((r) => setLastRead(r ?? null));
  }, []);

  const lastReadChapter =
    lastRead && chapters
      ? chapters.find((ch) => ch.id === lastRead.chapterId)
      : null;

  const dailyVerse = getDailyVerse();
  const greetingKey = getGreetingKey();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: 100,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: c.foreground,
            fontFamily: "Poppins",
          }}
        >
          {t("noor")}
        </Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Pressable
            onPress={() => router.push("/search")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SearchIcon color={c.secondaryText} size={22} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SettingsIcon color={c.secondaryText} size={22} />
          </Pressable>
        </View>
      </View>

      {/* Greeting */}
      <FadeInView delay={0} slideUp={15}>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: c.foreground }}>
            {t(greetingKey)}
          </Text>
          <Text style={{ fontSize: 13, color: c.secondaryText, marginTop: 2 }}>
            {t("mayDayBeBlessed")}
          </Text>
        </View>
      </FadeInView>

      {/* Last Read / Start Reading Card */}
      <FadeInView delay={100} slideUp={15}>
      <Pressable
        onPress={() => {
          hapticLight();
          lastRead
            ? router.push(`/quran/${lastRead.chapterId}`)
            : router.push("/(tabs)/quran");
        }}
        style={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: c.primary,
          padding: 20,
          marginBottom: 16,
        }}
      >
        {lastReadChapter && lastRead ? (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              >
                <BookOpenIcon color="rgba(255,255,255,0.9)" size={14} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {t("lastRead")}
                </Text>
              </View>
            </View>
            <Text
              style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}
            >
              {lastReadChapter.name_simple}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                marginTop: 2,
              }}
            >
              {t("ayah")} {lastRead.verseNumber} /{" "}
              {lastReadChapter.verses_count}
            </Text>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.15)",
                marginTop: 16,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  width: `${Math.round((lastRead.verseNumber / lastReadChapter.verses_count) * 100)}%`,
                }}
              />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpenIcon color="#fff" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                {t("startReading")}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 2,
                }}
              >
                {t("beginQuranJourney")}
              </Text>
            </View>
            <ChevronRightIcon color="rgba(255,255,255,0.5)" size={22} />
          </View>
        )}
      </Pressable>
      </FadeInView>

      {/* Prayer Times Mini Card */}
      <FadeInView delay={200} slideUp={15}>
      <Pressable
        onPress={() => {
          hapticLight();
          router.push("/(tabs)/prayer");
        }}
        style={{
          borderRadius: 16,
          backgroundColor: c.card,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        {prayerLoading ? (
          <ActivityIndicator color={c.primary} />
        ) : nextPrayer ? (
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 12, color: c.secondaryText, marginBottom: 2 }}
                >
                  {t("nextPrayer")}
                </Text>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}
                >
                  {t(PRAYER_LABEL_KEYS[nextPrayer])}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{ fontSize: 12, color: c.secondaryText, marginBottom: 2 }}
                >
                  {t("remainingTime")}
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: c.accent,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {countdown}
                </Text>
              </View>
            </View>
            {location && (
              <Text
                style={{ fontSize: 11, color: c.muted, marginTop: 8 }}
              >
                {location.city}
                {location.country ? `, ${location.country}` : ""}
              </Text>
            )}
            {/* Mini prayer timeline */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              {prayers.slice(0, 6).map((p) => {
                const isNext = p.name === nextPrayer;
                const isPast = p.time < new Date();
                return (
                  <View key={p.name} style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: isNext ? "700" : "400",
                        color: isNext
                          ? c.primary
                          : isPast
                            ? c.muted
                            : c.secondaryText,
                        marginBottom: 2,
                      }}
                    >
                      {t(PRAYER_LABEL_KEYS[p.name])}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isNext ? "600" : "400",
                        color: isNext
                          ? c.primary
                          : isPast
                            ? c.muted
                            : c.foreground,
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      {formatPrayerTime(p.time)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </Pressable>
      </FadeInView>

      {/* Verse of the Day */}
      <FadeInView delay={300} slideUp={15}>
      <View
        style={{
          borderRadius: 16,
          backgroundColor: c.card,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: c.accent,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          {t("verseOfTheDay")}
        </Text>
        <Text
          style={{
            fontSize: 24,
            color: c.foreground,
            textAlign: "center",
            lineHeight: 44,
            fontFamily: "ScheherazadeNew",
            marginBottom: 12,
          }}
        >
          {dailyVerse.arabic}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: c.secondaryText,
            textAlign: "center",
            lineHeight: 22,
            fontStyle: "italic",
          }}
        >
          {dailyVerse.translation}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: c.muted,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {dailyVerse.key}
        </Text>
      </View>
      </FadeInView>

      {/* Quick Access Grid */}
      <FadeInView delay={400} slideUp={15}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: c.foreground,
          marginBottom: 12,
        }}
      >
        {t("quickAccess")}
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { label: t("quran"), route: "/(tabs)/quran" as const, icon: "book" },
          { label: t("search"), route: "/search" as const, icon: "search" },
          { label: t("saved"), route: "/(tabs)/saved" as const, icon: "bookmark" },
          { label: t("hifz"), route: "/(tabs)/hifz" as const, icon: "brain" },
        ].map((item) => (
          <Pressable
            key={item.route}
            onPress={() => {
              hapticLight();
              router.push(item.route);
            }}
            style={{
              width: "48%",
              borderRadius: 14,
              backgroundColor: c.card,
              padding: 16,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      </FadeInView>
    </ScrollView>
  );
}
