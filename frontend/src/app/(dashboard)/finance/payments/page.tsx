"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { bankAccountsApi, officePaymentsApi } from "@/lib/api/finance";
import { OfficePayment, PaymentMode, TransactionType } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PaymentTable } from "@/components/finance/payment-table";
import { PaymentSearchDrawer } from "@/components/finance/payment-search-drawer";
import { UpdatePaymentModal } from "@/components/finance/update-payment-modal";

export default function OfficePaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [drawerSelectedPayment, setDrawerSelectedPayment] = useState<OfficePayment | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Load bank accounts for filtering
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountsApi.list(),
  });

  // Load office payments with active filters
  const {
    data: payments = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "office-payments",
      searchTerm,
      selectedBankId,
      selectedType,
      selectedMode,
      selectedDate,
    ],
    queryFn: () =>
      officePaymentsApi.list({
        search: searchTerm || undefined,
        bank: selectedBankId || undefined,
        transaction_type: selectedType || undefined,
        payment_mode: selectedMode || undefined,
        payment_date: selectedDate || undefined,
      }),
  });

  // Calculate high-level KPIs
  const totalTransactions = payments.length;
  const totalCredits = payments
    .filter((p) => p.transaction_type === "CREDIT")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalDebits = payments
    .filter((p) => p.transaction_type === "DEBIT")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const netFlow = totalCredits - totalDebits;

  const handleSelectFromDrawer = (payment: OfficePayment) => {
    setIsSearchDrawerOpen(false);
    setDrawerSelectedPayment(payment);
    setIsUpdateModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedBankId("");
    setSelectedType("");
    setSelectedMode("");
    setSelectedDate("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Office Banking & Payments
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Module 5 Ledger
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Record, audit, and reconcile corporate bank accounts, deposits, and office withdrawals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSearchDrawerOpen(true)}
            className="gap-1.5 text-xs font-medium"
          >
            <Search className="h-3.5 w-3.5 text-slate-500" />
            Quick ID Lookup
          </Button>

          <Link href="/finance/accounts">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
              <Landmark className="h-3.5 w-3.5 text-slate-500" />
              Bank Accounts
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
            title="Refresh transactions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/finance/payments/new">
            <Button size="sm" variant="brand" className="gap-1.5 text-xs font-medium shadow-sm">
              <PlusCircle className="h-3.5 w-3.5" />
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Total Transactions
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {totalTransactions.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">In current filtered view</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Credits / Deposits
              </p>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                PKR {totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Inflow to bank balances</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Total Debits / Payouts
              </p>
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                PKR {totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Outflow from accounts</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Net Period Cash Flow
              </p>
              <h3
                className={`text-xl font-bold mt-0.5 ${
                  netFlow >= 0
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                PKR {netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Credits minus Debits</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Search Payee / Reference
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Khas, KH-PAY-2026..."
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>

            {/* Bank Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Bank Account
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full text-xs h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-slate-100"
              >
                <option value="">All Operating Banks</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bank_name} ({b.account_number.slice(-4)})
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Flow Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-slate-100"
              >
                <option value="">All Types</option>
                <option value="CREDIT">CREDIT (Inflow)</option>
                <option value="DEBIT">DEBIT (Outflow)</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>

            {/* Mode Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Payment Mode
              </label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full text-xs h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-slate-100"
              >
                <option value="">All Modes</option>
                <option value="ONLINE_TRANSFER">Online Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DEPOSIT_SLIP">Deposit Slip</option>
              </select>
            </div>

            {/* Date Filter & Reset */}
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs h-8 px-2"
                />
              </div>
              {(searchTerm || selectedBankId || selectedType || selectedMode || selectedDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  title="Clear filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <PaymentTable
        payments={payments}
        isLoading={isLoading}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {/* Quick Lookup Drawer */}
      <PaymentSearchDrawer
        isOpen={isSearchDrawerOpen}
        onClose={() => setIsSearchDrawerOpen(false)}
        onSelectPayment={handleSelectFromDrawer}
      />

      {/* Drawer-initiated Update Modal */}
      <UpdatePaymentModal
        payment={drawerSelectedPayment}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setDrawerSelectedPayment(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
