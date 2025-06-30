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
    primary: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 24,
    '4xl': 28,
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
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// Border Radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Component Specific Tokens
export const components = {
  button: {
    height: {
      sm: 40,
      md: 48,
      lg: 56,
    },
    paddingHorizontal: {
      sm: 16,
      md: 24,
      lg: 32,
    },
    borderRadius: borderRadius.xl,
  },
  
  input: {
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
  },
  
  card: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  
  bottomNav: {
    height: 80,
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
  fast: 150,
  normal: 300,
  slow: 500,
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