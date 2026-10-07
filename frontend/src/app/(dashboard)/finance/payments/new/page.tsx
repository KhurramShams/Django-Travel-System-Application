"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { bankAccountsApi, officePaymentsApi } from "@/lib/api/finance";
import { PaymentMode, TransactionType } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  DollarSign,
  Landmark,
  User,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

const recordPaymentSchema = z.object({
  person_name: z.string().min(2, "Person name must be at least 2 characters"),
  bank: z.string().min(1, "Please select an operating bank account"),
  transaction_type: z.enum(["CREDIT", "DEBIT", "TRANSFER"]),
  payment_mode: z.enum(["CASH", "ONLINE_TRANSFER", "CHEQUE", "DEPOSIT_SLIP"]),
  amount: z.coerce.number().min(1, "Amount must be greater than zero"),
  payment_date: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

export default function RecordPaymentPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: bankAccounts = [], isLoading: isBanksLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountsApi.list(),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      transaction_type: "CREDIT",
      payment_mode: "ONLINE_TRANSFER",
      payment_date: new Date().toISOString().split("T")[0],
      amount: undefined,
      notes: "",
    },
  });

  const selectedBankId = watch("bank");
  const selectedType = watch("transaction_type");
  const enteredAmount = watch("amount") || 0;

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);
  const currentBankBalance = selectedBank ? Number(selectedBank.current_balance) : 0;
  const projectedBalance =
    selectedType === "CREDIT"
      ? currentBankBalance + Number(enteredAmount)
      : currentBankBalance - Number(enteredAmount);

  const mutation = useMutation({
    mutationFn: (data: RecordPaymentFormValues) =>
      officePaymentsApi.create({
        person_name: data.person_name,
        bank: data.bank,
        transaction_type: data.transaction_type as TransactionType,
        payment_mode: data.payment_mode as PaymentMode,
        amount: data.amount,
        payment_date: data.payment_date,
        notes: data.notes || undefined,
      }),
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["office-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success(
        "Payment Recorded",
        `PKR ${Number(payment.amount).toLocaleString()} (${payment.transaction_type}) logged successfully.`
      );
      router.push("/finance/payments");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || "Failed to record payment.";
      setServerError(msg);
      toast.error("Payment Failed", msg);
    },
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/finance/payments">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Record Office Payment
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Legacy Screen 11: Capture banking transactions, deposits, and client disbursements
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Transaction Specifications
            </CardTitle>
            <CardDescription className="text-xs">
              Select transaction type, party, bank account, and amount
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Transaction Type Radio Selector (Credit / Debit / Transfer) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Transaction Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-xs font-bold ${
                    selectedType === "CREDIT"
                      ? "border-emerald-600 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    value="CREDIT"
                    className="sr-only"
                    {...register("transaction_type")}
                  />
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                  Credit (Inflow / Deposit)
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-xs font-bold ${
                    selectedType === "DEBIT"
                      ? "border-rose-600 bg-rose-50/50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 shadow-xs"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    value="DEBIT"
                    className="sr-only"
                    {...register("transaction_type")}
                  />
                  <ArrowUpRight className="h-4 w-4 text-rose-600" />
                  Debit (Outflow / Payment)
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-xs font-bold ${
                    selectedType === "TRANSFER"
                      ? "border-blue-600 bg-blue-50/50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    value="TRANSFER"
                    className="sr-only"
                    {...register("transaction_type")}
                  />
                  Transfer (Internal)
                </label>
              </div>
            </div>

            {/* Person Name & Bank Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Person Name / Beneficiary / Client <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. Haji Muhammad Aslam, Air Falcon Consolidator"
                    className="pl-8 text-xs font-medium"
                    {...register("person_name")}
                  />
                </div>
                {errors.person_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.person_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Operating Bank Account <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Landmark className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    className="w-full h-9 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-medium"
                    {...register("bank")}
                  >
                    <option value="">-- Select Bank Account --</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} - {b.account_name} ({b.account_number})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.bank && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.bank.message}</p>
                )}
              </div>
            </div>

            {/* Amount, Mode & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Amount (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50000"
                    className="pl-8 text-xs font-mono font-bold"
                    {...register("amount")}
                  />
                </div>
                {errors.amount && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-medium"
                  {...register("payment_mode")}
                >
                  <option value="ONLINE_TRANSFER">Online Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="DEPOSIT_SLIP">Deposit Slip</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input type="date" className="pl-8 text-xs" {...register("payment_date")} />
                </div>
              </div>
            </div>

            {/* Live Bank Balance Reconciliation Preview */}
            {selectedBank && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Bank Account:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedBank.bank_name} ({selectedBank.account_number})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Projected Balance:</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    PKR {projectedBalance.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    (Current: PKR {currentBankBalance.toLocaleString()})
                  </span>
                </div>
              </div>
            )}

            {/* Notes / Remarks */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transaction Purpose & Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g. Deposit for 15-Day Umrah package, cheque cleared"
                  className="pl-8 text-xs"
                  {...register("notes")}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 bg-slate-50/50 dark:bg-slate-900">
            <Link href="/finance/payments">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={mutation.isPending}
              loadingText="Recording Transaction..."
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Save & Update Balance
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
