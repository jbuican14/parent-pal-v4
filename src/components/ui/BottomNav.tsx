import React from 'react';
import { colors, typography, components, shadows, spacing } from '../../tokens/tokens';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number;
  path: string;
}

export interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onItemPress: (id: string) => void;
  style?: React.CSSProperties;
}

export default function BottomNav({
  items,
  activeId,
  onItemPress,
  style,
}: BottomNavProps) {
  return (
    <nav style={{
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: colors.surface,
      height: components.bottomNav.height,
      paddingTop: components.bottomNav.paddingVertical,
      paddingBottom: components.bottomNav.paddingVertical,
      paddingLeft: spacing.base,
      paddingRight: spacing.base,
      borderTop: `1px solid ${colors.border}`,
      boxShadow: shadows.md,
      ...style,
    }}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        
        return (
          <button
            key={item.id}
            onClick={() => onItemPress(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: spacing.xs,
              paddingBottom: spacing.xs,
              minHeight: '44px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              position: 'relative',
            }}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div style={{
              position: 'relative',
              marginBottom: '2px',
              color: isActive ? colors.primary : colors.textMuted,
            }}>
              {isActive && item.activeIcon ? item.activeIcon : item.icon}
              {item.badge && item.badge > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: colors.error,
                  borderRadius: '10px',
                  minWidth: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}>
                  <span style={{
                    color: colors.textOnPrimary,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    lineHeight: '16px',
                  }}>
                    {item.badge > 99 ? '99+' : item.badge.toString()}
                  </span>
                </div>
              )}
            </div>
            
            <span style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: isActive ? colors.primary : colors.textMuted,
              textAlign: 'center',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
