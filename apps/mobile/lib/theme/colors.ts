export interface ColorScheme {
  background: string;
  card: string;
  surface: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  foreground: string;
  secondaryText: string;
  muted: string;
  border: string;
  error: string;
  success: string;
}

export const colors: { light: ColorScheme; dark: ColorScheme } = {
  light: {
    // Matches web warm-cream surface instead of a bright white app background.
    background: "#FEFBF4",
    card: "#F7F1E8",
    surface: "#EFE3D6",
    primary: "#5C4033",
    primaryLight: "#8B6914",
    accent: "#B08968",
    accentLight: "#D4B896",
    foreground: "#2A1C16",
    secondaryText: "#8B7355",
    muted: "#C4A882",
    border: "#E0CCBB",
    error: "#DC2626",
    success: "#16A34A",
  },
  dark: {
    background: "#1A1412",
    card: "#2A1F1A",
    surface: "#3A2E26",
    primary: "#D4B896",
    primaryLight: "#E0CCBB",
    accent: "#B08968",
    accentLight: "#8B6914",
    foreground: "#F0E6DD",
    secondaryText: "#A89278",
    muted: "#6B5744",
    border: "#4A3B30",
    error: "#EF4444",
    success: "#22C55E",
  },
};
