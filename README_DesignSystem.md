# ParentPal Design System

A comprehensive design system for the ParentPal family event management application, providing consistent visual language and reusable components.

## Overview

The ParentPal Design System is built around the principles of simplicity, warmth, and functionality. It provides a cohesive visual language that emphasizes family organization and task management while maintaining a friendly, approachable aesthetic.

## Design Tokens

### Colors

Our color palette is carefully crafted to convey trust, warmth, and organization:

```typescript
import { colors } from '@/tokens/tokens';

// Primary Colors
colors.primary        // #4A7C59 - Main brand color
colors.primaryDark    // #3A6147 - Darker variant
colors.primaryLight   // #5A8C69 - Lighter variant

// Background Colors
colors.background     // #F5F1E8 - Main background
colors.surface        // #FFFFFF - Cards, inputs

// Child Indicators
colors.childOrange    // #E8833A - Child 1
colors.childPurple    // #8B4A9C - Child 2

// Status Colors
colors.warning        // #F4A261 - Warning states
colors.error          // #E76F51 - Error states
colors.success        // #4A7C59 - Success states

// Text Colors
colors.textPrimary    // #2C2C2C - Primary text
colors.textSecondary  // #666666 - Secondary text
colors.textMuted      // #999999 - Muted text
```

### Typography

Our typography scale uses the Inter font family for excellent readability:

```typescript
import { typography } from '@/tokens/tokens';

// Font Families
typography.fontFamily.primary    // Inter-Regular
typography.fontFamily.medium     // Inter-Medium
typography.fontFamily.semiBold   // Inter-SemiBold
typography.fontFamily.bold       // Inter-Bold

// Font Sizes
typography.fontSize.xs    // 12px
typography.fontSize.sm    // 13px
typography.fontSize.base  // 14px
typography.fontSize.md    // 16px
typography.fontSize.lg    // 18px
typography.fontSize.xl    // 20px
typography.fontSize['2xl'] // 22px
typography.fontSize['3xl'] // 24px
typography.fontSize['4xl'] // 28px
```

### Spacing

Our spacing system is based on a 4px grid for consistent layouts:

```typescript
import { spacing } from '@/tokens/tokens';

spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 12px
spacing.base  // 16px
spacing.lg    // 24px
spacing.xl    // 32px
spacing['2xl'] // 48px
spacing['3xl'] // 64px
```

### Border Radius

Consistent border radius values for different component types:

```typescript
import { borderRadius } from '@/tokens/tokens';

borderRadius.sm    // 8px  - Inputs
borderRadius.md    // 12px - Cards
borderRadius.lg    // 16px - Large cards
borderRadius.xl    // 20px - Buttons
borderRadius['2xl'] // 24px - Bottom nav
borderRadius.full  // 9999px - Circular elements
```

## Components

### Button

A versatile button component with multiple variants and states:

```typescript
import Button from '@/components/ui/Button';

// Basic usage
<Button title="Save Changes" onPress={handleSave} />

// Variants
<Button title="Primary" variant="primary" />
<Button title="Secondary" variant="secondary" />
<Button title="Outline" variant="outline" />

// Sizes
<Button title="Small" size="sm" />
<Button title="Medium" size="md" />
<Button title="Large" size="lg" />

// States
<Button title="Disabled" disabled />
<Button title="Loading" loading />
```

**Features:**
- Three variants: primary, secondary, outline
- Three sizes: sm, md, lg
- Loading and disabled states
- Accessibility compliant (44pt minimum touch target)
- Customizable styling

### TextInput

A comprehensive input component with labels, validation, and multiple states:

```typescript
import TextInput from '@/components/ui/TextInput';

// Basic usage
<TextInput 
  label="Email Address"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
/>

// With validation
<TextInput 
  label="Password"
  value={password}
  onChangeText={setPassword}
  error="Password is required"
  required
  secureTextEntry
/>

// Variants and sizes
<TextInput variant="filled" size="lg" />
```

**Features:**
- Label and helper text support
- Error state with validation messages
- Required field indicators
- Two variants: default, filled
- Three sizes: sm, md, lg
- Focus and blur state handling
- Accessibility compliant

### Card

A flexible container component for grouping related content:

```typescript
import Card from '@/components/ui/Card';

// Basic usage
<Card>
  <Text>Card content goes here</Text>
</Card>

// With status indicators
<Card status="warning">
  <Text>Warning message</Text>
</Card>

// Pressable card
<Card pressable onPress={handlePress}>
  <Text>Tap me!</Text>
</Card>

// Variants and sizes
<Card variant="elevated" size="lg" />
```

**Features:**
- Three variants: default, elevated, outlined
- Status indicators: warning, error, success
- Pressable functionality
- Three sizes: sm, md, lg
- Consistent shadows and spacing

