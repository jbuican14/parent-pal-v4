import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  default: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Supabase client
const mockSupabaseAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
  getSession: jest.fn(),
  resend: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
  refreshSession: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// Import components after mocking
import SignUp from '@/screens/Auth/SignUp';
import Login from '@/screens/Auth/Login';
import VerifyEmail from '@/screens/Auth/VerifyEmail';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Helper component to test useAuth hook
const AuthTestComponent = () => {
  const { user, session, signUp, signIn, signOut } = useAuth();
  return (
    <>
      <div testID="user-status">{user ? 'authenticated' : 'unauthenticated'}</div>
      <div testID="session-status">{session ? 'has-session' : 'no-session'}</div>
    </>
  );
};

describe('Auth Flows Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  describe('SignUp Component', () => {
    it('should render sign up form correctly', () => {
      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SignUp />
        </TestWrapper>
      );

      expect(getByPlaceholderText('Full Name')).toBeTruthy();
      expect(getByPlaceholderText('Email Address')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
      expect(getByText('Create Account')).toBeTruthy();
    });

    it('should validate form fields before submission', async () => {
      const { getByText } = render(
        <TestWrapper>
          <SignUp />
        </TestWrapper>
      );

      const createAccountButton = getByText('Create Account');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please enter your full name',
        });
      });
    });

    it('should call signUp and navigate to verify screen on successful registration', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SignUp />
        </TestWrapper>
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');

      // Submit form
      const createAccountButton = getByText('Create Account');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: { full_name: 'John Doe' },
          },
        });
      });

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith('/auth/verify-email');
      });
    });

    it('should show error message on sign up failure', async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' },
      });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SignUp />
        </TestWrapper>
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');

      // Submit form
      const createAccountButton = getByText('Create Account');
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Sign Up Failed',
          text2: 'Email already registered',
        });
      });
    });
  });

  describe('Login Component', () => {
    it('should render login form correctly', () => {
      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(getByPlaceholderText('Email Address')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('should call signIn and navigate to tabs on successful login', async () => {
      const mockUser = { 
        id: '123', 
        email: 'test@example.com',
        email_confirmed_at: '2023-01-01T00:00:00Z'
      };
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      // Submit form
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('should navigate to verify email if user is not verified', async () => {
      const mockUser = { 
        id: '123', 
        email: 'test@example.com',
        email_confirmed_at: null
      };
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

      // Submit form
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith('/auth/verify-email');
      });
    });
  });

  describe('VerifyEmail Component', () => {
    it('should render verification screen correctly', () => {
      const mockUser = { email: 'test@example.com', email_confirmed_at: null };
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { getByText } = render(
        <TestWrapper>
          <VerifyEmail />
        </TestWrapper>
      );

      expect(getByText('Verify Your Email')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('Resend Email')).toBeTruthy();
    });

    it('should poll for email verification and navigate on success', async () => {
      const mockUser = { email: 'test@example.com', email_confirmed_at: null };
      
      // First call returns unverified, second call returns verified
      mockSupabaseAuth.getUser
        .mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { ...mockUser, email_confirmed_at: '2023-01-01T00:00:00Z' } },
          error: null,
        });

      render(
        <TestWrapper>
          <VerifyEmail />
        </TestWrapper>
      );

      // Wait for polling to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5100)); // Wait for first poll
      });

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      }, { timeout: 10000 });
    });

    it('should resend verification email when requested', async () => {
      const mockUser = { email: 'test@example.com', email_confirmed_at: null };
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      mockSupabaseAuth.resend.mockResolvedValue({ error: null });

      const { getByText } = render(
        <TestWrapper>
          <VerifyEmail />
        </TestWrapper>
      );

      const resendButton = getByText('Resend Email');
      fireEvent.press(resendButton);

      await waitFor(() => {
        expect(mockSupabaseAuth.resend).toHaveBeenCalledWith({
          type: 'signup',
          email: 'test@example.com',
        });
      });

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: 'success',
          text1: 'Email Sent',
          text2: 'Please check your inbox for the verification email',
        });
      });
    });
  });

  describe('useAuth Hook', () => {
    it('should provide authentication state and methods', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      expect(getByTestId('user-status')).toHaveTextContent('unauthenticated');
      expect(getByTestId('session-status')).toHaveTextContent('no-session');
    });

    it('should persist session using AsyncStorage', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const AsyncStorage = require('@react-native-async-storage/async-storage');

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@parentpal_session',
          JSON.stringify(mockSession)
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@parentpal_user',
          JSON.stringify(mockSession.user)
        );
      });
    });
  });
});