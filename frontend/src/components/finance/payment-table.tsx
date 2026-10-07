"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OfficePayment } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Edit3,
  PlusCircle,
  Trash2,
  Calendar,
  Landmark,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";
import { UpdatePaymentModal } from "./update-payment-modal";
import { DeletePaymentDialog } from "./delete-payment-dialog";

interface PaymentTableProps {
  payments: OfficePayment[];
  isLoading: boolean;
  isFetching?: boolean;
  onRefresh?: () => void;
}

export function PaymentTable({ payments, isLoading, isFetching = false, onRefresh }: PaymentTableProps) {
  const [selectedForUpdate, setSelectedForUpdate] = useState<OfficePayment | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<OfficePayment | null>(null);

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Ref #</th>
              <th className="py-3 px-4">Person / Beneficiary</th>
              <th className="py-3 px-4">Operating Bank</th>
              <th className="py-3 px-4 text-center">Type</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount (PKR)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                <td className="py-3 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                <td className="py-3 px-4 text-right"><Skeleton className="h-7 w-20 rounded-md ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <CreditCard className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No payment transactions found</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          No records match the current filter or date range. You can record a new transaction using the button below.
        </p>
        <Link href="/finance/payments/new" className="mt-4">
          <Button size="sm" variant="brand" className="gap-1.5 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Record Transaction
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
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
              <th className="py-3 px-4">Person / Beneficiary</th>
              <th className="py-3 px-4">Operating Bank</th>
              <th className="py-3 px-4 text-center">Type</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount (PKR)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((p) => {
              const isCredit = p.transaction_type === "CREDIT";
              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {p.payment_reference}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      {p.person_name}
                    </span>
                    {p.notes && (
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {p.notes}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {p.bank_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {p.account_number}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCredit
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-2.5 w-2.5" />
                      ) : (
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      )}
                      {p.transaction_type}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {p.payment_mode.replace("_", " ")}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {p.payment_date}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                    <span className={isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}>
                      PKR {Number(p.amount).toLocaleString()}
                    </span>
                    {p.adjustments_count ? (
                      <span className="block text-[9px] text-emerald-600 font-sans font-medium">
                        +{p.adjustments_count} adjustment(s)
                      </span>
                    ) : null}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => setSelectedForUpdate(p)}
                        title="Update details or add amount (Screen 12)"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => setSelectedForDelete(p)}
                        title="Delete transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UpdatePaymentModal
        payment={selectedForUpdate}
        isOpen={Boolean(selectedForUpdate)}
        onClose={() => setSelectedForUpdate(null)}
        onSuccess={onRefresh}
      />

      <DeletePaymentDialog
        payment={selectedForDelete}
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}
