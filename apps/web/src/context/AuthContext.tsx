'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signupWithEmail: (email: string, pass: string, name?: string) => Promise<{ error: any }>;
  loginWithGoogle: () => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  loginWithEmail: async () => ({ error: null }),
  signupWithEmail: async () => ({ error: null }),
  loginWithGoogle: async () => ({ error: null }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local session or mock in dev
    const storedToken = localStorage.getItem('careergps_auth_token');
    const storedUser = localStorage.getItem('careergps_auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Parse error fallback
      }
    }

    // 2. Listen to Supabase Auth state changes if online
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
          setToken(session.access_token);
          localStorage.setItem('careergps_auth_token', session.access_token);
          localStorage.setItem('careergps_auth_user', JSON.stringify(session.user));
          trackEvent('user_logged_in', { provider: session.user.app_metadata.provider || 'email' });
        } else if (!storedToken) {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      }
    );

    setLoading(false);
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    // Real Supabase call
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      // In local development sandbox where Supabase project keys are dummy placeholders,
      // allow simulated login only if NOT in production
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev && (error.message.includes('FetchError') || error.message.includes('Invalid API key') || error.message.includes('Failed to fetch'))) {
        const mockUser: User = {
          id: `usr_${Date.now()}`,
          email,
          user_metadata: { full_name: email.split('@')[0] },
        };
        const mockToken = 'mock_jwt_token_for_local_development_verification';
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('careergps_auth_token', mockToken);
        localStorage.setItem('careergps_auth_user', JSON.stringify(mockUser));
        trackEvent('user_logged_in', { mode: 'local_sandbox' });
        setLoading(false);
        return { error: null };
      }
      setLoading(false);
      return { error };
    }

    if (data.session) {
      setUser(data.session.user);
      setToken(data.session.access_token);
      localStorage.setItem('careergps_auth_token', data.session.access_token);
      localStorage.setItem('careergps_auth_user', JSON.stringify(data.session.user));
      trackEvent('user_logged_in', { provider: 'email' });
    }
    setLoading(false);
    return { error: null };
  };

  const signupWithEmail = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name || email.split('@')[0] },
      },
    });

    if (error) {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev && (error.message.includes('FetchError') || error.message.includes('Invalid API key') || error.message.includes('Failed to fetch'))) {
        const mockUser: User = {
          id: `usr_${Date.now()}`,
          email,
          user_metadata: { full_name: name || email.split('@')[0] },
        };
        const mockToken = 'mock_jwt_token_for_local_development_verification';
        setUser(mockUser);
        setToken(mockToken);
        localStorage.setItem('careergps_auth_token', mockToken);
        localStorage.setItem('careergps_auth_user', JSON.stringify(mockUser));
        trackEvent('user_signed_up', { mode: 'local_sandbox' });
        setLoading(false);
        return { error: null };
      }
      setLoading(false);
      return { error };
    }

    if (data.session) {
      setUser(data.session.user);
      setToken(data.session.access_token);
      localStorage.setItem('careergps_auth_token', data.session.access_token);
      localStorage.setItem('careergps_auth_user', JSON.stringify(data.session.user));
    }
    trackEvent('user_signed_up', { provider: 'email' });
    setLoading(false);
    return { error: null };
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    localStorage.removeItem('careergps_auth_token');
    localStorage.removeItem('careergps_auth_user');
    trackEvent('user_logged_out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
