/**
 * Design System Colors - Tango Internal 2.0
 * 
 * This file contains all color tokens extracted from Figma.
 * Use these colors throughout the application for consistency.
 */

export const colors = {
  // ============================================
  // BASE COLORS
  // ============================================
  base: {
    light: {
      /** Main color for text and icons */
      primary: "#181a21",
      /** Secondary color for text and icons */
      secondary: "#848790",
      /** Tertiary color for text and icons */
      tertiary: "#bfc1c5",
      /** Color for strokes/borders */
      stroke: "#ebecee",
      /** Main background color */
      surfacePrimary: "#ffffff",
      /** Secondary background color */
      surfaceSecondary: "#f6f6f8",
    },
    dark: {
      /** Main color for text and icons */
      primary: "#fefefe",
      /** Secondary color for text and icons */
      secondary: "#9c9c9d",
      /** Tertiary color for text and icons */
      tertiary: "#5f5f5f",
      /** Color for strokes/borders */
      stroke: "#303030",
      /** Main background color */
      surfacePrimary: "#141414",
      /** Secondary background color */
      surfaceSecondary: "#1f1f1f",
    },
  },

  // ============================================
  // SEMANTIC COLORS
  // ============================================
  semantic: {
    danger: {
      10: "#ffece8",
      30: "#ffc5b9",
      50: "#ff9f8a",
      100: "#ff3e14",
    },
    warning: {
      10: "#fff6e7",
      30: "#ffe3b8",
      50: "#ffd088",
      100: "#ffa011",
    },
    success: {
      10: "#edf8eb",
      30: "#c9e9c4",
      50: "#a5db9d",
      100: "#4bb73a",
    },
    info: {
      10: "#eef0ff",
      30: "#ccd1ff",
      50: "#aab3ff",
      100: "#5466ff",
    },
  },

  // ============================================
  // DECORATIVE COLORS
  // ============================================
  decorative: {
    flat: {
      white: "#ffffff",
      black: "#000000",
      brandPrimary: "#fc3d6b",
      brandSecondary: "#aa54ff",
      onBronze: "#55372e",
      onSilver: "#333f49",
      onGold: "#514125",
    },
    gradients: {
      brandPrimary: "linear-gradient(135deg, #fc3d6b 0%, #aa54ff 100%)",
      bronze: "linear-gradient(135deg, #cd7f32 0%, #8b4513 100%)",
      silver: "linear-gradient(135deg, #c0c0c0 0%, #808080 100%)",
      gold: "linear-gradient(135deg, #ffd700 0%, #daa520 100%)",
    },
  },

  // ============================================
  // SHADERS (Overlays with opacity)
  // ============================================
  shaders: {
    black: {
      64: "rgba(0, 0, 0, 0.64)",
      24: "rgba(0, 0, 0, 0.24)",
      16: "rgba(0, 0, 0, 0.16)",
      8: "rgba(0, 0, 0, 0.08)",
    },
    white: {
      64: "rgba(255, 255, 255, 0.64)",
      24: "rgba(255, 255, 255, 0.24)",
      16: "rgba(255, 255, 255, 0.16)",
      8: "rgba(255, 255, 255, 0.08)",
    },
  },

  // ============================================
  // SPECIAL EFFECTS
  // ============================================
  special: {
    skeleton: {
      light: {
        from: "#f6f6f8",
        via: "#ebecee",
        to: "#f6f6f8",
      },
      dark: {
        from: "#1f1f1f",
        via: "#303030",
        to: "#1f1f1f",
      },
    },
    bottomGradient: {
      light: {
        from: "rgba(255, 255, 255, 1)",
        to: "rgba(255, 255, 255, 0)",
      },
      dark: {
        from: "rgba(20, 20, 20, 1)",
        to: "rgba(20, 20, 20, 0)",
      },
    },
  },
} as const;

// Type exports for TypeScript
export type BaseColors = typeof colors.base.light;
export type SemanticColor = typeof colors.semantic.danger;
export type Theme = "light" | "dark";

// Helper function to get theme colors
export function getThemeColors(theme: Theme) {
  return {
    ...colors.base[theme],
    semantic: colors.semantic,
    decorative: colors.decorative,
    shaders: colors.shaders,
    special: {
      skeleton: colors.special.skeleton[theme],
      bottomGradient: colors.special.bottomGradient[theme],
    },
  };
}
