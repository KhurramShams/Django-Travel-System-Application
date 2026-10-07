"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User as UserIcon,
  Menu,
} from "lucide-react";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, signOut, isLoading } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Dynamic real-time health indicator polling every 30 seconds
  const { data: healthData, isError } = useQuery({
    queryKey: ["core-api-health"],
    queryFn: () => api.get<{ status: string; database?: string }>("/health/"),
    refetchInterval: 30000,
    retry: 1,
  });

  const isHealthy = !isError && healthData?.status === "healthy";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
      {/* Left: Mobile Navigation Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: Dynamic System Status & Clean User Menu */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Dynamic Health Indicator */}
        {isHealthy ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Core API Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span>Core API Disconnected</span>
          </div>
        )}

        {/* Clean User Profile Dropdown (without static role label) */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pr-3 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white shadow-xs">
              {user?.first_name ? user.first_name[0].toUpperCase() : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight dark:text-slate-100">
                {user?.full_name || user?.first_name || user?.email?.split("@")[0] || "Travel Agent"}
              </p>
            </div>
          </button>

          {/* Profile Dropdown Panel */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {user?.full_name || user?.first_name || "Khas Travels User"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {user?.email || "user@khastravels.com"}
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await signOut();
                    }}
                    isLoading={isLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
