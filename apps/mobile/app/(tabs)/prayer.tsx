import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";
import { useTranslation, type TranslationKey } from "../../lib/i18n";
import { usePrayerTimes, type PrayerName } from "../../lib/hooks/use-prayer-times";

const PRAYER_LABEL_KEYS: Record<PrayerName, TranslationKey> = {
  Fajr: "fajr",
  Sunrise: "sunrise",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function PrayerTimesScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t } = useTranslation();
  const {
    prayers,
    nextPrayer,
    countdown,
    loading,
    error,
    location,
    hijriDate,
    gregorianDate,
    refresh,
  } = usePrayerTimes();

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
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: c.foreground,
          marginBottom: 4,
        }}
      >
        {t("prayerTimes")}
      </Text>

      {/* Date & Location */}
      <View style={{ marginBottom: 20 }}>
        {hijriDate && (
          <Text style={{ fontSize: 14, color: c.secondaryText, marginTop: 2 }}>
            {hijriDate.fullDate}
          </Text>
        )}
        <Text style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
          {gregorianDate}
          {location ? ` \u2022 ${location.city}` : ""}
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 60, alignItems: "center" }}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : error ? (
        <View style={{ paddingVertical: 60, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              color: c.error,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={refresh}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: c.primary,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {t("tryAgain")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Next Prayer Hero */}
          {nextPrayer && (
            <View
              style={{
                borderRadius: 20,
                backgroundColor: c.primary,
                padding: 24,
                marginBottom: 20,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 4,
                }}
              >
                {t("nextPrayer")}
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                {t(PRAYER_LABEL_KEYS[nextPrayer])}
              </Text>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.9)",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {countdown}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 4,
                }}
              >
                {t("remainingTime")}
              </Text>
            </View>
          )}

          {/* All Prayers List */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: c.card,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            {prayers.map((prayer, index) => {
              const isNext = prayer.name === nextPrayer;
              const isPast = prayer.time < new Date();

              return (
                <View
                  key={prayer.name}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                    borderBottomWidth: index < prayers.length - 1 ? 1 : 0,
                    borderBottomColor: c.border,
                    backgroundColor: isNext ? c.primary + "10" : "transparent",
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                  >
                    {/* Active indicator */}
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isNext
                          ? c.primary
                          : isPast
                            ? c.muted
                            : "transparent",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isNext ? "700" : "500",
                        color: isNext
                          ? c.primary
                          : isPast
                            ? c.muted
                            : c.foreground,
                      }}
                    >
                      {t(PRAYER_LABEL_KEYS[prayer.name])}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: isNext ? "700" : "500",
                      color: isNext
                        ? c.primary
                        : isPast
                          ? c.muted
                          : c.foreground,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {formatTime(prayer.time)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
