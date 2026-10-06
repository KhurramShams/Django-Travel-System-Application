"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { bankAccountsApi } from "@/lib/api/finance";
import { BankAccount } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Landmark, X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

const bankAccountSchema = z.object({
  bank_name: z.string().min(2, "Bank name must be at least 2 characters"),
  account_name: z.string().min(2, "Account title must be at least 2 characters"),
  account_number: z.string().min(5, "Account number must be at least 5 characters"),
  branch_code: z.string().optional(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

interface BankAccountModalProps {
  account: BankAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BankAccountModal({
  account,
  isOpen,
  onClose,
  onSuccess,
}: BankAccountModalProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
  });

  useEffect(() => {
    if (account) {
      reset({
        bank_name: account.bank_name,
        account_name: account.account_name,
        account_number: account.account_number,
        branch_code: account.branch_code || "",
      });
    } else {
      reset({
        bank_name: "",
        account_name: "Karwan-e-Asotvi Travels",
        account_number: "",
        branch_code: "",
      });
    }
    setServerError(null);
  }, [account, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: BankAccountFormValues) => {
      if (account) {
        return bankAccountsApi.update(account.id, data);
      }
      return bankAccountsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      setServerError(null);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.account_number?.[0] ||
        err.message ||
        "Failed to save bank account.";
      setServerError(msg);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Landmark className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                {account ? "Edit Bank Account" : "Add Bank Account"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Operating bank ledger account configuration
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <CardContent className="space-y-4 pt-4">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Meezan Bank, HBL, UBL"
                className="text-xs"
                {...register("bank_name")}
              />
              {errors.bank_name && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.bank_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Account Title <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Karwan-e-Asotvi Travels"
                className="text-xs"
                {...register("account_name")}
              />
              {errors.account_name && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.account_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Account Number / IBAN <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. PK12MEZN00012345678901"
                className="text-xs font-mono"
                {...register("account_number")}
              />
              {errors.account_number && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.account_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Branch Name / Code (Optional)
              </label>
              <Input
                placeholder="e.g. 0101 - Al-Madinah Centre Branch"
                className="text-xs"
                {...register("branch_code")}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-slate-900">
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
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Save Account
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
