import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, typography, components, shadows } from '@/tokens/tokens';

export interface ButtonProps {
  /** Button text content */
  title: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Custom style override */
  style?: ViewStyle;
  /** Custom text style override */
  textStyle?: TextStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? colors.textOnPrimary : colors.primary}
            style={styles.loader}
          />
        )}
        <Text style={textStyles}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: components.button.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility minimum touch target
    ...shadows.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  
  // Sizes
  sm: {
    height: components.button.height.sm,
    paddingHorizontal: components.button.paddingHorizontal.sm,
  },
  
  md: {
    height: components.button.height.md,
    paddingHorizontal: components.button.paddingHorizontal.md,
  },
  
  lg: {
    height: components.button.height.lg,
    paddingHorizontal: components.button.paddingHorizontal.lg,
  },
  
  // Disabled state
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Content container
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loader: {
    marginRight: 8,
  },
  
  // Text styles
  baseText: {
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  
  primaryText: {
    color: colors.textOnPrimary,
  },
  
  secondaryText: {
    color: colors.textPrimary,
  },
  
  outlineText: {
    color: colors.primary,
  },
  
  smText: {
    fontSize: typography.fontSize.sm,
  },
  
  mdText: {
    fontSize: typography.fontSize.md,
  },
  
  lgText: {
    fontSize: typography.fontSize.lg,
  },
  
  disabledText: {
    opacity: 0.7,
  },
});