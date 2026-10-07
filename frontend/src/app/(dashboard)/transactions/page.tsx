"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import { LedgerSourceModule, LedgerTransactionType } from "@/types/transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Filter,
  Download,
  RefreshCw,
  RotateCcw,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import { LedgerTable } from "@/components/transactions/ledger-table";

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceModule, setSourceModule] = useState<string>("ALL");
  const [transactionType, setTransactionType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const {
    data: ledgerData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "central-ledger",
      searchTerm,
      sourceModule,
      transactionType,
      startDate,
      endDate,
      page,
      pageSize,
    ],
    queryFn: () =>
      transactionsApi.list({
        search: searchTerm || undefined,
        source_module: sourceModule !== "ALL" ? sourceModule : undefined,
        transaction_type: transactionType !== "ALL" ? transactionType : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        page_size: pageSize,
      }),
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSourceModule("ALL");
    setTransactionType("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExportCSV = () => {
    if (!ledgerData || ledgerData.results.length === 0) return;

    const headers = [
      "Reference ID",
      "Date",
      "Timestamp",
      "Source Module",
      "Description",
      "Flow Type",
      "Payment Mode",
      "Account / Bank",
      "Party Name",
      "Amount (PKR)",
      "Recorded By",
    ];

    const rows = ledgerData.results.map((item) => [
      `"${item.id.replace(/"/g, '""')}"`,
      `"${item.date}"`,
      `"${item.timestamp}"`,
      `"${item.source_module}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.transaction_type}"`,
      `"${item.payment_mode || ""}"`,
      `"${(item.account_or_bank || "").replace(/"/g, '""')}"`,
      `"${(item.party_name || "").replace(/"/g, '""')}"`,
      item.amount,
      `"${item.recorded_by || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Ledger_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = ledgerData?.summary;
  const totalCreditNum = Number(summary?.total_credit || 0);
  const totalDebitNum = Number(summary?.total_debit || 0);
  const netFlowNum = Number(summary?.net_flow || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Central Master Transaction Ledger
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Module 6
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Consolidated, chronological audit trail across client enrollments, airline tickets, hotel stays, and office banking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!ledgerData || ledgerData.results.length === 0}
            className="gap-1.5 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </Button>

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
        </div>
      </div>

      {/* Summary KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Total Entries Filtered
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {(summary?.total_count || 0).toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Records in active view</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Inflow (Credits)
              </p>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                PKR {totalCreditNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Receipts & bank deposits</p>
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
                Total Outflow (Debits)
              </p>
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                PKR {totalDebitNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Purchases, hotels & expenses</p>
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
                Net Period Flow
              </p>
              <h3
                className={`text-xl font-bold mt-0.5 ${
                  netFlowNum >= 0
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                PKR {netFlowNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Inflow minus Outflow</p>
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
                Search Reference, Party, or Description
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. RCT-2026, PNR, Tariq, PTCL..."
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>

            {/* Source Module Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Source Stream
              </label>
              <select
                value={sourceModule}
                onChange={(e) => {
                  setSourceModule(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">All Sources</option>
                <option value="CLIENT_PAYMENT">Client Package Payments</option>
                <option value="TICKET_PURCHASE">Air Ticket Purchases</option>
                <option value="TICKET_REFUND">Ticket Refunds</option>
                <option value="HOTEL_PAYMENT">Hotel Settlements</option>
                <option value="OFFICE_PAYMENT">Office Banking</option>
                <option value="OFFICE_EXPENSE">Daily Operational Expenses</option>
              </select>
            </div>

            {/* Transaction Type Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Flow Type
              </label>
              <select
                value={transactionType}
                onChange={(e) => {
                  setTransactionType(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">CREDIT (Inflow)</option>
                <option value="DEBIT">DEBIT (Outflow)</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                From Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs h-8 px-2"
              />
            </div>

            {/* Date Range End & Clear Button */}
            <div className="flex items-end gap-1.5">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  To Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs h-8 px-2"
                />
              </div>

              {(searchTerm || sourceModule !== "ALL" || transactionType !== "ALL" || startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  title="Clear all filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Central Ledger Table */}
      <LedgerTable
        entries={ledgerData?.results || []}
        pagination={ledgerData?.pagination}
        isLoading={isLoading}
        isFetching={isFetching}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
