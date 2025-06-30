import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SESSION: '@parentpal_session',
  USER: '@parentpal_user',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          await storeSession(session);
        } else {
          setSession(null);
          setUser(null);
          await clearStoredSession();
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to get session from Supabase first
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        // Fallback to stored session
        await loadStoredSession();
        return;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        await storeSession(session);
      } else {
        // No active session, try to load from storage
        await loadStoredSession();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await loadStoredSession();
    } finally {
      setLoading(false);
    }
  };

  const storeSession = async (session: Session) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(session.user));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  };

  const loadStoredSession = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      
      if (storedSession && storedUser) {
        const parsedSession = JSON.parse(storedSession);
        const parsedUser = JSON.parse(storedUser);
        
        // Check if session is still valid
        if (parsedSession.expires_at && new Date(parsedSession.expires_at * 1000) > new Date()) {
          setSession(parsedSession);
          setUser(parsedUser);
          
          // Try to refresh the session
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession({
            refresh_token: parsedSession.refresh_token,
          });
          
          if (refreshedSession && !error) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            await storeSession(refreshedSession);
          }
        } else {
          // Session expired, clear storage
          await clearStoredSession();
        }
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
      await clearStoredSession();
    }
  };

  const clearStoredSession = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.SESSION, STORAGE_KEYS.USER]);
    } catch (error) {
      console.error('Error clearing stored session:', error);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        data: null, 
        error: { 
          message: 'An unexpected error occurred during sign up',
          name: 'UnexpectedError',
          status: 500,
        } as AuthError 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        data: null, 
        error: { 
          message: 'An unexpected error occurred during sign in',
          name: 'UnexpectedError',
          status: 500,
        } as AuthError 
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setSession(null);
        setUser(null);
        await clearStoredSession();
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred during sign out',
          name: 'UnexpectedError',
          status: 500,
        } as AuthError 
      };
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return false;
      }

      const isVerified = !!user.email_confirmed_at;
      
      if (isVerified && (!session?.user.email_confirmed_at)) {
        // Update local user state if verification status changed
        setUser(user);
        if (session) {
          const updatedSession = { ...session, user };
          setSession(updatedSession);
          await storeSession(updatedSession);
        }
      }
      
      return isVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      return { error };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred while resending verification email',
          name: 'UnexpectedError',
          status: 500,
        } as AuthError 
      };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    checkEmailVerification,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}