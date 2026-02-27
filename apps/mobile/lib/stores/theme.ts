import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "system") {
    return Appearance.getColorScheme() === "dark";
  }
  return mode === "dark";
}

export const useThemeStore = create<ThemeState>()((set) => ({
  mode: "system",
  isDark: resolveIsDark("system"),
  isHydrated: false,
  setMode: (mode) => {
    set({ mode, isDark: resolveIsDark(mode) });
    AsyncStorage.setItem("noor-theme", mode);
  },
  hydrate: async () => {
    const saved = await AsyncStorage.getItem("noor-theme");
    if (saved === "light" || saved === "dark" || saved === "system") {
      set({ mode: saved, isDark: resolveIsDark(saved), isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));

// Listen for system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === "system") {
    useThemeStore.setState({ isDark: colorScheme === "dark" });
  }
});
