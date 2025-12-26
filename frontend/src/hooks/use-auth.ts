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
    password_confirm: string;
    company_name?: string;
    role?: 'admin' | 'manager' | 'employee';
  }) => {
    try {
      // Transform the data to match Django serializer expectations
      const apiData = {
        email: data.email,
        name: data.name,
        password: data.password,
        password_confirm: data.password_confirm, // password_confirm matches Django expectation
        role: data.role || 'employee',
        // company is optional and would need to be handled separately
      };
      
      console.log('Sending registration data:', apiData); // Debug log
      
      const response = await authApi.register(apiData);
      setTokens(response.tokens);
      setUser(response.user);
      return { success: true };
    } catch (error: unknown) {
      console.error('Registration error:', error);
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
