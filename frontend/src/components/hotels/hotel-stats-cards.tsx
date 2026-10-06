"use client";

import React from "react";
import { HotelSummaryKPI } from "@/types/hotels";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, Clock, DollarSign } from "lucide-react";

interface HotelStatsCardsProps {
  summary?: HotelSummaryKPI;
  isLoading: boolean;
}

export function HotelStatsCards({ summary, isLoading }: HotelStatsCardsProps) {
  const totalContracted = Number(summary?.total_contracted || 0);
  const totalPaid = Number(summary?.total_advance_paid || 0);
  const totalRemaining = Number(summary?.total_remaining || 0);
  const totalCount = summary?.total_count || 0;
  const remainingCount = summary?.remaining_count || 0;
  const paidCount = summary?.paid_count || 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Bookings */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Reservations</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                {isLoading ? "..." : totalCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Active hotel bookings</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracted Cost */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Contracted</p>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 font-mono">
                {isLoading ? "..." : `PKR ${totalContracted.toLocaleString()}`}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Total agreed rates</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advance Paid */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Settled / Paid</p>
              <h3 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {isLoading ? "..." : `PKR ${totalPaid.toLocaleString()}`}
              </h3>
              <p className="text-[11px] text-emerald-600/80 mt-1">{paidCount} Fully Paid Bookings</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Outstanding */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Remaining Payables</p>
              <h3 className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-1 font-mono">
                {isLoading ? "..." : `PKR ${totalRemaining.toLocaleString()}`}
              </h3>
              <p className="text-[11px] text-amber-600/80 mt-1">{remainingCount} Pending Balances</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
