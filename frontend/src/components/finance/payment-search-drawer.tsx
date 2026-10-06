"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { officePaymentsApi } from "@/lib/api/finance";
import { OfficePayment } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, CreditCard, ChevronRight, Loader2, ArrowRight } from "lucide-react";

interface PaymentSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPayment: (payment: OfficePayment) => void;
}

export function PaymentSearchDrawer({
  isOpen,
  onClose,
  onSelectPayment,
}: PaymentSearchDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["payment-lookup", searchTerm],
    queryFn: () => officePaymentsApi.lookup(searchTerm),
    enabled: searchTerm.trim().length >= 2,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Search className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Find Payment by ID
              </h3>
              <p className="text-[11px] text-slate-500">
                Quick lookup for Screen 12 payment update & adjustment
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4 text-slate-400" />
          </Button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              autoFocus
              placeholder="Type Payment ID (e.g. KB-PAY-2026-...) or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {searchTerm.trim().length < 2 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Enter at least 2 characters to search payment records.
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching transactions...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No transactions matching "{searchTerm}".
            </div>
          ) : (
            results.map((payment) => (
              <button
                key={payment.id}
                onClick={() => {
                  onSelectPayment(payment);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {payment.payment_reference}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        payment.transaction_type === "CREDIT"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {payment.transaction_type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {payment.person_name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {payment.bank_name} • {payment.payment_date}
                  </p>
                </div>

                <div className="text-right flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    PKR {Number(payment.amount).toLocaleString()}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
