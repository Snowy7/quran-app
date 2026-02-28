import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SystemUI from "expo-system-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, LogBox, Platform, View } from "react-native";
import { useI18nStore } from "../lib/i18n";
import { useThemeStore } from "../lib/stores/theme";
import { colors, useColors } from "../lib/theme";
import { configureNotifications } from "../lib/notifications/prayer-notifications";

LogBox.ignoreLogs([
  "SafeAreaView",
  "SafeAreaView has been deprecated",
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AppContent() {
  const isDark = useThemeStore((s) => s.isDark);
  const c = useColors();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.background).catch(() => {});
  }, [c.background]);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
          animation: Platform.OS === "ios" ? "default" : "fade_from_bottom",
          animationDuration: 220,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="quran/[surahId]"
          options={{
            headerShown: false,
            animation: Platform.OS === "ios" ? "default" : "fade_from_bottom",
            animationDuration: 220,
          }}
        />
        <Stack.Screen
          name="search"
          options={{ headerShown: false, animation: "fade_from_bottom" }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            animation: Platform.OS === "ios" ? "default" : "fade_from_bottom",
            animationDuration: 220,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const isDark = useThemeStore((s) => s.isDark);
  const bootBackground = isDark ? colors.dark.background : colors.light.background;

  const [fontsLoaded] = useFonts({
    Poppins: require("../assets/fonts/Figtree.ttf"),
    ScheherazadeNew: require("../assets/fonts/quran_common.ttf"),
    NotoNaskhArabic: require("../assets/fonts/NotoNaskhArabic-Regular.ttf"),
    UthmanicHafs: require("../assets/fonts/UthmanicHafs1Ver18.ttf"),
    SurahNames: require("../assets/fonts/sura_names.ttf"),
  });

  const hydrateI18n = useI18nStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrateI18n();
    hydrateTheme();
    configureNotifications();
  }, [hydrateI18n, hydrateTheme]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bootBackground,
        }}
      >
        <ActivityIndicator size="large" color="#5C4033" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bootBackground }}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
