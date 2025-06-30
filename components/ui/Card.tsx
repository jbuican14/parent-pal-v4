import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors, components, shadows, spacing } from '@/tokens/tokens';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Card variant */
  variant?: 'default' | 'elevated' | 'outlined';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Status indicator */
  status?: 'default' | 'warning' | 'error' | 'success';
  /** Make card pressable */
  pressable?: boolean;
  /** Press handler (only works if pressable is true) */
  onPress?: () => void;
  /** Custom style override */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export default function Card({
  children,
  variant = 'default',
  size = 'md',
  status = 'default',
  pressable = false,
  onPress,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[size],
    styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`],
    style,
  ];

  const CardComponent = pressable ? TouchableOpacity : View;
  const touchableProps: Partial<TouchableOpacityProps> = pressable ? {
    onPress,
    activeOpacity: 0.95,
    accessibilityRole: 'button',
  } : {};

  return (
    <CardComponent
      style={cardStyles}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      {...touchableProps}
    >
      {children}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: components.card.borderRadius,
    paddingHorizontal: components.card.paddingHorizontal,
    paddingVertical: components.card.paddingVertical,
    marginBottom: components.card.marginBottom,
  },
  
  // Variants
  default: {
    ...shadows.sm,
  },
  
  elevated: {
    ...shadows.md,
  },
  
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  
  md: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  
  // Status indicators
  statusDefault: {},
  
  statusWarning: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  
  statusError: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  
  statusSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
});