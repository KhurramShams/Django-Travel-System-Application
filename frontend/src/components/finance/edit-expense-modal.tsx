"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { officeExpensesApi } from "@/lib/api/finance";
import { ExpenseCategory, OfficeExpense, PaymentMode } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Edit3, X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

const editExpenseSchema = z.object({
  person_name: z.string().min(2, "Person name is required"),
  item_name: z.string().min(2, "Item description is required"),
  category: z.enum([
    "RENT",
    "UTILITIES",
    "SALARIES",
    "REFRESHMENTS",
    "OFFICE_SUPPLIES",
    "MAINTENANCE",
    "MARKETING",
    "OTHER",
  ]),
  amount: z.coerce.number().min(1, "Amount must be greater than zero"),
  expense_date: z.string().min(1, "Date is required"),
  payment_mode: z.enum(["CASH", "ONLINE_TRANSFER", "CHEQUE", "DEPOSIT_SLIP"]),
  notes: z.string().optional(),
});

type EditExpenseFormValues = z.infer<typeof editExpenseSchema>;

interface EditExpenseModalProps {
  expense: OfficeExpense | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditExpenseModal({
  expense,
  isOpen,
  onClose,
  onSuccess,
}: EditExpenseModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditExpenseFormValues>({
    resolver: zodResolver(editExpenseSchema),
  });

  useEffect(() => {
    if (expense) {
      reset({
        person_name: expense.person_name,
        item_name: expense.item_name,
        category: expense.category,
        amount: Number(expense.amount),
        expense_date: expense.expense_date,
        payment_mode: expense.payment_mode,
        notes: expense.notes || "",
      });
      setServerError(null);
    }
  }, [expense, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: EditExpenseFormValues) => {
      if (!expense) throw new Error("No expense selected");
      return officeExpensesApi.update(expense.id, data);
    },
    onSuccess: (updated) => {
      toast.success(
        "Expense Updated",
        `Updated details for ${updated.item_name} successfully.`
      );
      setServerError(null);
      onClose();
      if (onSuccess) onSuccess();
      queryClient.invalidateQueries({ queryKey: ["office-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || "Failed to update expense.";
      setServerError(msg);
      toast.error("Update Failed", msg);
    },
  });

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Edit Expense #{expense.expense_reference}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Update operational expense details
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <CardContent className="space-y-3 pt-4 text-xs">
            {serverError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">Item Description</label>
              <Input className="text-xs" {...register("item_name")} />
              {errors.item_name && <p className="text-rose-500 text-[11px] mt-0.5">{errors.item_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Spender Name</label>
                <Input className="text-xs" {...register("person_name")} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Category</label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
                  {...register("category")}
                >
                  <option value="UTILITIES">Utilities</option>
                  <option value="REFRESHMENTS">Refreshments</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="RENT">Rent</option>
                  <option value="SALARIES">Salaries</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Amount (PKR)</label>
                <Input type="number" step="0.01" className="text-xs font-mono font-bold" {...register("amount")} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Date</label>
                <Input type="date" className="text-xs" {...register("expense_date")} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Payment Mode</label>
              <select
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-xs"
                {...register("payment_mode")}
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE_TRANSFER">Online Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DEPOSIT_SLIP">Deposit Slip</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Notes</label>
              <Input className="text-xs" {...register("notes")} />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t pt-3 bg-slate-50/50">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={mutation.isPending}
              loadingText="Saving Changes..."
            >
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
