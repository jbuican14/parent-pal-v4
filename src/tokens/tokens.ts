/**
 * ParentPal Design System Tokens
 * 
 * Centralized design tokens for consistent styling across the application.
 * Based on the ParentPal Design System Specification.
 */

// Color Palette
export const colors = {
  // Primary Colors
  primary: '#4A7C59',
  primaryDark: '#3A6147',
  primaryLight: '#5A8C69',
  
  // Background Colors
  background: '#F5F1E8',
  surface: '#FFFFFF',
  
  // Child Indicators
  childOrange: '#E8833A',
  childPurple: '#8B4A9C',
  
  // Status Colors
  warning: '#F4A261',
  error: '#E76F51',
  success: '#4A7C59',
  
  // Text Colors
  textPrimary: '#2C2C2C',
  textSecondary: '#666666',
  textMuted: '#999999',
  textOnPrimary: '#FFFFFF',
  
  // Border Colors
  border: '#E0E0E0',
  borderLight: '#CCCCCC',
  
  // Input Colors
  inputBackground: '#E8E8E0',
  inputFocused: '#FFFFFF',
  
  // Transparent
  transparent: 'transparent',
} as const;

// Typography Scale
export const typography = {
  // Font Families
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    medium: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    semiBold: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    bold: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  
  // Font Sizes
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '22px',
    '3xl': '24px',
    '4xl': '28px',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
} as const;

// Spacing System (base unit: 4px)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// Border Radius
export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  lg: '0 4px 8px 0 rgba(0, 0, 0, 0.15)',
} as const;

// Component Specific Tokens
export const components = {
  button: {
    height: {
      sm: '40px',
      md: '48px',
      lg: '56px',
    },
    paddingHorizontal: {
      sm: '16px',
      md: '24px',
      lg: '32px',
    },
    borderRadius: borderRadius.xl,
  },
  
  input: {
    height: '48px',
    paddingHorizontal: '12px',
    paddingVertical: '16px',
    borderRadius: borderRadius.sm,
    borderWidth: '2px',
  },
  
  card: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  
  bottomNav: {
    height: '80px',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Animation durations
export const animations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
  breakpoints,
  animations,
  zIndex,
};
