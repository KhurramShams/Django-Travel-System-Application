"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { officeExpensesApi } from "@/lib/api/finance";
import { OfficeExpense } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface DeleteExpenseDialogProps {
  expense: OfficeExpense | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteExpenseDialog({
  expense,
  isOpen,
  onClose,
  onSuccess,
}: DeleteExpenseDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!expense) throw new Error("No expense selected");
      return officeExpensesApi.delete(expense.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      setError(null);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || err.message || "Failed to delete expense.");
    },
  });

  if (!isOpen || !expense) return null;

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
                Delete Expense Item
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Confirm expense removal
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete the expense{" "}
            <strong>"{expense.item_name}"</strong> (PKR {Number(expense.amount).toLocaleString()})?
          </p>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-3 bg-slate-50/50">
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
            {mutation.isPending ? "Deleting..." : "Confirm Delete"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
