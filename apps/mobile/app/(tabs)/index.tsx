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
import {
  usePrayerTimes,
  type PrayerName,
} from "../../lib/hooks/use-prayer-times";
import { getLastRead, type ReadingHistoryEntry } from "../../lib/db/storage";
import { FadeInView } from "../../components/fade-in-view";
import { hapticLight } from "../../lib/haptics";
import {
  BookOpenIcon,
  BookmarkIcon,
  AcademicCapIcon,
  SearchIcon,
  SettingsIcon,
  ChevronRightIcon,
  ClockIcon,
} from "../../components/icons/tab-icons";

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
    arabic: "لا يكلف الله نفسًا إلا وسعها",
    translation: "Allah does not burden a soul beyond that it can bear.",
  },
  {
    key: "94:5",
    arabic: "فإن مع العسر يسرًا",
    translation: "For indeed, with hardship comes ease.",
  },
  {
    key: "2:152",
    arabic: "فاذكروني أذكركم",
    translation: "So remember Me; I will remember you.",
  },
  {
    key: "3:139",
    arabic: "ولا تهنوا ولا تحزنوا وأنتم الأعلون",
    translation: "Do not weaken and do not grieve, for you are superior.",
  },
  {
    key: "13:28",
    arabic: "ألا بذكر الله تطمئن القلوب",
    translation: "Verily, in the remembrance of Allah do hearts find rest.",
  },
  {
    key: "65:3",
    arabic: "ومن يتوكل على الله فهو حسبه",
    translation:
      "And whoever relies upon Allah - then He is sufficient for him.",
  },
  {
    key: "39:53",
    arabic: "لا تقنطوا من رحمة الله",
    translation: "Do not despair of the mercy of Allah.",
  },
];

