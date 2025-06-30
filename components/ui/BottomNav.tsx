import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, typography, components, shadows, spacing } from '@/tokens/tokens';

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Active icon component (optional) */
  activeIcon?: React.ReactNode;
  /** Badge count (optional) */
  badge?: number;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export interface BottomNavProps {
  /** Navigation items */
  items: NavItem[];
  /** Currently active item ID */
  activeId: string;
  /** Item press handler */
  onItemPress: (id: string) => void;
  /** Custom style override */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export default function BottomNav({
  items,
  activeId,
  onItemPress,
  style,
  testID,
}: BottomNavProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => onItemPress(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.accessibilityLabel || item.label}
            testID={`nav-item-${item.id}`}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              {isActive && item.activeIcon ? item.activeIcon : item.icon}
              {item.badge && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge.toString()}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={[
              styles.label,
              isActive && styles.activeLabel,
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    height: components.bottomNav.height,
    paddingVertical: components.bottomNav.paddingVertical,
    paddingHorizontal: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.md,
  },
  
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    minHeight: 44, // Accessibility minimum touch target
  },
  
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.xs / 2,
  },
  
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    lineHeight: 16,
  },
  
  label: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  
  activeLabel: {
    color: colors.primary,
  },
});