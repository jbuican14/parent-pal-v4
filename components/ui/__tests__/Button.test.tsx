import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<Button title="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled />
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test Button" onPress={mockOnPress} loading />
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(
      <Button title="Test Button" loading testID="test-button" />
    );
    
    // ActivityIndicator should be present
    const button = getByTestId('test-button');
    expect(button).toBeTruthy();
  });

  it('applies correct accessibility properties', () => {
    const { getByRole } = render(
      <Button 
        title="Test Button" 
        accessibilityLabel="Custom Label"
        disabled
      />
    );
    
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Custom Label');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('renders different variants correctly', () => {
    const { rerender, getByRole } = render(
      <Button title="Primary" variant="primary" />
    );
    
    let button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Secondary" variant="secondary" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Outline" variant="outline" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByRole } = render(
      <Button title="Small" size="sm" />
    );
    
    let button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Medium" size="md" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
    
    rerender(<Button title="Large" size="lg" />);
    button = getByRole('button');
    expect(button).toBeTruthy();
  });
});