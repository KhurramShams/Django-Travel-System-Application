"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/auth";

export interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  roles?: UserRole[];
  currentRole?: UserRole | null;
  collapsed?: boolean;
}

export function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  roles,
  currentRole,
  collapsed = false,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Filter based on RBAC roles if specified
  if (roles && currentRole && !roles.includes(currentRole)) {
    return null;
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-emerald-700/10 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-semibold"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
        )}
      />

      {!collapsed && (
        <>
          <span className="ml-3 truncate">{label}</span>
          {badge !== undefined && (
            <span
              className={cn(
                "ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                isActive
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
