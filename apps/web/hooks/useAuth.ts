"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/store/authStore";
import { apiClient } from "@/lib/api/client";
import { LoginInput, RegisterData } from "@/lib/schemas/auth";

export const useAuth = () => {
  const { user, token, loading, isAuthenticated, setAuth, clearAuth, setLoading } = useAuthStore();
  const router = useRouter();

  console.log("🔐 useAuth hook state:", { 
    user: user?.username || "null", 
    hasToken: !!token, 
    loading, 
    isAuthenticated 
  });

  // Initialize auth on mount
  useEffect(() => {
    console.log("🔐 useAuth: Initializing auth...");
    
    const initAuth = async () => {
      // Check both localStorage and cookies for token
      const savedToken = localStorage.getItem('pythia-auth-token') || getCookie('pythia-auth-token');
      console.log("🔐 useAuth: Saved token exists:", !!savedToken);
      
      if (savedToken && !user) {
        console.log("🔐 useAuth: Setting loading true, fetching user data...");
        setLoading(true);
        try {
          apiClient.setToken(savedToken);
          console.log("🔐 useAuth: Making getCurrentUser API call...");
          const userData = await apiClient.getCurrentUser();
          console.log("🔐 useAuth: Got user data:", userData);
          setAuth(userData, savedToken);
          console.log("🔐 useAuth: Auth state set successfully");
        } catch (error) {
          console.error("🔐 useAuth: Failed to get user data:", error);
          localStorage.removeItem('pythia-auth-token');
          deleteCookie('pythia-auth-token');
          apiClient.setToken(null);
        } finally {
          console.log("🔐 useAuth: Setting loading false");
          setLoading(false);
        }
      } else if (user && token) {
        console.log("🔐 useAuth: User already authenticated, setting API token");
        apiClient.setToken(token);
      } else {
        console.log("🔐 useAuth: No saved token or user already loaded, ensuring loading is false");
        // Ensure loading is false when there's no token to check
        if (loading) {
          setLoading(false);
        }
      }
    };

    initAuth();
  }, [user, setAuth, setLoading, token, loading]);

  // Helper functions for cookie management
  const setCookie = (name: string, value: string, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };

  const login = useCallback(async (credentials: LoginInput) => {
    console.log("🔐 useAuth: Starting login process...");
    setLoading(true);
    try {
      const response = await apiClient.login(credentials);
      console.log("🔐 useAuth: Login successful, storing token and setting auth");
      
      // Store token in both localStorage and cookies
      localStorage.setItem('pythia-auth-token', response.access_token);
      setCookie('pythia-auth-token', response.access_token);
      apiClient.setToken(response.access_token);
      setAuth(response.user, response.access_token);
      
      toast({
        title: "Welcome back!",
        description: `Hello, ${response.user.username}`,
      });
      
      console.log("🔐 useAuth: Redirecting to /chat");
      router.replace("/chat");
    } catch (error: any) {
      console.error("🔐 useAuth: Login failed:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setAuth, setLoading, router]);

  const register = useCallback(async (userData: RegisterData) => {
    console.log("🔐 useAuth: Starting registration process...");
    setLoading(true);
    try {
      const response = await apiClient.register(userData);
      console.log("🔐 useAuth: Registration successful");
      
      // Store token in both localStorage and cookies
      localStorage.setItem('pythia-auth-token', response.access_token);
      setCookie('pythia-auth-token', response.access_token);
      apiClient.setToken(response.access_token);
      setAuth(response.user, response.access_token);
      
      toast({
        title: "Account created!",
        description: `Welcome to Pythia, ${response.user.username}`,
      });
      
      console.log("🔐 useAuth: Redirecting to /chat");
      router.replace("/chat");
    } catch (error: any) {
      console.error("🔐 useAuth: Registration failed:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setAuth, setLoading, router]);

  const logout = useCallback(() => {
    console.log("🔐 useAuth: Logging out...");
    localStorage.removeItem('pythia-auth-token');
    deleteCookie('pythia-auth-token');
    apiClient.setToken(null);
    clearAuth();
    
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    
    router.push("/login");
  }, [clearAuth, router]);

  return {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}; 