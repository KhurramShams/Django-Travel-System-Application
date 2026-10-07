"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { officePaymentsApi } from "@/lib/api/finance";
import { OfficePayment } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DeletePaymentDialogProps {
  payment: OfficePayment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeletePaymentDialog({
  payment,
  isOpen,
  onClose,
  onSuccess,
}: DeletePaymentDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!payment) throw new Error("No payment selected");
      return officePaymentsApi.delete(payment.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-payments"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setError(null);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || err.message || "Failed to delete payment record.");
    },
  });

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Delete Payment Record
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Confirm transaction removal and ledger reversal
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {error && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to remove payment{" "}
            <strong className="text-slate-900 dark:text-white font-mono">
              #{payment.payment_reference}
            </strong>{" "}
            for <strong>{payment.person_name}</strong>?
          </p>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Financial Ledger Reversal:</p>
            Deleting this {payment.transaction_type} of{" "}
            <strong>PKR {Number(payment.amount).toLocaleString()}</strong> will automatically reverse its impact on{" "}
            <strong>{payment.bank_name}</strong>.
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-slate-900">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="gap-1.5"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Confirm Delete
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
