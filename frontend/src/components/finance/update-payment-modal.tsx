"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { officePaymentsApi } from "@/lib/api/finance";
import { OfficePayment, PaymentMode } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Edit3,
  PlusCircle,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Landmark,
  User,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";

const updatePaymentSchema = z.object({
  person_name: z.string().min(2, "Person name must be at least 2 characters"),
  payment_mode: z.enum(["CASH", "ONLINE_TRANSFER", "CHEQUE", "DEPOSIT_SLIP"]),
  payment_date: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

type UpdatePaymentFormValues = z.infer<typeof updatePaymentSchema>;

interface UpdatePaymentModalProps {
  payment: OfficePayment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpdatePaymentModal({
  payment,
  isOpen,
  onClose,
  onSuccess,
}: UpdatePaymentModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"DETAILS" | "ADD_AMOUNT">("DETAILS");
  const [serverError, setServerError] = useState<string | null>(null);

  // Add Amount state
  const [addedAmount, setAddedAmount] = useState<string>("");
  const [addedNotes, setAddedNotes] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePaymentFormValues>({
    resolver: zodResolver(updatePaymentSchema),
  });

  useEffect(() => {
    if (payment) {
      reset({
        person_name: payment.person_name,
        payment_mode: payment.payment_mode,
        payment_date: payment.payment_date,
        notes: payment.notes || "",
      });
      setAddedAmount("");
      setAddedNotes("");
      setServerError(null);
    }
  }, [payment, reset, isOpen]);

  // Update payment mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePaymentFormValues) => {
      if (!payment) throw new Error("No payment selected");
      return officePaymentsApi.update(payment.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setServerError(null);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.error?.message || err.message || "Failed to update payment.");
    },
  });

  // Add Amount mutation
  const addAmountMutation = useMutation({
    mutationFn: () => {
      if (!payment) throw new Error("No payment selected");
      const num = Number(addedAmount);
      if (isNaN(num) || num <= 0) throw new Error("Please enter a valid amount greater than 0");
      return officePaymentsApi.addAmount(payment.id, {
        added_amount: num,
        notes: addedNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setServerError(null);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.error?.message || err.message || "Failed to add incremental amount.");
    },
  });

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                {payment.payment_reference}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  payment.transaction_type === "CREDIT"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {payment.transaction_type}
              </span>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white pt-1">
              Payment Record & Adjustments
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Legacy Screen 12: Modify transaction particulars or append funds
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* Tab switch between Details and Add Amount */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 pt-2">
          <button
            onClick={() => setActiveTab("DETAILS")}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "DETAILS"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Update Details
          </button>
          <button
            onClick={() => setActiveTab("ADD_AMOUNT")}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "ADD_AMOUNT"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Amount (+)
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Account snapshot banner */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Linked Bank</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                {payment.bank_name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {payment.account_number}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Total</span>
              <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                PKR {Number(payment.amount).toLocaleString()}
              </span>
            </div>
          </div>

          {activeTab === "DETAILS" ? (
            <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Person Name / Beneficiary <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input className="pl-8 text-xs font-medium" {...register("person_name")} />
                </div>
                {errors.person_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.person_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Purpose / Notes
                </label>
                <Input placeholder="Transaction description..." className="text-xs" {...register("notes")} />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="brand" size="sm" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Details"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 p-3 border border-emerald-200/50 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold mb-0.5">Legacy Screen 12 Add Amount Action:</p>
                Appending an amount will automatically increase the recorded total for this transaction, create an audit ledger entry in adjustments, and update the linked bank account balance.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Additional Amount to Append (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25000"
                    value={addedAmount}
                    onChange={(e) => setAddedAmount(e.target.value)}
                    className="pl-8 text-xs font-mono font-bold"
                  />
                </div>
                {Number(addedAmount) > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    New Total: PKR {(Number(payment.amount) + Number(addedAmount)).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Adjustment Remarks
                </label>
                <Input
                  placeholder="e.g. Additional payment received via cheque"
                  value={addedNotes}
                  onChange={(e) => setAddedNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  disabled={addAmountMutation.isPending || !Number(addedAmount)}
                  onClick={() => addAmountMutation.mutate()}
                >
                  {addAmountMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Appending...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      Confirm Add Amount
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
