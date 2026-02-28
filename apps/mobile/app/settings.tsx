import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../lib/theme";
import { useTranslation } from "../lib/i18n";
import { useThemeStore, type ThemeMode } from "../lib/stores/theme";
import { hapticLight, hapticSelection } from "../lib/haptics";
import {
  isNotificationsEnabled,
  setNotificationsEnabled,
  requestNotificationPermissions,
  schedulePrayerNotifications,
} from "../lib/notifications/prayer-notifications";
import AsyncStorage from "../lib/storage/async-storage";
import { ChevronLeftIcon } from "../components/icons/tab-icons";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { t, language, setLanguage } = useTranslation();
  const { mode, setMode } = useThemeStore();
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    isNotificationsEnabled().then(setNotifEnabled);
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    hapticSelection();
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;

      await setNotificationsEnabled(true);
      setNotifEnabled(true);

      // Try to schedule with cached location
      const raw = await AsyncStorage.getItem("noor_cached_location");
      if (raw) {
        const loc = JSON.parse(raw) as { lat: number; lng: number };
        await schedulePrayerNotifications(loc.lat, loc.lng);
      }
    } else {
      await setNotificationsEnabled(false);
      setNotifEnabled(false);
    }
  };

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t("light"), value: "light" },
    { label: t("dark"), value: "dark" },
    { label: t("system"), value: "system" },
  ];

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
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <Pressable
          onPress={() => {
            hapticLight();
            router.back();
          }}
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
            {t("settings")}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Section */}
        <SectionHeader title={t("language")} color={c.secondaryText} />
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 14,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            overflow: "hidden",
          }}
        >
          <Pressable
            onPress={() => {
              hapticLight();
              setLanguage("en");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Text style={{ fontSize: 15, color: c.foreground }}>
              {t("english")}
            </Text>
            {language === "en" && (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: c.primary,
                }}
              />
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              setLanguage("ar");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 15, color: c.foreground }}>
              {t("arabic")}
            </Text>
            {language === "ar" && (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: c.primary,
                }}
              />
            )}
          </Pressable>
        </View>

        {/* Theme Section */}
        <SectionHeader title={t("appearance")} color={c.secondaryText} />
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 14,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            overflow: "hidden",
          }}
        >
          {themeOptions.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => {
                hapticLight();
                setMode(option.value);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: index < themeOptions.length - 1 ? 1 : 0,
                borderBottomColor: c.border,
              }}
            >
              <Text style={{ fontSize: 15, color: c.foreground }}>
                {option.label}
              </Text>
              {mode === option.value && (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: c.primary,
                  }}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* Notifications Section */}
        <SectionHeader
          title={t("enableNotifications")}
          color={c.secondaryText}
        />
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 14,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 15, color: c.foreground }}>
                {t("azanNotifications")}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: c.secondaryText,
                  marginTop: 2,
                }}
              >
                {t("azanNotificationsDesc")}
              </Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: c.border, true: c.accent }}
              thumbColor={notifEnabled ? c.primary : c.muted}
            />
          </View>
        </View>

        {/* About Section */}
        <SectionHeader title={t("about")} color={c.secondaryText} />
        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 14,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 15, color: c.foreground }}>
              {t("version")}
            </Text>
            <Text style={{ fontSize: 15, color: c.secondaryText }}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "600",
        color,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginHorizontal: 20,
        marginTop: 24,
        marginBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}
