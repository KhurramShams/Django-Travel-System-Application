"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { refundsApi } from "@/lib/api/ticketing";
import { Button } from "@/components/ui/button";
import {
  Printer,
  ArrowLeft,
  RotateCcw,
  Plane,
  Building,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketRefundVoucherPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: refund, isLoading, error } = useQuery({
    queryKey: ["refund-detail", id],
    queryFn: () => refundsApi.get(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Loading refund voucher...</p>
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 rounded-lg border border-red-200 bg-red-50 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-red-900">Voucher Not Found</h2>
        <p className="text-xs text-red-700 mt-1">Unable to locate the refund transaction receipt.</p>
        <Link href="/tickets/refunds" className="mt-4 inline-block">
          <Button size="sm" variant="outline">Back to Refund Logs</Button>
        </Link>
      </div>
    );
  }

  const voucherNumber = `RFV-${refund.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action Bar (hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/tickets/refunds"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Refund Logs
        </Link>
        <div className="flex gap-2">
          <Button
            variant="brand"
            size="sm"
            onClick={() => window.print()}
            className="text-xs shadow-sm"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print Refund Voucher
          </Button>
        </div>
      </div>

      {/* Printable Voucher Paper */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white font-bold">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Karwan-e-Asotvi Travels
                </h1>
                <p className="text-xs text-slate-500">Official Flight Ticket Refund & Credit Voucher</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Licensed Hajj, Umrah & Airline Passenger Operations • Pakistan
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold font-mono text-rose-700 dark:bg-rose-950 dark:text-rose-400">
              {voucherNumber}
            </span>
            <p className="text-xs text-slate-500 mt-2">Date: <strong className="text-slate-800 dark:text-slate-200">{refund.refund_date}</strong></p>
            <p className="text-[11px] text-slate-400">Auditor: {refund.processed_by_name || "System Admin"}</p>
          </div>
        </div>

        {/* Flight & Ticket Booking Particulars */}
        <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Flight Booking Reference
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Airline PNR</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{refund.ticket_pnr}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Carrier</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{refund.airline_name}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Consolidator Agency</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{refund.agency_name}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold block">Cancelled Seats</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{refund.refund_seats_count} passenger seats</span>
            </div>
          </div>
        </div>

        {/* Itemized Financial Settlement */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Financial Settlement Breakdown
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-400 font-semibold">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Accounting Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 text-slate-800 dark:text-slate-200">
                  Gross Fare for {refund.refund_seats_count} Cancelled Seat(s)
                  <span className="block text-[10px] text-slate-400">Baseline original ticket purchase snapshot</span>
                </td>
                <td className="py-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                  PKR {Number(refund.original_amount).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-rose-700 dark:text-rose-400">
                  Less: Airline Cancellation Penalty / Service Charge
                  <span className="block text-[10px] text-rose-500/80">Withheld per carrier tariff policy</span>
                </td>
                <td className="py-3 text-right font-mono font-medium text-rose-700 dark:text-rose-400">
                  - PKR {Number(refund.penalty_fee).toLocaleString()}
                </td>
              </tr>
              <tr className="border-t-2 border-slate-900 dark:border-slate-100 font-bold">
                <td className="py-4 text-sm text-slate-900 dark:text-white">
                  Net Refundable Balance Issued
                  <span className="block text-[10px] font-normal text-slate-500">
                    Payment Method: <strong className="uppercase">{refund.refund_method.replace("_", " ")}</strong>
                  </span>
                </td>
                <td className="py-4 text-right font-mono text-base text-emerald-700 dark:text-emerald-400">
                  PKR {Number(refund.net_refund_amount).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Narration */}
        {refund.reason && (
          <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/30">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Cancellation Reason:</span>
            <p className="text-slate-600 dark:text-slate-400">{refund.reason}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-12 pt-8 border-t border-dashed border-slate-200 grid grid-cols-2 gap-12 text-center text-xs dark:border-slate-800">
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 h-12 w-3/4 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Authorized Officer / Accountant</p>
            <p className="text-[10px] text-slate-400">Karwan-e-Asotvi Travels</p>
          </div>
          <div>
            <div className="border-b border-slate-300 dark:border-slate-700 h-12 w-3/4 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Client / Agency Recipient</p>
            <p className="text-[10px] text-slate-400">Acknowledgement of Refund</p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-8">
          This is an electronically generated and authorized refund note from Karwan-e-Asotvi Travels Management System.
        </p>
      </div>
    </div>
  );
}
