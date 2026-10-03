"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api/client";
import { UserProfile, UserRole, AuthSession, AuthContextType } from "@/types/auth";
import { useRouter } from "next/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchBackendProfile = useCallback(async () => {
    try {
      const profile = await api.get<UserProfile>("/auth/me/");
      setUser(profile);
      return profile;
    } catch (err: unknown) {
      console.warn("Could not fetch Django profile, checking sync fallback:", err);
      // Fallback: If Django user was not found, attempt to sync from Supabase auth session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession?.user) {
        const authUser = currentSession.user;
        const metadata = authUser.user_metadata || {};
        const appMetadata = authUser.app_metadata || {};
        const resolvedRole: UserRole =
          appMetadata.role || metadata.role || "Agent";

        try {
          const syncRes = await api.post<{ user: UserProfile }>("/auth/sync/", {
            supabase_uid: authUser.id,
            email: authUser.email,
            first_name: metadata.first_name || "",
            last_name: metadata.last_name || "",
            phone_number: metadata.phone || "",
            role: resolvedRole,
          });
          if (syncRes?.user) {
            setUser(syncRes.user);
            return syncRes.user;
          }
        } catch (syncErr) {
          console.error("Failed to sync user with backend:", syncErr);
        }
      }
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    await fetchBackendProfile();
  }, [fetchBackendProfile]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession && mounted) {
          setSession({
            accessToken: initialSession.access_token,
            refreshToken: initialSession.refresh_token,
            expiresAt: initialSession.expires_at,
          });

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (newSession) {
        setSession({
          accessToken: newSession.access_token,
          refreshToken: newSession.refresh_token,
          expiresAt: newSession.expires_at,
        });

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await fetchBackendProfile();
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchBackendProfile]);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const role: UserRole | null = user?.role || null;
  const isAuthenticated = !!session && !!user;

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
