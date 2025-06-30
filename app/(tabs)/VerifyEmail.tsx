import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setError('Invalid verification link');
      return;
    }

    const handleVerification = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        
        // Redirect to onboarding after a short delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
    };

    handleVerification();
  }, [searchParams, verifyEmail, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[375px] bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 text-center border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800 mb-6">ParentPal</h1>
        </div>

        <div className="p-6 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Verifying your email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Email verified successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your account has been created and verified. You'll be redirected to complete your setup in a moment.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 text-sm">
                  Redirecting to your account setup...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification failed</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/auth?mode=signup')}
                  className="w-full py-3 bg-green-700 text-white rounded-xl font-medium hover:bg-green-800 transition-colors duration-200"
                >
                  Try signing up again
                </button>
                <button
                  onClick={() => navigate('/auth?mode=signin')}
                  className="w-full py-3 border-2 border-green-700 text-green-700 rounded-xl font-medium hover:bg-green-50 transition-colors duration-200"
                >
                  Sign in instead
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};