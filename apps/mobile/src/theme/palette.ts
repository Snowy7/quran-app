/**
 * Noor Mobile Design System
 * Matches the web app's warm cream/brown aesthetic from globals.css
 *
 * Light theme: warm cream (#FEFBF4), brown primary (#795547), tan accent (#CC9B76)
 */

export const palette = {
  // Backgrounds
  background: "#FEFBF4",          // warm cream (matches web --background)
  surface: "#F0E6D2",             // beige card (matches web --card)
  surfaceRaised: "#E8DACA",       // slightly darker beige
  surfaceSoft: "#E3D4BC",         // muted beige

  // Borders
  border: "#E3D4BC",              // matches web --border
  borderLight: "#EDE4D4",

  // Brand / Primary
  brand: "#795547",               // brown primary (matches web --primary)
  brandMuted: "#9B6E5A",
  brandLight: "#A0796A",

  // Accent
  accent: "#CC9B76",              // warm tan (matches web --accent)
  accentLight: "#D4AD8A",

  // Text
  textPrimary: "#2F211A",         // warm dark brown (matches web --foreground)
  textSecondary: "#5D4A3D",
  textMuted: "#907B69",           // matches web --muted-foreground
  textOnBrand: "#FFFFFF",
  textOnDark: "#FFF0DE",

  // Semantic
  success: "#3D8B4E",
  warning: "#B56E32",
  danger: "#C0392B",

  // Dark card backgrounds (for verse cards, hero)
  darkCard: "#1E1814",
  darkCardDeep: "#14100D",

  // Gradients
  heroGradientStart: "#8C614D",
  heroGradientMid: "#795547",
  heroGradientEnd: "#61443A",

  // Quick actions
  quickBookmark: "#CC9B76",
  quickPrayer: "#3D8B4E",
  quickQibla: "#5B8FB9",
  quickMemorize: "#9B59B6",

  // Overlay
  overlay: "rgba(0,0,0,0.5)",
  glassWhite: "rgba(255,255,255,0.08)",
  glassBorder: "rgba(255,255,255,0.18)",
};

export const fonts = {
  // Arabic Quran text
  amiriQuran: "AmiriQuranColored",
  amiri: "Amiri-Regular",
  uthmani: "UthmanTN",
  surahNames: "SurahNames",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 26,
  full: 999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
