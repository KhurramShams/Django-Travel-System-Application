"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api/travel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  ArrowLeft,
  Plane,
  Receipt,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";

export default function InvoicePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = use(params);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", enrollmentId],
    queryFn: () => enrollmentsApi.invoice(enrollmentId),
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Generating invoice voucher...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-semibold">Invoice voucher not found.</p>
        <Link href="/finance/travelers" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Financial Center
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Non-Printable Actions Bar */}
      <div className="print:hidden flex items-center justify-between">
        <Link
          href="/finance/travelers"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Financial Accounts
        </Link>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="brand" className="font-semibold shadow-xs">
            <Printer className="mr-2 h-4 w-4" />
            Print Official Invoice
          </Button>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="mx-auto max-w-4xl bg-white p-8 sm:p-12 shadow-lg rounded-2xl border border-slate-200 text-slate-900 print:shadow-none print:border-none print:p-0 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100">
        {/* Header Branding */}
        <div className="flex justify-between items-start border-b-2 border-emerald-700 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Plane className="h-5 w-5 -rotate-45" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {invoice.agency.name}
              </h1>
            </div>
            <p className="text-xs text-emerald-800 font-semibold dark:text-emerald-400">
              {invoice.agency.tagline}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              {invoice.agency.address} • {invoice.agency.contact}
            </p>
          </div>

          <div className="text-right">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Official Client Voucher
            </span>
            <span className="font-mono text-lg font-bold text-emerald-800 dark:text-emerald-400">
              {invoice.invoice.enrollment_number}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Issue Date: <span className="font-medium text-slate-800 dark:text-slate-200">{invoice.invoice.issue_date}</span>
            </p>
            <div className="mt-2 flex justify-end">
              <Badge
                variant={invoice.financials.is_fully_paid ? "success" : "warning"}
                className="text-xs uppercase font-bold"
              >
                Payment: {invoice.invoice.payment_status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Client & Itinerary Grid */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs dark:border-slate-800">
          {/* Passenger Identity */}
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
              Pilgrim / Client Dossier
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              {invoice.traveler.full_name}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">CNIC / B-Form:</span>{" "}
              <span className="font-mono font-medium">{invoice.traveler.cnic}</span>
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Passport:</span>{" "}
              <span className="font-mono">{invoice.traveler.passport_number}</span> • Category: {invoice.traveler.age_category}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Phone:</span> {invoice.traveler.phone_number}
            </p>
            {invoice.traveler.guardian && (
              <p className="text-slate-600 dark:text-slate-400">
                <span className="font-semibold">Family Guardian:</span> {invoice.traveler.guardian}
              </p>
            )}
          </div>

          {/* Package Tour Specification */}
          <div className="space-y-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
              Package & Flight Schedule
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {invoice.package.title}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Flight:</span> {invoice.package.flight_name}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Itinerary:</span> {invoice.package.location} ({invoice.package.star_rating})
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Duration:</span> {invoice.package.duration_days} Days ({invoice.package.departure_date} &rarr; {invoice.package.return_date})
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Shuttle Service:</span>{" "}
              {invoice.package.shuttle_service ? "Included" : "Excluded"}
            </p>
          </div>
        </div>

        {/* Linked Dependents / Group Passengers */}
        {invoice.traveler.dependents && invoice.traveler.dependents.length > 0 && (
          <div className="py-4 border-b border-slate-200 text-xs dark:border-slate-800">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-2">
              Attached Family Members / Group Dependents ({invoice.traveler.dependents.length}):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {invoice.traveler.dependents.map((dep, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-900 border text-[11px]">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{dep.full_name}</p>
                  <p className="text-slate-500 font-mono">CNIC: {dep.cnic} • {dep.age_category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itemized Financial Accounting */}
        <div className="py-6 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-3">
            Financial Ledger & Price Breakdown
          </span>

          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold dark:bg-slate-900">
              <tr>
                <th className="py-2 px-3 text-left">Description</th>
                <th className="py-2 px-3 text-right">Applied Rate (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-2.5 px-3">
                  <span className="font-semibold block">Base Package Tour Rate</span>
                  <span className="text-[11px] text-slate-500">
                    Locked based on traveler age category ({invoice.traveler.age_category})
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-medium">
                  {Number(invoice.financials.base_price_applied).toLocaleString()}
                </td>
              </tr>

              {Number(invoice.financials.extra_amount) > 0 && (
                <tr>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold block">Supplemental Services & Extras</span>
                    <span className="text-[11px] text-slate-500">Room upgrades, private transport, quad to double</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700">
                    +{Number(invoice.financials.extra_amount).toLocaleString()}
                  </td>
                </tr>
              )}

              {Number(invoice.financials.discount) > 0 && (
                <tr>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold block">Authorized Discount / Concession</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-red-600">
                    -{Number(invoice.financials.discount).toLocaleString()}
                  </td>
                </tr>
              )}

              <tr className="bg-slate-50 font-bold dark:bg-slate-900/50">
                <td className="py-3 px-3 text-slate-900 dark:text-slate-100">
                  FINAL AGREED CONTRACT TOTAL
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  PKR {Number(invoice.financials.final_agreed_price).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payments History Ledger */}
        <div className="py-6 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-3">
            Payment Receipts Received
          </span>

          {invoice.payments_history && invoice.payments_history.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold dark:bg-slate-900">
                <tr>
                  <th className="py-2 px-3 text-left">Receipt #</th>
                  <th className="py-2 px-3 text-left">Date</th>
                  <th className="py-2 px-3 text-left">Instrument</th>
                  <th className="py-2 px-3 text-left">Reference #</th>
                  <th className="py-2 px-3 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {invoice.payments_history.map((p, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-semibold text-emerald-800 dark:text-emerald-400">
                      {p.receipt_number}
                    </td>
                    <td className="py-2 px-3">{p.payment_date}</td>
                    <td className="py-2 px-3 font-sans">{p.payment_method}</td>
                    <td className="py-2 px-3">{p.reference_number}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600">
                      {Number(p.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 italic">No payments recorded against this enrollment yet.</p>
          )}

          {/* Ledger Totals */}
          <div className="mt-4 flex flex-col items-end space-y-1 text-xs font-mono">
            <div className="flex justify-between w-64 text-slate-600 dark:text-slate-400">
              <span>Total Payments Received:</span>
              <span className="font-bold text-emerald-600">
                PKR {Number(invoice.financials.total_paid).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between w-64 pt-1 border-t text-sm font-bold">
              <span>Remaining Balance:</span>
              <span className={invoice.financials.is_fully_paid ? "text-emerald-700" : "text-amber-700"}>
                PKR {Number(invoice.financials.remaining_balance).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer & Signatures */}
        <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Terms & Conditions:</p>
            <p className="text-[10px] text-slate-400 max-w-sm mt-0.5">
              1. Visa clearance is subject to approval from the Ministry of Hajj & Umrah, Saudi Arabia.
              2. Cancellations or changes to hotel vouchers are governed by agency group travel policies.
            </p>
          </div>

          <div className="flex gap-8 text-center text-[10px] text-slate-400 font-medium">
            <div className="w-28 pt-8 border-t border-slate-300 dark:border-slate-700">
              Customer Signature
            </div>
            <div className="w-28 pt-8 border-t border-slate-300 dark:border-slate-700">
              Authorized Agent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
