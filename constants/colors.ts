const primary = "#1A6B3C";
const primaryLight = "#52B788";
const primaryLighter = "#95D5B2";
const accent = "#2D9A5E";

export const Colors = {
  primary,
  primaryLight,
  primaryLighter,
  accent,
  background: "#F0F7F4",
  surface: "#FFFFFF",
  surfaceSecondary: "#F5FAF7",
  border: "#D9EDE4",
  borderLight: "#EAF4EE",
  text: "#0F2419",
  textSecondary: "#4A6B56",
  textTertiary: "#8BA898",
  error: "#C0392B",
  errorLight: "#FDECEA",
  warning: "#E67E22",
  warningLight: "#FEF3E2",
  success: "#1A6B3C",
  successLight: "#EAF7EF",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.5)",
  cardShadow: "rgba(26, 107, 60, 0.12)",
  disabled: "#B0C9BA",
  disabledText: "#8BA898",

  categoryColors: {
    virus: { bg: "#FFF0F0", icon: "#C0392B", dark: "#922B21" },
    auxiliaire: { bg: "#F0F7FF", icon: "#2980B9", dark: "#1A5276" },
    ravageurs: { bg: "#FFF8F0", icon: "#E67E22", dark: "#A04000" },
    irrigation: { bg: "#F0F9FF", icon: "#1A6B8A", dark: "#0E4055" },
    inspection: { bg: "#F5F0FF", icon: "#8E44AD", dark: "#5B2C6F" },
    compteur: { bg: "#F0FFF8", icon: "#1A6B3C", dark: "#0E3D22" },
  },
};

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    tabIconDefault: Colors.textTertiary,
    tabIconSelected: Colors.primary,
  },
};
