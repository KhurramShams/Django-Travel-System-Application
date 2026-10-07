"use client";

import React from "react";
import Link from "next/link";
import { ReceivablesBreakdown } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart, ArrowRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface ReceivablesStatusProps {
  data?: ReceivablesBreakdown;
  isLoading: boolean;
}

export function ReceivablesStatus({ data, isLoading }: ReceivablesStatusProps) {
  if (isLoading || !data) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-600" />
            Receivables Clearance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-56 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  const total = data.total_active_enrollments || 1;
  const paidPct = Math.round((data.paid.count / total) * 100);
  const partialPct = Math.round((data.partial.count / total) * 100);
  const unpaidPct = Math.round((data.unpaid.count / total) * 100);

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-600" />
            Receivables Clearance
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Payment fulfillment across {data.total_active_enrollments} active pilgrim contracts
          </CardDescription>
        </div>
        <Link
          href="/finance/travelers/balances"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
        >
          <span>Audit Balances</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* Progress Bar Segment */}
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${paidPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
            title={`Fully Paid: ${paidPct}%`}
          />
          <div
            style={{ width: `${partialPct}%` }}
            className="bg-amber-500 h-full transition-all duration-300"
            title={`Partial Balance: ${partialPct}%`}
          />
          <div
            style={{ width: `${unpaidPct}%` }}
            className="bg-rose-500 h-full transition-all duration-300"
            title={`Unpaid: ${unpaidPct}%`}
          />
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Fully Settled */}
          <div className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Fully Paid</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {data.paid.count}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              PKR {Number(data.paid.amount).toLocaleString()}
            </p>
          </div>

          {/* Partial Balance */}
          <div className="p-3 rounded-lg border border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5" />
              <span>Partial Due</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {data.partial.count}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
              PKR {Number(data.partial.amount).toLocaleString()}
            </p>
          </div>

          {/* Unpaid */}
          <div className="p-3 rounded-lg border border-rose-100 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Unpaid / Pending</span>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {data.unpaid.count}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
              PKR {Number(data.unpaid.amount).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
