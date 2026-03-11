/**
 * Design System - Tango Internal 2.0
 * 
 * Central export point for all design tokens and utilities.
 */

// Colors
export { colors, getThemeColors } from "./colors";
export type { BaseColors, SemanticColor, Theme } from "./colors";

// Typography
export { typography, getTextStyle, getTextClassName } from "./typography";
export type { 
  TextStyle, 
  HeroStyle, 
  HeadlineStyle, 
  ParagraphStyle, 
  LabelStyle 
} from "./typography";

// Re-export JSON for tools that need raw data
import colorsJson from "./colors.json";
import typographyJson from "./typography.json";
export { colorsJson, typographyJson };
