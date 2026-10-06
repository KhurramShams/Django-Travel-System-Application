"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { officeExpensesApi } from "@/lib/api/finance";
import { ExpenseCategory, PaymentMode } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Receipt,
  PlusCircle,
  Printer,
  Calendar,
  RefreshCw,
  Tag,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Coins,
} from "lucide-react";
import { ExpenseTable } from "@/components/finance/expense-table";

const addExpenseSchema = z.object({
  person_name: z.string().min(2, "Person name must be at least 2 characters"),
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
  payment_mode: z.enum(["CASH", "ONLINE_TRANSFER", "CHEQUE", "DEPOSIT_SLIP"]),
  expense_date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type AddExpenseFormValues = z.infer<typeof addExpenseSchema>;

export default function DailyExpensesPage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [targetDate, setTargetDate] = useState<string>(today);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch daily summary
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["expense-daily-summary", targetDate],
    queryFn: () => officeExpensesApi.dailySummary(targetDate),
  });

  // Fetch expenses list for the date
  const {
    data: expenses = [],
    isLoading: isListLoading,
    refetch: refetchList,
    isFetching,
  } = useQuery({
    queryKey: ["daily-expenses", targetDate],
    queryFn: () => officeExpensesApi.list({ expense_date: targetDate }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddExpenseFormValues>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      category: "REFRESHMENTS",
      payment_mode: "CASH",
      expense_date: targetDate,
      person_name: "",
      item_name: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AddExpenseFormValues) => officeExpensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-daily-summary"] });
      setSuccessMessage("Operational expense recorded successfully!");
      setServerError(null);
      reset({
        category: "REFRESHMENTS",
        payment_mode: "CASH",
        expense_date: targetDate,
        person_name: "",
        item_name: "",
        notes: "",
      });
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.message || "Failed to record expense";
      setServerError(msg);
      setSuccessMessage(null);
    },
  });

  const onSubmit = (values: AddExpenseFormValues) => {
    setServerError(null);
    createMutation.mutate(values);
  };

  const handleDateShift = (days: number) => {
    const current = new Date(targetDate);
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split("T")[0];
    setTargetDate(newDateStr);
  };

  const handleRefresh = () => {
    refetchSummary();
    refetchList();
  };

  const totalAmount = summary ? Number(summary.total_amount) : 0;
  const totalCount = summary ? summary.total_items : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Daily Operational Expenses
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Screen 13
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Log day-to-day office overheads, utilities, and refreshments, and generate printable expense vouchers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Selector with Next/Prev */}
          <div className="flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-2xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateShift(-1)}
              className="h-7 w-7 p-0 text-slate-500"
              title="Previous Day"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-7 text-xs border-0 px-2 focus-visible:ring-0 w-32"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateShift(1)}
              className="h-7 w-7 p-0 text-slate-500"
              title="Next Day"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            {targetDate !== today && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTargetDate(today)}
                className="h-7 px-2 text-[10px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Today
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-1.5 text-xs"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href={`/finance/expenses/print?date=${targetDate}`} target="_blank">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-medium">
              <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              Print Report
            </Button>
          </Link>

          <Button
            size="sm"
            variant="brand"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="gap-1.5 text-xs font-medium"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {isFormOpen ? "Hide Entry Form" : "Add Expense"}
          </Button>
        </div>
      </div>

      {/* Daily KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Total Expenses for {targetDate}
              </p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                PKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Aggregated daily spend</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Expense Items / Vouchers
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {totalCount}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Disbursements made on this date</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Top Spending Category
              </p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-[180px]">
                {summary?.category_breakdown && summary.category_breakdown.length > 0
                  ? summary.category_breakdown[0].category.replace("_", " ")
                  : "None"}
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summary?.category_breakdown && summary.category_breakdown.length > 0
                  ? `PKR ${Number(summary.category_breakdown[0].category_total).toLocaleString()}`
                  : "No category recorded"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Pills Breakdown */}
      {summary?.category_breakdown && summary.category_breakdown.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Tag className="h-3 w-3" /> Breakdown:
          </span>
          {summary.category_breakdown.map((cat) => (
            <span
              key={cat.category}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <span>{cat.category.replace("_", " ")}:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                PKR {Number(cat.category_total).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">({cat.count})</span>
            </span>
          ))}
        </div>
      )}

      {/* Collapsible New Expense Entry Form (Screen 13 Form) */}
      {isFormOpen && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-200">
          <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  Record Daily Operational Expense
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Enter expenditure details below. Each entry generates an auditable expense voucher.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-4 space-y-4">
              {serverError && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Person / Spender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    Spender / Person <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("person_name")}
                    placeholder="e.g. Asim Khan, Office Boy"
                    className="text-xs"
                  />
                  {errors.person_name && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.person_name.message}</p>
                  )}
                </div>

                {/* Item / Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    Item / Description <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("item_name")}
                    placeholder="e.g. Monthly Internet Bill, Tea & Sugar"
                    className="text-xs"
                  />
                  {errors.item_name && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.item_name.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("category")}
                    className="w-full text-xs h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-slate-900 dark:text-slate-100"
                  >
                    <option value="REFRESHMENTS">Refreshments / Kitchen</option>
                    <option value="OFFICE_SUPPLIES">Office Supplies / Stationery</option>
                    <option value="UTILITIES">Utilities (Electricity, Net, Gas)</option>
                    <option value="RENT">Office Rent</option>
                    <option value="SALARIES">Staff Salaries</option>
                    <option value="MAINTENANCE">Maintenance / Repairs</option>
                    <option value="MARKETING">Marketing & Advertisements</option>
                    <option value="OTHER">Other Operational Expense</option>
                  </select>
                  {errors.category && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.category.message}</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                    Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("amount")}
                    placeholder="0.00"
                    className="text-xs font-bold"
                  />
                  {errors.amount && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("payment_mode")}
                    className="w-full text-xs h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-slate-900 dark:text-slate-100"
                  >
                    <option value="CASH">Cash in Hand</option>
                    <option value="ONLINE_TRANSFER">Online Bank Transfer</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="DEPOSIT_SLIP">Deposit Slip</option>
                  </select>
                  {errors.payment_mode && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.payment_mode.message}</p>
                  )}
                </div>

                {/* Expense Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    {...register("expense_date")}
                    className="text-xs"
                  />
                  {errors.expense_date && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.expense_date.message}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Remarks (Optional)
                  </label>
                  <Input
                    {...register("notes")}
                    placeholder="Additional context or bill serial number..."
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex justify-end gap-2">
              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={createMutation.isPending}
                className="gap-1.5 text-xs font-medium"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Save Expense Voucher
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Itemized Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-500" />
            Itemized Expense Vouchers for {targetDate}
          </h2>
          <span className="text-xs text-slate-400">
            {expenses.length} record{expenses.length === 1 ? "" : "s"}
          </span>
        </div>
        <ExpenseTable expenses={expenses} isLoading={isListLoading} onRefresh={handleRefresh} />
      </div>
    </div>
  );
}
