import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface EmailVerificationSentProps {
  email: string;
}

export const EmailVerificationSent: React.FC<EmailVerificationSentProps> = ({ email }) => {
  const navigate = useNavigate();
  const { resendVerificationEmail } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // If no email provided, redirect to auth
    if (!email) {
      navigate('/auth?mode=signup');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect to onboarding/family setup after countdown
          navigate('/onboarding');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, email]);

  const handleResendEmail = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      await resendVerificationEmail(email);
    } catch (error) {
      console.error('Failed to resend email:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Mobile-first container - 375px max width */}
      <div className="w-full max-w-[375px] bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800 mb-6">ParentPal</h1>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Check your email</h2>
          
          <p className="text-gray-600 mb-2">
            We've sent a verification email to
          </p>
          <p className="font-semibold text-gray-800 mb-6">{email}</p>
          
          <p className="text-gray-600 mb-8">
            Click the link in the email to verify your account and complete your registration.
          </p>

          {/* Auto-redirect notice */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 text-sm font-medium">
                Setting up your account...
              </p>
            </div>
            <p className="text-green-700 text-sm">
              Redirecting to family setup in {countdown} seconds
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full py-3 border-2 border-green-700 text-green-700 rounded-xl font-medium hover:bg-green-50 transition-colors duration-200 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend email'}
            </button>

            <button
              onClick={() => navigate('/onboarding')}
              className="w-full py-3 bg-green-700 text-white rounded-xl font-medium hover:bg-green-800 transition-colors duration-200"
            >
              Continue to setup
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              Didn't receive the email? Check your spam folder or try resending.
              The verification link expires in 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};