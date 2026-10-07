"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";
import { UserProfile, UserRole, AuthSession, AuthContextType } from "@/types/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchBackendProfile = useCallback(async () => {
    try {
      const profile = await api.get<UserProfile>("/auth/me/");
      if (profile) {
        setUser(profile);
        localStorage.setItem("auth_user", JSON.stringify(profile));
        return profile;
      }
      return null;
    } catch (err: unknown) {
      console.warn("Could not fetch Django user profile:", err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchBackendProfile();
  }, [fetchBackendProfile]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const token =
          localStorage.getItem("auth_token") ||
          localStorage.getItem("test_auth_token");

        const cachedUserStr =
          localStorage.getItem("auth_user") ||
          localStorage.getItem("test_auth_user");

        if (token && mounted) {
          if (cachedUserStr) {
            try {
              const parsed = JSON.parse(cachedUserStr) as UserProfile;
              setUser(parsed);
            } catch (e) {
              console.error("Failed to parse cached user:", e);
            }
          }

          setSession({
            accessToken: token,
            refreshToken: "native-session",
            expiresAt: Math.floor(Date.now() / 1000) + 86400 * 30,
          });

          // Fetch fresh profile from backend
          await fetchBackendProfile();
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [fetchBackendProfile]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("test_auth_token");
        localStorage.removeItem("test_auth_user");
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "test_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }
      setUser(null);
      setSession(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const role: UserRole | null = user?.role || null;
  const isAuthenticated = Boolean(session && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        session,
        isLoading,
        isAuthenticated,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
