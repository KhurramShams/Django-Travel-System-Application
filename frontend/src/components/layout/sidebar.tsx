"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";
import { NavItem } from "./nav-item";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  LayoutDashboard,
  CalendarCheck,
  Package,
  Users,
  FileCheck2,
  Receipt,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plane,
  Ticket,
  RotateCcw,
  Hotel,
  BedDouble,
  Landmark,
  CreditCard,
  PlusCircle,
  Wallet,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { role, user } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200 bg-white duration-200 dark:border-slate-800 dark:bg-slate-950 transition-all",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 shadow-xs border border-slate-200/60 dark:border-slate-700/60">
            <Image
              src="/logo.png"
              alt="Khas Travels Logo"
              width={34}
              height={34}
              priority
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Khas Travels
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Management System
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Navigation Links */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {/* Core Operations */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Operations
            </p>
          )}
          <NavItem
            href="/"
            label="Dashboard"
            icon={LayoutDashboard}
            collapsed={collapsed}
          />
          <NavItem
            href="/travelers"
            label="Travelers & Pilgrims"
            icon={Users}
            collapsed={collapsed}
          />
          <NavItem
            href="/packages"
            label="Tour Packages"
            icon={Package}
            collapsed={collapsed}
          />
          <NavItem
            href="/enrollments"
            label="Package Enrollments"
            icon={CalendarCheck}
            collapsed={collapsed}
          />
        </div>

        {/* Flight Ticketing (Module 3) */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Flight Ticketing
            </p>
          )}
          <NavItem
            href="/tickets"
            label="Purchased Tickets"
            icon={Ticket}
            collapsed={collapsed}
          />
          <NavItem
            href="/tickets/book"
            label="Book AirLine Ticket"
            icon={Plane}
            collapsed={collapsed}
          />
          <NavItem
            href="/tickets/refunds"
            label="Refund Ticket"
            icon={RotateCcw}
            collapsed={collapsed}
          />
        </div>

        {/* Hotel Bookings (Module 4) */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Hotels & Lodging
            </p>
          )}
          <NavItem
            href="/hotels"
            label="Hotel Bookings"
            icon={Hotel}
            collapsed={collapsed}
          />
          <NavItem
            href="/hotels/book"
            label="Book Hotel"
            icon={BedDouble}
            collapsed={collapsed}
          />
        </div>

        {/* Financial Section (Admin & Accountant) */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Finance & Accounts
            </p>
          )}
          <NavItem
            href="/finance/travelers"
            label="Traveler Accounts"
            icon={Receipt}
            roles={["Admin", "Accountant"]}
            currentRole={role}
            collapsed={collapsed}
          />
          <NavItem
            href="/finance/travelers/balances"
            label="Remaining Balances"
            icon={Building2}
            roles={["Admin", "Accountant"]}
            currentRole={role}
            collapsed={collapsed}
          />
          <NavItem
            href="/finance/payments"
            label="Office Payments"
            icon={CreditCard}
            roles={["Admin", "Accountant"]}
            currentRole={role}
            collapsed={collapsed}
          />
          <NavItem
            href="/finance/payments/new"
            label="Record Payment"
            icon={PlusCircle}
            roles={["Admin", "Accountant"]}
            currentRole={role}
            collapsed={collapsed}
          />
          <NavItem
            href="/finance/expenses"
            label="Daily Expenses"
            icon={Wallet}
            roles={["Admin", "Accountant"]}
            currentRole={role}
            collapsed={collapsed}
          />
          <NavItem
            href="/finance/accounts"
            label="Bank Accounts"
            icon={Landmark}
            roles={["Admin", "Accountant"]}
            currentRole={role}
            collapsed={collapsed}
          />
          <NavItem
            href="/transactions"
            label="Master Ledger"
            icon={BookOpen}
            roles={["Admin", "Accountant"]}
            currentRole={role}
            collapsed={collapsed}
          />
        </div>

        {/* System Administration (Admin only) */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Administration
            </p>
          )}
          <NavItem
            href="/admin/users"
            label="User Management"
            icon={ShieldCheck}
            roles={["Admin"]}
            currentRole={role}
            collapsed={collapsed}
          />
        </div>
      </div>

      {/* Role Footer */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        {!collapsed ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
            <div className="truncate">
              <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-200">
                {user?.full_name || user?.email || "Authenticated User"}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">
                Role: {role || "Standard"}
              </p>
            </div>
            <Badge
              variant={
                role === "Admin"
                  ? "brand"
                  : role === "Accountant"
                    ? "warning"
                    : "success"
              }
              className="text-[10px] uppercase font-bold"
            >
              {role || "Agent"}
            </Badge>
          </div>
        ) : (
          <div className="flex justify-center">
            <Badge variant="brand" className="text-[10px] px-1.5">
              {(role || "A").charAt(0)}
            </Badge>
          </div>
        )}
      </div>
    </aside>
  );
}
