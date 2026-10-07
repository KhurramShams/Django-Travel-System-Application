"use client";

import React, { useState } from "react";
import { OfficeExpense } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Receipt, Edit3, Trash2, Calendar, User, Tag } from "lucide-react";
import { EditExpenseModal } from "./edit-expense-modal";
import { DeleteExpenseDialog } from "./delete-expense-dialog";

interface ExpenseTableProps {
  expenses: OfficeExpense[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export function ExpenseTable({ expenses, isLoading, onRefresh }: ExpenseTableProps) {
  const [selectedForEdit, setSelectedForEdit] = useState<OfficeExpense | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<OfficeExpense | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs">Loading operational expenses...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Receipt className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No expenses recorded for this date</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          No office operational expenses found. You can add one using the form above.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Voucher #</th>
              <th className="py-3 px-4">Item / Description</th>
              <th className="py-3 px-4">Spender</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Payment Mode</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Amount (PKR)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map((exp) => (
              <tr
                key={exp.id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                  {exp.expense_reference}
                </td>

                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {exp.item_name}
                  </span>
                  {exp.notes && (
                    <span className="text-[10px] text-slate-400 block line-clamp-1">
                      {exp.notes}
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                  {exp.person_name}
                </td>

                <td className="py-3 px-4">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {exp.category.replace("_", " ")}
                  </span>
                </td>

                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                  {exp.payment_mode.replace("_", " ")}
                </td>

                <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {exp.expense_date}
                </td>

                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                  PKR {Number(exp.amount).toLocaleString()}
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                      onClick={() => setSelectedForEdit(exp)}
                      title="Edit expense"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => setSelectedForDelete(exp)}
                      title="Delete expense"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditExpenseModal
        expense={selectedForEdit}
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        onSuccess={onRefresh}
      />

      <DeleteExpenseDialog
        expense={selectedForDelete}
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}
