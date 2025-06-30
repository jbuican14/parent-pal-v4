import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TextInput from '../TextInput';

describe('TextInput', () => {
  it('renders correctly with label', () => {
    const { getByText, getByDisplayValue } = render(
      <TextInput label="Test Label" value="Test Value" />
    );
    
    expect(getByText('Test Label')).toBeTruthy();
    expect(getByDisplayValue('Test Value')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <TextInput label="Required Field" required />
    );
    
    expect(getByText('Required Field')).toBeTruthy();
    expect(getByText('*')).toBeTruthy();
  });

  it('displays error message', () => {
    const { getByText } = render(
      <TextInput label="Test Field" error="This field is required" />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('displays helper text', () => {
    const { getByText } = render(
      <TextInput label="Test Field" helperText="Enter your email address" />
    );
    
    expect(getByText('Enter your email address')).toBeTruthy();
  });

  it('calls onFocus and onBlur handlers', () => {
    const mockOnFocus = jest.fn();
    const mockOnBlur = jest.fn();
    
    const { getByDisplayValue } = render(
      <TextInput 
        value="Test"
        onFocus={mockOnFocus}
        onBlur={mockOnBlur}
      />
    );
    
    const input = getByDisplayValue('Test');
    
    fireEvent(input, 'focus');
    expect(mockOnFocus).toHaveBeenCalledTimes(1);
    
    fireEvent(input, 'blur');
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });

  it('applies correct accessibility properties', () => {
    const { getByLabelText } = render(
      <TextInput 
        label="Email Address"
        testID="email-input"
        editable={false}
      />
    );
    
    const input = getByLabelText('Email Address');
    expect(input.props.accessibilityState.disabled).toBe(true);
  });

  it('renders different variants correctly', () => {
    const { rerender, getByDisplayValue } = render(
      <TextInput value="Default" variant="default" />
    );
    
    let input = getByDisplayValue('Default');
    expect(input).toBeTruthy();
    
    rerender(<TextInput value="Filled" variant="filled" />);
    input = getByDisplayValue('Filled');
    expect(input).toBeTruthy();
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByDisplayValue } = render(
      <TextInput value="Small" size="sm" />
    );
    
    let input = getByDisplayValue('Small');
    expect(input).toBeTruthy();
    
    rerender(<TextInput value="Medium" size="md" />);
    input = getByDisplayValue('Medium');
    expect(input).toBeTruthy();
    
    rerender(<TextInput value="Large" size="lg" />);
    input = getByDisplayValue('Large');
    expect(input).toBeTruthy();
  });
});