import React, { useState, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, components, spacing } from '@/tokens/tokens';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Input variant */
  variant?: 'default' | 'filled';
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Container style override */
  containerStyle?: ViewStyle;
  /** Input style override */
  style?: TextStyle;
  /** Label style override */
  labelStyle?: TextStyle;
  /** Required field indicator */
  required?: boolean;
  /** Test ID for testing */
  testID?: string;
}

const TextInput = forwardRef<RNTextInput, TextInputProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  containerStyle,
  style,
  labelStyle,
  required = false,
  testID,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const hasError = Boolean(error);
  const hasValue = Boolean(props.value || props.defaultValue);

  const inputStyles = [
    styles.base,
    styles[variant],
    styles[size],
    isFocused && styles.focused,
    hasError && styles.error,
    props.editable === false && styles.disabled,
    style,
  ];

  const containerStyles = [
    styles.container,
    containerStyle,
  ];

  const labelStyles = [
    styles.label,
    required && styles.requiredLabel,
    hasError && styles.errorLabel,
    labelStyle,
  ];

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={labelStyles}>
          {label}
          {required && <Text style={styles.asterisk}> *</Text>}
        </Text>
      )}
      
      <RNTextInput
        ref={ref}
        style={inputStyles}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        accessibilityLabel={label}
        accessibilityState={{
          disabled: props.editable === false,
        }}
        testID={testID}
        {...props}
      />
      
      {(error || helperText) && (
        <Text style={[
          styles.helperText,
          hasError && styles.errorText,
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  
  requiredLabel: {
    color: colors.textPrimary,
  },
  
  errorLabel: {
    color: colors.error,
  },
  
  asterisk: {
    color: colors.error,
  },
  
  base: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    borderRadius: components.input.borderRadius,
    paddingHorizontal: components.input.paddingHorizontal,
    paddingVertical: components.input.paddingVertical,
    borderWidth: components.input.borderWidth,
    borderColor: colors.transparent,
    minHeight: 44, // Accessibility minimum touch target
  },
  
  // Variants
  default: {
    backgroundColor: colors.inputBackground,
  },
  
  filled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  
  // Sizes
  sm: {
    height: 40,
    fontSize: typography.fontSize.sm,
    paddingVertical: 12,
  },
  
  md: {
    height: components.input.height,
  },
  
  lg: {
    height: 56,
    fontSize: typography.fontSize.lg,
    paddingVertical: 20,
  },
  
  // States
  focused: {
    backgroundColor: colors.inputFocused,
    borderColor: colors.primary,
  },
  
  error: {
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  
  disabled: {
    opacity: 0.6,
    backgroundColor: colors.border,
  },
  
  helperText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.primary,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  
  errorText: {
    color: colors.error,
  },
});