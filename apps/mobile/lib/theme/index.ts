import { useThemeStore } from "../stores/theme";
import { colors, type ColorScheme } from "./colors";

export { colors, type ColorScheme };

export function useColors(): ColorScheme {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? colors.dark : colors.light;
}
