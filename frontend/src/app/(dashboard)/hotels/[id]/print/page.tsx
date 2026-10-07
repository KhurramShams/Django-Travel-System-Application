"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { hotelsApi } from "@/lib/api/hotels";
import { Button } from "@/components/ui/button";
import { PDFHeader, PDFFooter } from "@/components/pdf";
import {
  Printer,
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  FileText,
  CreditCard,
} from "lucide-react";

export default function PrintHotelVoucherPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["hotel", id],
    queryFn: () => hotelsApi.get(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs">Preparing official hotel voucher...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border">
        <h2 className="text-base font-bold text-slate-900">Voucher record not found</h2>
        <Link href="/hotels" className="mt-4 inline-block">
          <Button size="sm" variant="outline">
            Return to Hotel Directory
          </Button>
        </Link>
      </div>
    );
  }

  const remaining = Number(booking.remaining_amount);
  const total = Number(booking.total_price);
  const paid = Number(booking.advance_paid);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Action Bar (Hidden during printing) */}
      <div className="print:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Link href={`/hotels/${booking.id}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Reservation
            </Button>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-mono">
            Booking #{booking.booking_reference}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print Voucher (PDF)
          </Button>
        </div>
      </div>

      {/* Official Printable Voucher Document */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Unified Agency Header */}
        <PDFHeader
          docTitle="Hotel Voucher"
          docNumber={`VOUCHER #${booking.booking_reference}`}
          issueDate={new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          tagline="Hajj, Umrah & Tourism Management System"
        />

        {/* Property & Stay Summary Block */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Property Information
            </span>
            <h3 className="text-base font-bold text-slate-900">{booking.hotel_name}</h3>
            <p className="text-slate-600 font-medium mt-1">Location: {booking.location}, Saudi Arabia</p>
            <p className="text-slate-500 mt-1">
              Room Allotment: {booking.room_details || "Standard Room Configuration"}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Reservation Dates
            </span>
            <p className="text-slate-700 font-medium">
              Check-In: <span className="font-bold text-slate-900 font-mono">{booking.check_in || "As per itinerary"}</span>
            </p>
            <p className="text-slate-700 font-medium mt-1">
              Check-Out: <span className="font-bold text-slate-900 font-mono">{booking.check_out || "As per itinerary"}</span>
            </p>
            <p className="text-slate-500 mt-1 font-mono">
              Contract Date: {booking.booking_date}
            </p>
          </div>
        </div>

        {/* Financial Settlement Ledger Table */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Settlement & Payment Ledger
          </h4>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
              <tr>
                <th className="py-2 px-3 border-b">#</th>
                <th className="py-2 px-3 border-b">Receipt #</th>
                <th className="py-2 px-3 border-b">Date</th>
                <th className="py-2 px-3 border-b">Channel</th>
                <th className="py-2 px-3 border-b">Ref / Cheque #</th>
                <th className="py-2 px-3 border-b text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(!booking.payments || booking.payments.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-3 px-3 text-center text-slate-400">
                    No individual ledger records logged.
                  </td>
                </tr>
              ) : (
                booking.payments.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.receipt_number}</td>
                    <td className="py-2 px-3 font-mono">{p.payment_date}</td>
                    <td className="py-2 px-3">{p.payment_method}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{p.reference_number || "—"}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      PKR {Number(p.amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Balance Reconciliation Summary */}
        <div className="flex justify-end mb-12">
          <div className="w-72 space-y-2 border-t-2 border-slate-900 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Total Contracted Price:</span>
              <span className="font-mono font-bold">PKR {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span className="font-medium">Total Settled / Paid:</span>
              <span className="font-mono font-bold">PKR {paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold">
              <span>Outstanding Balance:</span>
              <span className={`font-mono ${remaining > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                PKR {remaining.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-[11px]">
              <span className="text-slate-500">Account Status:</span>
              <span className="font-bold uppercase tracking-wider">{booking.payment_status}</span>
            </div>
          </div>
        </div>

        {/* Remarks / Terms */}
        {booking.notes && (
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded border border-slate-200 mb-10">
            <strong>Notes & Inclusions:</strong> {booking.notes}
          </div>
        )}

        {/* Unified Agency Footer & Signatures */}
        <PDFFooter
          signatures={[
            { title: "Prepared By", subtitle: booking.created_by_name || "Ticketing Officer" },
            { title: "Operations Manager", subtitle: "Khas Travels" },
            { title: "Official Seal & Stamp", isStamp: true },
          ]}
          note="This is an authorized hotel accommodation voucher. Please present this document upon check-in at the hotel reception."
        />
      </div>
    </div>
  );
}
