"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { dashboardApi } from "@/lib/api/dashboard";
import { transactionsApi } from "@/lib/api/transactions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  DollarSign,
  TrendingDown,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Plane,
  Landmark,
  Package,
  BedDouble,
  Receipt,
  BookOpen,
  RefreshCw,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { ReceivablesStatus } from "@/components/dashboard/receivables-status";
import { PackageOccupancyWidget } from "@/components/dashboard/package-occupancy";
import { DateRangeFilter, DatePreset } from "@/components/dashboard/date-range-filter";

export default function DashboardPage() {
  const { user, role } = useAuth();

  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
    preset: DatePreset;
  }>({ preset: "ALL" });

  // Queries for live metrics and analytics with dynamic date window
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
    isFetching: isMetricsFetching,
  } = useQuery({
    queryKey: ["dashboard-metrics", dateRange.startDate, dateRange.endDate],
    queryFn: () =>
      dashboardApi.getMetrics({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      }),
  });

  const { data: cashflow = [], isLoading: isCashflowLoading } = useQuery({
    queryKey: ["dashboard-cashflow"],
    queryFn: () => dashboardApi.getMonthlyCashflow(6),
  });

  const { data: packageDist = [], isLoading: isPackagesLoading } = useQuery({
    queryKey: ["dashboard-packages"],
    queryFn: () => dashboardApi.getPackageDistribution(),
  });

  const { data: receivables, isLoading: isReceivablesLoading } = useQuery({
    queryKey: ["dashboard-receivables"],
    queryFn: () => dashboardApi.getReceivablesBreakdown(),
  });

  const { data: recentLedger } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: () => transactionsApi.list({ page_size: 6 }),
  });

  const receivedNum = React.useMemo(() => Number(metrics?.received_amount || 0), [metrics?.received_amount]);
  const remainingNum = React.useMemo(() => Number(metrics?.remaining_amount || 0), [metrics?.remaining_amount]);
  const expenseNum = React.useMemo(() => Number(metrics?.today_expense || 0), [metrics?.today_expense]);
  const liquidityNum = React.useMemo(() => Number(metrics?.secondary?.bank_liquidity || 0), [metrics?.secondary?.bank_liquidity]);

  const expenseCardLabel =
    dateRange.preset === "TODAY"
      ? "Today's Expense"
      : dateRange.startDate || dateRange.endDate
      ? "Period Expense"
      : "Today's Expense";

  const isAnyLoading = isMetricsLoading || isMetricsFetching;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner (Cleaned up top actions area) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-xs">
                <Plane className="h-3.5 w-3.5 -rotate-45" />
                Khas Travels Operating System
              </span>
              <Badge
                variant="brand"
                className="bg-emerald-950 text-emerald-300 border border-emerald-600/40 text-xs px-2.5"
              >
                {role ? `Active Role: ${role}` : "Executive View"}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {user?.first_name || user?.full_name || "Travel Coordinator"}
            </h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-emerald-100">
              Live executive analytics hub for pilgrim itineraries, unified financial ledgers, and operational liquidity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchMetrics()}
              disabled={isMetricsFetching}
              className="bg-emerald-900/40 border-emerald-500/30 text-white hover:bg-emerald-900/60 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isMetricsFetching ? "animate-spin" : ""}`} />
              Sync Data
            </Button>
          </div>
        </div>
      </div>

      {/* Date Range Selection & Preset Filters */}
      <DateRangeFilter onDateChange={setDateRange} isLoading={isAnyLoading} />

      {/* Primary KPI Overview Cards (Dynamic Date-Filtered Analytics) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Customers */}
        <Link href="/travelers" className="group">
          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all group-hover:border-emerald-500/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {dateRange.startDate || dateRange.endDate ? "New Customers" : "Total Customers"}
                </p>
                <div className="mt-0.5">
                  {isAnyLoading ? (
                    <Skeleton className="h-8 w-24 my-0.5" />
                  ) : (
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {(metrics?.total_customers || 0).toLocaleString()}
                    </h3>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {dateRange.startDate || dateRange.endDate
                    ? "Registrations in period"
                    : "Registered pilgrims & clients"}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Received Amount */}
        <Link href="/transactions?transaction_type=CREDIT" className="group">
          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all group-hover:border-emerald-500/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Received Amount
                </p>
                <div className="mt-0.5">
                  {isAnyLoading ? (
                    <Skeleton className="h-8 w-36 my-0.5" />
                  ) : (
                    <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      PKR {receivedNum.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </h3>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3 text-emerald-600" />
                  {dateRange.startDate || dateRange.endDate
                    ? "Inflow during selected period"
                    : "Client payments & deposits"}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 3. Remaining Amount */}
        <Link href="/finance/travelers/balances" className="group">
          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all group-hover:border-amber-500/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Remaining Receivables
                </p>
                <div className="mt-0.5">
                  {isAnyLoading ? (
                    <Skeleton className="h-8 w-36 my-0.5" />
                  ) : (
                    <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400">
                      PKR {remainingNum.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </h3>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  Outstanding package dues
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <AlertCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 4. Today's / Period Expense */}
        <Link href="/finance/expenses" className="group">
          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all group-hover:border-rose-500/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  {expenseCardLabel}
                </p>
                <div className="mt-0.5">
                  {isAnyLoading ? (
                    <Skeleton className="h-8 w-32 my-0.5" />
                  ) : (
                    <h3 className="text-2xl font-black text-rose-700 dark:text-rose-400">
                      PKR {expenseNum.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </h3>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-rose-600" />
                  {dateRange.startDate || dateRange.endDate
                    ? "Disbursements in period"
                    : "Office operational spend"}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <Receipt className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Operational Quick Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Bank Liquidity</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              PKR {liquidityNum.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Active Packages</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {metrics?.secondary?.active_packages || 0} Open Tours
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Plane className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Airline PNRs</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {metrics?.secondary?.issued_tickets_count || 0} Tickets
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
            <BedDouble className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Hotel Bookings</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {metrics?.secondary?.hotel_bookings_count || 0} Properties
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cashflow Trend Chart */}
        <div className="lg:col-span-2">
          <CashflowChart data={cashflow} isLoading={isCashflowLoading || isAnyLoading} />
        </div>

        {/* Right Column: Receivables Clearance & Package Occupancy */}
        <div className="space-y-6">
          <ReceivablesStatus data={receivables} isLoading={isReceivablesLoading || isAnyLoading} />
          <PackageOccupancyWidget data={packageDist} isLoading={isPackagesLoading || isAnyLoading} />
        </div>
      </div>

      {/* Recent Activity / Master Ledger Stream */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              Recent Financial Transactions
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Live consolidated feed across client enrollments, airline tickets, and office banking
            </CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700 gap-1">
              <span>View All Ledger</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Ref #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Source</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {!recentLedger || recentLedger.results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No recent transactions found.
                    </td>
                  </tr>
                ) : (
                  recentLedger.results.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                        {item.id}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.source_module.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 truncate max-w-[280px]">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={
                            item.transaction_type === "CREDIT"
                              ? "success"
                              : item.transaction_type === "DEBIT"
                              ? "destructive"
                              : "brand"
                          }
                          className="text-[10px] font-bold"
                        >
                          {item.transaction_type}
                        </Badge>
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono font-bold ${
                          item.transaction_type === "CREDIT"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
