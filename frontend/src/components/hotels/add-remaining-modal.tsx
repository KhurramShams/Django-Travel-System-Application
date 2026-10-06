"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { hotelsApi } from "@/lib/api/hotels";
import { HotelBooking, HotelPaymentMethod } from "@/types/hotels";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  CreditCard,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Building2,
  FileText,
} from "lucide-react";

interface AddRemainingModalProps {
  booking: HotelBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const addPaymentSchema = z.object({
  amount: z.coerce.number().min(1, "Settlement amount must be at least 1"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE"]),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type AddPaymentFormValues = z.infer<typeof addPaymentSchema>;

export function AddRemainingModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: AddRemainingModalProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const remainingBalance = Number(booking?.remaining_amount || 0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddPaymentFormValues>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      amount: remainingBalance > 0 ? remainingBalance : undefined,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "CASH",
      reference_number: "",
      notes: "",
    },
  });

  const enteredAmount = watch("amount") || 0;
  const projectedRemaining = Math.max(0, remainingBalance - enteredAmount);

  const mutation = useMutation({
    mutationFn: (data: AddPaymentFormValues) => {
      if (!booking) throw new Error("No hotel booking selected");
      return hotelsApi.addPayment(booking.id, {
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method: data.payment_method as HotelPaymentMethod,
        reference_number: data.reference_number,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      if (booking?.id) {
        queryClient.invalidateQueries({ queryKey: ["hotel", booking.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["hotel-summary"] });
      reset();
      setServerError(null);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to record incremental payment.";
      setServerError(msg);
    },
  });

  if (!isOpen || !booking) return null;

  const onSubmit = (data: AddPaymentFormValues) => {
    if (data.amount > remainingBalance) {
      setServerError(`Payment amount cannot exceed the remaining balance of PKR ${remainingBalance.toLocaleString()}.`);
      return;
    }
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="h-4 w-4" />
              </span>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Add Remaining Payment
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Record settlement installment for {booking.hotel_name} ({booking.booking_reference})
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-5">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Financial Status Summary */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Agreed</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                  PKR {Number(booking.total_price).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Paid So Far</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  PKR {Number(booking.advance_paid).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 block">Outstanding</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                  PKR {remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Amount (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50000"
                    className="pl-8 text-xs font-mono font-semibold"
                    {...register("amount")}
                  />
                </div>
                {errors.amount && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-8 text-xs"
                    {...register("payment_date")}
                  />
                </div>
                {errors.payment_date && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.payment_date.message}</p>
                )}
              </div>
            </div>

            {/* Projected Remaining Balance preview */}
            <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 rounded-md">
              <span className="text-slate-600 dark:text-slate-400 font-medium">New Remaining Balance:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                PKR {projectedRemaining.toLocaleString()}
              </span>
            </div>

            {/* Payment Method & Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  {...register("payment_method")}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cheque / Transaction Ref
                </label>
                <Input
                  placeholder="e.g. TRX-998811"
                  className="text-xs"
                  {...register("reference_number")}
                />
              </div>
            </div>

            {/* Ledger Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Settlement Notes (Optional)
              </label>
              <Input
                placeholder="e.g. Balance settlement for Makkah booking"
                className="text-xs"
                {...register("notes")}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 bg-slate-50/50 dark:bg-slate-900">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={mutation.isPending}
              className="gap-1.5"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Record Payment
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
