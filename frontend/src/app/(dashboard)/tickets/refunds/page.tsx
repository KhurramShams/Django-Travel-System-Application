"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { refundsApi } from "@/lib/api/ticketing";
import { TicketRefund, RefundMethod } from "@/types/ticketing";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  Search,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Loader2,
  FileText,
  Printer,
  Download,
  Building,
  Plane,
} from "lucide-react";

export default function TicketRefundsAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const { data: rawRefunds, isLoading, error } = useQuery({
    queryKey: ["refunds", searchTerm, methodFilter],
    queryFn: () =>
      refundsApi.list({
        search: searchTerm || undefined,
        refund_method: methodFilter !== "ALL" ? methodFilter : undefined,
      }),
  });

  const refunds: TicketRefund[] = Array.isArray(rawRefunds) ? rawRefunds : [];

  const totalRefundedSum = refunds.reduce(
    (acc, r) => acc + Number(r.net_refund_amount || 0),
    0
  );
  const totalPenaltiesSum = refunds.reduce(
    (acc, r) => acc + Number(r.penalty_fee || 0),
    0
  );
  const totalSeatsCancelled = refunds.reduce(
    (acc, r) => acc + Number(r.refund_seats_count || 0),
    0
  );

  const getMethodBadge = (method: RefundMethod) => {
    switch (method) {
      case "CASH":
        return <Badge variant="secondary">Cash</Badge>;
      case "BANK_TRANSFER":
        return <Badge variant="brand">Bank (IBFT)</Badge>;
      case "CREDIT_ADJUSTMENT":
        return <Badge variant="warning">Agency Credit</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const handleExportCSV = () => {
    if (refunds.length === 0) return;
    const headers = [
      "Refund ID",
      "PNR",
      "Agency",
      "Airline",
      "Seats Cancelled",
      "Gross Fare",
      "Penalty Fee",
      "Net Refund",
      "Refund Date",
      "Payment Method",
      "Reason",
      "Processed By",
    ];
    const rows = refunds.map((r) => [
      r.id,
      r.ticket_pnr,
      r.agency_name,
      r.airline_name,
      r.refund_seats_count,
      r.original_amount,
      r.penalty_fee,
      r.net_refund_amount,
      r.refund_date,
      r.refund_method,
      `"${(r.reason || "").replace(/"/g, '""')}"`,
      r.processed_by_name || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ticket_refunds_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/tickets"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Purchased Tickets
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full dark:bg-rose-950 dark:text-rose-400">
              <RotateCcw className="h-3.5 w-3.5" />
              Financial Audit Ledger
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Refund Ticket
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit history of passenger seat cancellations, airline penalty deductions, and net returned funds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={refunds.length === 0}
            className="text-xs"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Link href="/tickets">
            <Button variant="brand" size="sm" className="text-xs">
              Go to AirLine Tickets
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-100 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total Net Refunded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-900 dark:text-rose-200">
              PKR {totalRefundedSum.toLocaleString()}
            </div>
            <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-1">
              Returned across {refunds.length} cancellation transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Airline Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              PKR {totalPenaltiesSum.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Withheld by carrier or consolidators
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cancelled Passenger Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalSeatsCancelled} seats
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Released back from wholesale blocks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by PNR, Agency, Airline, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
            {["ALL", "CASH", "BANK_TRANSFER", "CREDIT_ADJUSTMENT"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  methodFilter === m
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {m === "ALL"
                  ? "All Methods"
                  : m === "BANK_TRANSFER"
                  ? "Bank IBFT"
                  : m === "CREDIT_ADJUSTMENT"
                  ? "Agency Credit"
                  : "Cash"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-base font-semibold">Refund Ticket History</CardTitle>
          <CardDescription className="text-xs">
            Net calculation: Net Refund = Gross Fare - Airline Penalty Fine.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed to load refund transactions.
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RotateCcw className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No ticket refunds on record</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                No refunds match your current filters. Process refunds directly from the Purchased Tickets log.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">PNR Code</th>
                    <th className="py-3 px-4">Agency / Airline</th>
                    <th className="py-3 px-4 text-center">Seats</th>
                    <th className="py-3 px-4 text-right">Gross Fare</th>
                    <th className="py-3 px-4 text-right">Penalty Deducted</th>
                    <th className="py-3 px-4 text-right">Net Refund Issued</th>
                    <th className="py-3 px-4">Instrument</th>
                    <th className="py-3 px-4">Reason / Agent</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {r.refund_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-900 dark:text-slate-100">
                          {r.ticket_pnr}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{r.agency_name}</div>
                        <div className="text-[11px] text-slate-500">{r.airline_name}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {r.refund_seats_count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        PKR {Number(r.original_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-medium">
                        - PKR {Number(r.penalty_fee).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        PKR {Number(r.net_refund_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {getMethodBadge(r.refund_method)}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-500">
                        <span className="block truncate">{r.reason || "Client cancellation"}</span>
                        <span className="text-[10px] text-slate-400">By: {r.processed_by_name || "Agent"}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/tickets/refunds/${r.id}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">
                            <Printer className="mr-1 h-3 w-3" />
                            Voucher
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
