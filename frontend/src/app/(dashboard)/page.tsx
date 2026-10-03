"use client";

import React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Users,
  FileCheck2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Plane,
  Clock,
  Shield,
  PlusCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user, role, isLoading } = useAuth();

  const stats = [
    {
      title: "Active Bookings",
      value: "148",
      change: "+12.5%",
      description: "Confirmed departures this month",
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400",
    },
    {
      title: "Registered Pilgrims",
      value: "1,240",
      change: "+28.4%",
      description: "Hajj & Umrah package travelers",
      icon: Users,
      color: "text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400",
    },
    {
      title: "Visa Processing",
      value: "39",
      change: "4 Urgent",
      description: "Under Saudi Ministry verification",
      icon: FileCheck2,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400",
    },
    {
      title: "Fiscal Volume",
      value: "$342,850",
      change: "+18.2%",
      description: "Gross revenue collected Q4",
      icon: DollarSign,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400",
      roles: ["Admin", "Accountant"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-xs">
                <Plane className="h-3.5 w-3.5 -rotate-45" />
                Karwan-e-Asotvi Travels Operating System
              </span>
              <Badge
                variant="brand"
                className="bg-emerald-950 text-emerald-300 border border-emerald-600/40 text-xs px-2.5"
              >
                {role ? `Active Role: ${role}` : "Agent Session"}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {user?.first_name || user?.full_name || "Travel Coordinator"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-emerald-100">
              Operations management portal for pilgrim itineraries, group ticketing, Saudi visa clearances, and unified ledger reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-xs"
            >
              <PlusCircle className="mr-2 h-4 w-4 text-emerald-700" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          // If metric has role restrictions and current user role does not match, skip
          if (stat.roles && role && !stat.roles.includes(role)) {
            return null;
          }
          const Icon = stat.icon;

          return (
            <Card key={idx} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {stat.value}
                </div>
                <div className="mt-1 flex items-center text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5 inline" />
                    {stat.change}
                  </span>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Operational Highlights & RBAC Status */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Operations Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Pilgrimage & Tour Bookings</CardTitle>
                <CardDescription>Live feed of recently registered client dossiers</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                {
                  id: "KAT-2026-089",
                  pilgrim: "Haji Mohammad Irfan & Family (4 Pax)",
                  package: "15 Days Executive Umrah Package",
                  departure: "Oct 18, 2026",
                  status: "Confirmed",
                  statusVariant: "success" as const,
                },
                {
                  id: "KAT-2026-090",
                  pilgrim: "Dr. Tariq Mahmood",
                  package: "VIP Hajj Pre-Registration",
                  departure: "Nov 02, 2026",
                  status: "Visa Processing",
                  statusVariant: "warning" as const,
                },
                {
                  id: "KAT-2026-091",
                  pilgrim: "Syed Bilal Shah",
                  package: "Economy Umrah Group Flight",
                  departure: "Nov 15, 2026",
                  status: "Pending Voucher",
                  statusVariant: "secondary" as const,
                },
              ].map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {booking.pilgrim}
                    </p>
                    <p className="text-xs text-slate-500">
                      Ref: <span className="font-mono font-medium">{booking.id}</span> • {booking.package}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={booking.statusVariant} className="text-[11px]">
                      {booking.status}
                    </Badge>
                    <p className="mt-1 flex items-center justify-end text-[11px] text-slate-400">
                      <Clock className="mr-1 h-3 w-3" />
                      {booking.departure}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Architecture & RBAC Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Enterprise Security
            </CardTitle>
            <CardDescription>Active RBAC session parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Authentication</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Supabase Auth (JWT)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Backend API</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Django 5.1 + DRF</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Role Verification</span>
                <Badge variant="brand" className="text-[10px]">
                  {role || "Agent"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Authorized Module Permissions:
              </p>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Booking & Pilgrim Dossiers (All Roles)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Visa Processing Clearance (All Roles)
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      role === "Admin" || role === "Accountant" ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  Invoices, Ledgers & Receivables ({role === "Admin" || role === "Accountant" ? "Granted" : "Restricted"})
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      role === "Admin" ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  System Administration & User Roles ({role === "Admin" ? "Granted" : "Restricted"})
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