function getDailyVerse() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
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
    nextPrayerTime,
    countdown,
    loading: prayerLoading,
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
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header - matching web */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            letterSpacing: -0.5,
            color: c.foreground,
            fontFamily: "Poppins",
          }}
        >
          {t("noor")}
        </Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push("/search");
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SearchIcon color={c.secondaryText} size={20} />
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push("/settings");
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SettingsIcon color={c.secondaryText} size={20} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {/* Greeting */}
        <FadeInView delay={0} slideUp={15}>
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: c.foreground,
              }}
            >
              {t(greetingKey)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: c.secondaryText,
                marginTop: 2,
              }}
            >
              {t("mayDayBeBlessed")}
            </Text>
          </View>
        </FadeInView>

        {/* Last Read / Start Reading - matches web gradient card */}
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
            }}
          >
            {/* Decorative circles matching web */}
            <View
              style={{
                position: "absolute",
                top: -24,
                right: -24,
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: -16,
                right: -8,
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: "50%",
                right: 32,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            />

            <View style={{ padding: 20, position: "relative" }}>
              {lastReadChapter && lastRead ? (
                <>
                  {/* Badge */}
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
                      <BookOpenIcon
                        color="rgba(255,255,255,0.9)"
                        size={12}
                      />
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
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#fff",
                      marginBottom: 2,
                    }}
                  >
                    {lastReadChapter.name_simple}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {t("ayah")} {lastRead.verseNumber} /{" "}
                    {lastReadChapter.verses_count}
                  </Text>

                  {/* Progress bar */}
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
                </>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
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
                    <BookOpenIcon color="#fff" size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#fff",
                      }}
                    >
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
                  <ChevronRightIcon color="rgba(255,255,255,0.5)" size={20} />
                </View>
              )}
            </View>
          </Pressable>
        </FadeInView>

        {/* Quick Actions - matching web 4-column grid */}
        <FadeInView delay={150} slideUp={15}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <QuickAction
              icon={<BookOpenIcon color={c.primary} size={18} />}
              label={t("read") || "Read"}
              bgColor={c.primary + "14"}
              onPress={() => router.push("/(tabs)/quran")}
              colors={c}
            />
            <QuickAction
              icon={<BookmarkIcon color="#D97706" size={18} />}
              label={t("saved")}
              bgColor="#D9770614"
              onPress={() => router.push("/(tabs)/saved")}
              colors={c}
            />
            <QuickAction
              icon={<AcademicCapIcon color="#7C3AED" size={18} />}
              label={t("hifz")}
              bgColor="#7C3AED14"
              onPress={() => router.push("/(tabs)/hifz")}
              colors={c}
            />
            <QuickAction
              icon={<SearchIcon color="#2563EB" size={18} />}
              label={t("search")}
              bgColor="#2563EB14"
              onPress={() => router.push("/search")}
              colors={c}
            />
          </View>
        </FadeInView>

        {/* Prayer Times Card - matching web card style */}
        <FadeInView delay={200} slideUp={15}>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push("/(tabs)/prayer");
            }}
            style={{
              borderRadius: 16,
              backgroundColor: c.card,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View style={{ padding: 16 }}>
              {prayerLoading ? (
                <ActivityIndicator color={c.primary} />
              ) : nextPrayer ? (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: "#0EA5E914",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ClockIcon color="#0EA5E9" size={16} />
                      </View>
                      <View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: c.foreground,
                          }}
                        >
                          {t("prayerTimes")}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: c.secondaryText,
                            marginTop: 1,
                          }}
                        >
                          {t("nextPrayer") || "Next"}: {t(PRAYER_LABEL_KEYS[nextPrayer])}
                        </Text>
                      </View>
                    </View>
                    {nextPrayerTime && (
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: c.foreground,
                            fontVariant: ["tabular-nums"],
                          }}
                        >
                          {formatPrayerTime(nextPrayerTime)}
                        </Text>
                        {countdown && (
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: c.primary,
                              fontVariant: ["tabular-nums"],
                              marginTop: 1,
                            }}
                          >
                            {countdown}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Mini prayer timeline - matching web */}
                  {prayers.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {prayers
                        .filter((p) => p.name !== "Sunrise")
                        .map((p) => {
                          const isPast = p.time < new Date();
                          const isNext = p.name === nextPrayer;
                          return (
                            <View
                              key={p.name}
                              style={{ flex: 1, alignItems: "center", gap: 4 }}
                            >
                              <View
                                style={{
                                  height: 4,
                                  width: "100%",
                                  borderRadius: 2,
                                  backgroundColor: isNext
                                    ? c.primary
                                    : isPast
                                      ? c.primary + "40"
                                      : c.border + "30",
                                }}
                              />
                              <Text
                                style={{
                                  fontSize: 9,
                                  fontWeight: isNext ? "700" : "500",
                                  color: isNext
                                    ? c.primary
                                    : isPast
                                      ? c.muted
                                      : c.secondaryText + "B3",
                                }}
                              >
                                {t(PRAYER_LABEL_KEYS[p.name]).slice(0, 3)}
                              </Text>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    color: c.secondaryText,
                    textAlign: "center",
                  }}
                >
                  {t("prayerTimes")}
                </Text>
              )}
            </View>
          </Pressable>
        </FadeInView>

        {/* Verse of the Day - matching web card */}
        <FadeInView delay={300} slideUp={15}>
          <View
            style={{
              borderRadius: 16,
              backgroundColor: c.card,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                padding: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: c.accent,
                  marginBottom: 12,
                }}
              >
                ✨ {t("verseOfTheDay")}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  color: c.foreground,
                  textAlign: "center",
                  lineHeight: 40,
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
                }}
              >
                {dailyVerse.translation}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: c.muted,
                  textAlign: "center",
                  marginTop: 10,
                  fontWeight: "500",
                }}
              >
                {t("surah")} {dailyVerse.key}
              </Text>
            </View>
          </View>
        </FadeInView>
      </View>
    </ScrollView>
  );
}

function QuickAction({
  icon,
  label,
  bgColor,
  onPress,
  colors: c,
}: {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={{
        flex: 1,
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: c.secondaryText,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
