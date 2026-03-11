/**
 * Design System Typography - Tango Internal 2.0
 * 
 * This file contains all typography tokens extracted from Figma.
 * Use these styles throughout the application for consistency.
 */

export const typography = {
  // ============================================
  // FONT FAMILY
  // ============================================
  fontFamily: {
    primary: "Roboto",
    fallback: "Arial, Helvetica, sans-serif",
    full: "'Roboto', Arial, Helvetica, sans-serif",
  },

  // ============================================
  // FONT WEIGHTS
  // ============================================
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },

  // ============================================
  // TEXT STYLES
  // ============================================
  styles: {
    // Hero - Large display text
    hero: {
      hero1: {
        fontSize: 48,
        lineHeight: 64,
        fontWeight: 500,
        letterSpacing: 0,
      },
      hero2: {
        fontSize: 40,
        lineHeight: 56,
        fontWeight: 500,
        letterSpacing: 0,
      },
      hero3: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: 500,
        letterSpacing: 0,
      },
      hero4: {
        fontSize: 28,
        lineHeight: 36,
        fontWeight: 500,
        letterSpacing: 0,
      },
    },

    // Headlines - Section headers
    headline: {
      headline1: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: 500,
        letterSpacing: 0,
      },
      headline2: {
        fontSize: 18,
        lineHeight: 28,
        fontWeight: 500,
        letterSpacing: 0,
      },
      headline3: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: 500,
        letterSpacing: 0,
      },
      headline4: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: 500,
        letterSpacing: 0,
      },
    },

    // Paragraphs - Body text
    paragraph: {
      paragraph1: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: 400,
        letterSpacing: 0,
      },
      paragraph2: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: 400,
        letterSpacing: 0,
      },
      paragraph3: {
        fontSize: 12,
        lineHeight: 20,
        fontWeight: 400,
        letterSpacing: 0,
      },
    },

    // Labels - Small text for UI elements
    label: {
      labelNormal: {
        fontSize: 12,
        lineHeight: 12,
        fontWeight: 500,
        letterSpacing: 0,
      },
      labelTiny: {
        fontSize: 10,
        lineHeight: 10,
        fontWeight: 500,
        letterSpacing: 0,
        textTransform: "capitalize" as const,
      },
    },
  },

  // ============================================
  // MODIFIERS
  // ============================================
  modifiers: {
    link: {
      textDecoration: "underline",
    },
    striked: {
      textDecoration: "line-through",
    },
  },
} as const;

// ============================================
// TYPE EXPORTS
// ============================================
export type TextStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  letterSpacing: number;
  textTransform?: string;
};

export type HeroStyle = keyof typeof typography.styles.hero;
export type HeadlineStyle = keyof typeof typography.styles.headline;
export type ParagraphStyle = keyof typeof typography.styles.paragraph;
export type LabelStyle = keyof typeof typography.styles.label;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert typography style to CSS properties
 */
export function getTextStyle(
  category: "hero" | "headline" | "paragraph" | "label",
  style: string
): React.CSSProperties {
  const categoryStyles = typography.styles[category] as unknown as Record<string, { fontSize: number; lineHeight: number; fontWeight: number; letterSpacing: number | string; textTransform?: string }>;
  const styleObj = categoryStyles[style];
  
  if (!styleObj) {
    console.warn(`Typography style not found: ${category}/${style}`);
    return {};
  }

  return {
    fontFamily: typography.fontFamily.full,
    fontSize: `${styleObj.fontSize}px`,
    lineHeight: `${styleObj.lineHeight}px`,
    fontWeight: styleObj.fontWeight,
    letterSpacing: styleObj.letterSpacing,
    ...(styleObj.textTransform ? { textTransform: styleObj.textTransform as React.CSSProperties["textTransform"] } : {}),
  };
}

/**
 * Get CSS class name for typography style
 */
export function getTextClassName(
  category: "hero" | "headline" | "paragraph" | "label",
  style: string,
  modifier?: "link" | "striked"
): string {
  let className = `text-${category}-${style.replace(category, "").toLowerCase() || "1"}`;
  
  if (modifier) {
    className += ` text-${modifier}`;
  }
  
  return className;
}
