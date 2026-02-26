import { useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { RootNavigator } from "./src/navigation/root-navigator";
import { AppStateProvider } from "./src/context/app-state";
import { palette } from "./src/theme/palette";

// Keep splash screen visible while we fetch fonts
SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.border,
    primary: palette.brand,
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "AmiriQuranColored": require("./assets/fonts/AmiriQuranColored.ttf"),
    "Amiri-Regular": require("./assets/fonts/Amiri-Regular.ttf"),
    "UthmanTN": require("./assets/fonts/UthmanTN_v2-0.ttf"),
    "SurahNames": require("./assets/fonts/SurahNames.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AppStateProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </AppStateProvider>
      </SafeAreaProvider>
    </View>
  );
}
