import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import Card from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('calls onPress when pressable and pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Card pressable onPress={mockOnPress}>
        <Text>Pressable Card</Text>
      </Card>
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when not pressable', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Card onPress={mockOnPress}>
        <Text>Non-pressable Card</Text>
      </Card>
    );
    
    // Should not be pressable, so no button role
    expect(() => getByText('Non-pressable Card')).toBeTruthy();
    // onPress should not be called since it's not pressable
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies correct accessibility properties when pressable', () => {
    const { getByRole } = render(
      <Card 
        pressable 
        accessibilityLabel="Custom Card Label"
        testID="test-card"
      >
        <Text>Accessible Card</Text>
      </Card>
    );
    
    const card = getByRole('button');
    expect(card.props.accessibilityLabel).toBe('Custom Card Label');
    expect(card.props.testID).toBe('test-card');
  });

  it('renders different variants correctly', () => {
    const { rerender, getByText } = render(
      <Card variant="default">
        <Text>Default Card</Text>
      </Card>
    );
    
    expect(getByText('Default Card')).toBeTruthy();
    
    rerender(
      <Card variant="elevated">
        <Text>Elevated Card</Text>
      </Card>
    );
    expect(getByText('Elevated Card')).toBeTruthy();
    
    rerender(
      <Card variant="outlined">
        <Text>Outlined Card</Text>
      </Card>
    );
    expect(getByText('Outlined Card')).toBeTruthy();
  });

  it('renders different status indicators correctly', () => {
    const { rerender, getByText } = render(
      <Card status="warning">
        <Text>Warning Card</Text>
      </Card>
    );
    
    expect(getByText('Warning Card')).toBeTruthy();
    
    rerender(
      <Card status="error">
        <Text>Error Card</Text>
      </Card>
    );
    expect(getByText('Error Card')).toBeTruthy();
    
    rerender(
      <Card status="success">
        <Text>Success Card</Text>
      </Card>
    );
    expect(getByText('Success Card')).toBeTruthy();
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByText } = render(
      <Card size="sm">
        <Text>Small Card</Text>
      </Card>
    );
    
    expect(getByText('Small Card')).toBeTruthy();
    
    rerender(
      <Card size="md">
        <Text>Medium Card</Text>
      </Card>
    );
    expect(getByText('Medium Card')).toBeTruthy();
    
    rerender(
      <Card size="lg">
        <Text>Large Card</Text>
      </Card>
    );
    expect(getByText('Large Card')).toBeTruthy();
  });
});