### BottomNav

A tab-based navigation component for primary app navigation:

```typescript
import BottomNav from '@/components/ui/BottomNav';
import { Home, Calendar, Settings } from 'lucide-react-native';

const navItems = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home size={24} color={colors.textMuted} />,
    activeIcon: <Home size={24} color={colors.primary} />,
  },
  {
    id: 'events',
    label: 'Events',
    icon: <Calendar size={24} color={colors.textMuted} />,
    badge: 3,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={24} color={colors.textMuted} />,
  },
];

<BottomNav 
  items={navItems}
  activeId={activeTab}
  onItemPress={setActiveTab}
/>
```

**Features:**
- Badge support with 99+ overflow
- Active/inactive states
- Icon and label support
- Accessibility compliant
- Customizable styling

## Usage Guidelines

### Importing Tokens

Always import design tokens from the centralized tokens file:

```typescript
import { colors, typography, spacing, borderRadius } from '@/tokens/tokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.base,
    borderRadius: borderRadius.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
});
```

### Component Composition

Components are designed to work together harmoniously:

```typescript
<Card variant="elevated" size="lg">
  <TextInput 
    label="Event Title"
    value={title}
    onChangeText={setTitle}
    error={titleError}
    required
  />
  
  <Button 
    title="Save Event"
    variant="primary"
    onPress={handleSave}
    loading={isLoading}
    style={{ marginTop: spacing.lg }}
  />
</Card>
```

### Accessibility

All components follow accessibility best practices:

- **Touch Targets**: Minimum 44pt touch targets
- **Color Contrast**: WCAG AA compliant color combinations
- **Screen Readers**: Proper accessibility labels and roles
- **Focus Management**: Clear focus indicators
- **State Communication**: Accessibility state updates

### Responsive Design

Components adapt to different screen sizes:

```typescript
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

<Button 
  size={isTablet ? 'lg' : 'md'}
  title="Responsive Button"
/>
```

## Testing

All components include comprehensive test suites:

```bash
# Run all component tests
npm test components/ui

# Run specific component tests
npm test components/ui/Button.test.tsx

# Run with coverage
npm test components/ui -- --coverage
```

### Test Coverage

- ✅ Rendering with different props
- ✅ User interaction handling
- ✅ Accessibility compliance
- ✅ State management
- ✅ Error handling

## Customization

### Extending Components

Components can be extended for specific use cases:

```typescript
import Button, { ButtonProps } from '@/components/ui/Button';

interface SaveButtonProps extends Omit<ButtonProps, 'title' | 'variant'> {
  isDirty: boolean;
}

function SaveButton({ isDirty, ...props }: SaveButtonProps) {
  return (
    <Button
      title={isDirty ? 'Save Changes' : 'Saved'}
      variant="primary"
      disabled={!isDirty}
      {...props}
    />
  );
}
```

### Custom Themes

Create theme variations by extending the base tokens:

```typescript
import baseTokens from '@/tokens/tokens';

const darkTheme = {
  ...baseTokens,
  colors: {
    ...baseTokens.colors,
    background: '#1A1A1A',
    surface: '#2D2D2D',
    textPrimary: '#FFFFFF',
    textSecondary: '#CCCCCC',
  },
};
```

## Best Practices

### Do's ✅

- Use design tokens for all styling
- Follow component composition patterns
- Test accessibility with screen readers
- Maintain consistent spacing and typography
- Use semantic color names (primary, error, etc.)

### Don'ts ❌

- Hard-code colors or spacing values
- Override component internals
- Ignore accessibility requirements
- Mix different design patterns
- Use arbitrary font sizes or weights

## Migration Guide

### From Custom Styles

Replace hard-coded values with design tokens:

```typescript
// Before
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4A7C59',
    padding: 16,
    borderRadius: 20,
  },
});

// After
const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
  },
});
```

### Component Updates

Update existing components to use the new design system:

```typescript
// Before
<TouchableOpacity style={customButtonStyle}>
  <Text style={customTextStyle}>Save</Text>
</TouchableOpacity>

// After
<Button title="Save" variant="primary" onPress={handleSave} />
```

## Resources

- [Design Tokens Reference](./tokens/tokens.ts)
- [Component Documentation](./components/ui/)
- [Accessibility Guidelines](https://reactnative.dev/docs/accessibility)
- [Testing Best Practices](https://testing-library.com/docs/react-native-testing-library/intro)

## Support

For questions about the design system:

1. Check the component documentation
2. Review the design tokens
3. Look at existing usage examples
4. Consult the accessibility guidelines
5. Create an issue for missing features

The ParentPal Design System is continuously evolving to meet the needs of our users while maintaining consistency and accessibility across all platforms.