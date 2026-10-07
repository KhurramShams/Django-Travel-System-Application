"use client";

import React from "react";
import { LedgerEntry, LedgerPagination } from "@/types/transactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  Plane,
  BedDouble,
  Landmark,
  Receipt,
  User,
  Calendar,
  Loader2,
} from "lucide-react";

interface LedgerTableProps {
  entries: LedgerEntry[];
  pagination?: LedgerPagination;
  isLoading: boolean;
  isFetching?: boolean;
  onPageChange: (newPage: number) => void;
}

export function LedgerTable({
  entries,
  pagination,
  isLoading,
  isFetching = false,
  onPageChange,
}: LedgerTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Ref #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Source Stream</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Flow Type</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Account / Entity</th>
              <th className="py-3 px-4 text-right">Amount (PKR)</th>
              <th className="py-3 px-4">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                <td className="py-3 px-4"><Skeleton className="h-5 w-24 rounded-full" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                <td className="py-3 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <CreditCard className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          No ledger transactions found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          No records match the selected date range or filters. Clear your filters to view all entries.
        </p>
      </div>
    );
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "CLIENT_PAYMENT":
        return <Package className="h-3 w-3 text-emerald-600" />;
      case "TICKET_PURCHASE":
      case "TICKET_REFUND":
        return <Plane className="h-3 w-3 text-blue-600" />;
      case "HOTEL_PAYMENT":
        return <BedDouble className="h-3 w-3 text-purple-600" />;
      case "OFFICE_PAYMENT":
        return <Landmark className="h-3 w-3 text-amber-600" />;
      case "OFFICE_EXPENSE":
        return <Receipt className="h-3 w-3 text-rose-600" />;
      default:
        return <CreditCard className="h-3 w-3 text-slate-600" />;
    }
  };

  const currentPage = pagination?.current_page || 1;
  const totalPages = pagination?.total_pages || 1;
  const totalCount = pagination?.count || entries.length;

  return (
    <div className="space-y-4">
      <div className="relative overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none transition-opacity">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs shadow-md">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Updating...</span>
            </div>
          </div>
        )}
        {isFetching && !isLoading && (
          <div className="h-0.5 w-full bg-emerald-500 animate-pulse" />
        )}
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Ref #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Source Stream</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Flow Type</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Account / Entity</th>
              <th className="py-3 px-4 text-right">Amount (PKR)</th>
              <th className="py-3 px-4">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {entries.map((item) => {
              const isCredit = item.transaction_type === "CREDIT";
              const isDebit = item.transaction_type === "DEBIT";

              return (
                <tr
                  key={`${item.source_module}-${item.id}`}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {getSourceIcon(item.source_module)}
                      <span>{item.source_module.replace("_", " ")}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 min-w-[220px]">
                    <p className="line-clamp-2">{item.description}</p>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge
                      variant={isCredit ? "success" : isDebit ? "destructive" : "brand"}
                      className="text-[10px] font-bold gap-1"
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-2.5 w-2.5" />
                      ) : isDebit ? (
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      ) : null}
                      <span>{item.transaction_type}</span>
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {item.payment_mode ? item.payment_mode.replace("_", " ") : "-"}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {item.account_or_bank || "-"}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                      isCredit
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isDebit
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {isCredit ? "+" : isDebit ? "-" : ""}
                    {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {item.recorded_by || "System"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <p>
            Showing Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span> ({totalCount} total entries)
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-8 gap-1 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
