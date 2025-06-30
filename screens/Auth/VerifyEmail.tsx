import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, CircleCheck as CheckCircle, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';

export default function VerifyEmail() {
  const [isVerified, setIsVerified] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const { user, checkEmailVerification, resendVerification } = useAuth();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const maxPollAttempts = 60; // 5 minutes of polling (60 * 5 seconds)

  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      setIsVerified(true);
      setIsPolling(false);
      handleVerificationSuccess();
      return;
    }

    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user]);

  const startPolling = () => {
    pollCountRef.current = 0;
    setIsPolling(true);

    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      try {
        const isEmailVerified = await checkEmailVerification();
        
        if (isEmailVerified) {
          setIsVerified(true);
          setIsPolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          handleVerificationSuccess();
          return;
        }

        // Stop polling after max attempts
        if (pollCountRef.current >= maxPollAttempts) {
          setIsPolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          Toast.show({
            type: 'info',
            text1: 'Verification Timeout',
            text2: 'Please try resending the verification email',
          });
        }
      } catch (error) {
        console.error('Error checking email verification:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleVerificationSuccess = () => {
    Toast.show({
      type: 'success',
      text1: 'Email Verified!',
      text2: 'Welcome to ParentPal',
    });

    // Navigate to main app after a short delay
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleResendVerification = async () => {
    if (!user?.email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No email address found',
      });
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await resendVerification(user.email);
      
      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Resend Failed',
          text2: error.message,
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Please check your inbox for the verification email',
      });

      // Restart polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      startPolling();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    Alert.alert(
      'Go Back to Login?',
      'You will need to sign in again. Make sure to verify your email before signing in.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Go Back',
          style: 'default',
          onPress: () => router.replace('/auth/login'),
        },
      ]
    );
  };

  if (isVerified) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#10B981" />
          </View>
          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtitle}>
            Your email has been successfully verified. Redirecting you to the app...
          </Text>
          <ActivityIndicator size="large" color="#8B5CF6" style={styles.loader} />
        </View>
        <Toast />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={64} color="#8B5CF6" />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification email to{'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Text>

        <Text style={styles.instructions}>
          Click the link in the email to verify your account. This page will automatically update once verified.
        </Text>

        {isPolling && (
          <View style={styles.pollingContainer}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.pollingText}>Checking for verification...</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.resendButton, resendLoading && styles.buttonDisabled]}
            onPress={handleResendVerification}
            disabled={resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color="#8B5CF6" size="small" />
            ) : (
              <>
                <RefreshCw size={16} color="#8B5CF6" />
                <Text style={styles.resendButtonText}>Resend Email</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Didn't receive the email? Check your spam folder or try resending.
          </Text>
        </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  successIcon: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  instructions: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
    lineHeight: 20,
  },
  pollingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  pollingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  helpContainer: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  loader: {
    marginTop: 24,
  },
});