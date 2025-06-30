import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import BottomNav from '../BottomNav';

const mockItems = [
  {
    id: 'home',
    label: 'Home',
    icon: <Text>🏠</Text>,
    activeIcon: <Text>🏠</Text>,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <Text>👤</Text>,
    badge: 3,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Text>⚙️</Text>,
  },
];

describe('BottomNav', () => {
  it('renders all navigation items', () => {
    const { getByText } = render(
      <BottomNav 
        items={mockItems}
        activeId="home"
        onItemPress={() => {}}
      />
    );
    
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('calls onItemPress when item is pressed', () => {
    const mockOnItemPress = jest.fn();
    const { getByTestId } = render(
      <BottomNav 
        items={mockItems}
        activeId="home"
        onItemPress={mockOnItemPress}
      />
    );
    
    fireEvent.press(getByTestId('nav-item-profile'));
    expect(mockOnItemPress).toHaveBeenCalledWith('profile');
  });

  it('shows active state correctly', () => {
    const { getByTestId } = render(
      <BottomNav 
        items={mockItems}
        activeId="home"
        onItemPress={() => {}}
      />
    );
    
    const homeItem = getByTestId('nav-item-home');
    expect(homeItem.props.accessibilityState.selected).toBe(true);
    
    const profileItem = getByTestId('nav-item-profile');
    expect(profileItem.props.accessibilityState.selected).toBe(false);
  });

  it('displays badge when provided', () => {
    const { getByText } = render(
      <BottomNav 
        items={mockItems}
        activeId="home"
        onItemPress={() => {}}
      />
    );
    
    expect(getByText('3')).toBeTruthy();
  });

  it('displays 99+ for badges over 99', () => {
    const itemsWithLargeBadge = [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <Text>🔔</Text>,
        badge: 150,
      },
    ];
    
    const { getByText } = render(
      <BottomNav 
        items={itemsWithLargeBadge}
        activeId="notifications"
        onItemPress={() => {}}
      />
    );
    
    expect(getByText('99+')).toBeTruthy();
  });

  it('applies correct accessibility properties', () => {
    const { getByTestId } = render(
      <BottomNav 
        items={mockItems}
        activeId="home"
        onItemPress={() => {}}
      />
    );
    
    const homeItem = getByTestId('nav-item-home');
    expect(homeItem.props.accessibilityRole).toBe('tab');
    expect(homeItem.props.accessibilityLabel).toBe('Home');
  });

  it('uses custom accessibility label when provided', () => {
    const itemsWithCustomLabel = [
      {
        id: 'home',
        label: 'Home',
        icon: <Text>🏠</Text>,
        accessibilityLabel: 'Navigate to Home Screen',
      },
    ];
    
    const { getByTestId } = render(
      <BottomNav 
        items={itemsWithCustomLabel}
        activeId="home"
        onItemPress={() => {}}
      />
    );
    
    const homeItem = getByTestId('nav-item-home');
    expect(homeItem.props.accessibilityLabel).toBe('Navigate to Home Screen');
  });
});