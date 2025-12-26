'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/lib/auth-store';
import { authApi } from '@/src/lib/api-client';

export function useAuth() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading, setUser, setTokens, logout, setLoading } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated and fetch current user
    const checkAuth = async () => {
      if (tokens?.access && !user) {
        try {
          const currentUser = await authApi.me();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          logout();
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [tokens, user, setUser, logout, setLoading]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setTokens(response.tokens);
      setUser(response.user);
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed. Please try again.',
      };
    }
  };

  const register = async (data: {
    email: string;
    name: string;
    password: string;
    password2: string;
    company_name?: string;
    role?: 'admin' | 'manager' | 'employee';
  }) => {
    try {
      const response = await authApi.register(data);
      setTokens(response.tokens);
      setUser(response.user);
      return { success: true };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as { response?: { data?: unknown } })?.response?.data || 'Registration failed. Please try again.',
      };
    }
  };

  const signOut = () => {
    logout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: signOut,
  };
}

export function useRequireAuth(redirectUrl = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  return { isAuthenticated, isLoading };
}
