import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Shuffle, Loader, CheckCircle, AlertCircle } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

export const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = searchParams.get('mode') === 'signin' ? 'signin' : 'signup';
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { signIn, signUp, loading } = useAuth();

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signin' || urlMode === 'signup') {
      setMode(urlMode);
    }

  //   // Check if user just verified their email
  //   const verified = searchParams.get('verified');
  //   if (verified === 'true') {
  //     setSuccessMessage('✅ Email verified successfully! You can now sign in.');
  //     setMode('signin');
  //   }
  // }, [searchParams]);

    useEffect(() => {
  const { data, error } = await supabase.auth.getSession();
  if (data.session) {
    setMode('signin')
  }
}, []);

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    // Ensure at least one character from each category
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({ 
      ...prev, 
      password, 
      confirmPassword: password 
    }));
  };

  const validateForm = () => {
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
    }
    
    if (!formData.email.trim()) {
      throw new Error('Email is required');
    }
    
    if (!formData.password) {
      throw new Error('Password is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      throw new Error('Please enter a valid email address');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      validateForm();

      if (mode === 'signup') {
        console.log('Submitting signup form');
        await signUp(formData.email, formData.password, formData.name);
        // If we reach here, signup was successful and user is signed in immediately
        // (no email confirmation required)
      } else {
        console.log('Submitting signin form');
        await signIn(formData.email, formData.password);
        // If we reach here, signin was successful and user will be redirected by App component
      }
    } catch (err) {
      console.error('Auth error:', err);
      let errorMessage = 'An error occurred';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Handle specific Supabase errors
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (errorMessage.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (errorMessage.includes('Password should be at least 6 characters')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (errorMessage.includes('Signup requires a valid password')) {
          errorMessage = 'Please enter a valid password (at least 6 characters).';
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear errors when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const toggleMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin';
    setMode(newMode);
    navigate(`/auth?mode=${newMode}`, { replace: true });
    setError('');
    setSuccessMessage('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Mobile-first container - 375px max width */}
      <div className="w-full max-w-[375px] bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800 mb-6">ParentPal</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {mode === 'signup' ? 'Join ParentPal' : 'Welcome Back'}
          </h2>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input - Only for signup */}
            {mode === 'signup' && (
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:bg-green-50 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  placeholder="Full Name"
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:bg-green-50 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                placeholder="Email"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:bg-green-50 focus:ring-2 focus:ring-green-200 transition-all duration-200 pr-20"
                placeholder="Password"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {mode === 'signup' && (
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-gray-500 hover:text-green-700 transition-colors duration-200"
                    title="Auto-generate secure password"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-green-700 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                {/* Auto-generate password text */}
                <p className="text-xs text-green-700 -mt-2">
                  Click shuffle icon to auto-generate secure password
                </p>

                {/* Confirm Password Input */}
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:bg-green-50 focus:ring-2 focus:ring-green-200 transition-all duration-200 pr-12"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-700 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-700 text-white rounded-xl font-medium hover:bg-green-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Sign Up' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-green-700 hover:text-green-800 font-medium transition-colors duration-200"
            >
              {mode === 'signup' 
                ? 'Already have an account? Log in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>

          {/* Email confirmation notice for signup */}
          {mode === 'signup' && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">Email Verification Required</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      After signing up, you'll receive a confirmation email. Click the link in the email to activate your account before signing in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GDPR Compliance */}
          {mode === 'signup' && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Your data is secure and GDPR compliant. We ensure fast and reliable access to your parenting resources.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};