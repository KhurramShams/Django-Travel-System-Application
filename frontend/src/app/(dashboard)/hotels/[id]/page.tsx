"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { hotelsApi } from "@/lib/api/hotels";
import { HotelBooking } from "@/types/hotels";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  CreditCard,
  Edit3,
  MapPin,
  Printer,
  Trash2,
  ArrowLeft,
  DollarSign,
  BedDouble,
  Receipt,
  CheckCircle2,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { AddRemainingModal } from "@/components/hotels/add-remaining-modal";
import { EditHotelModal } from "@/components/hotels/edit-hotel-modal";
import { DeleteHotelDialog } from "@/components/hotels/delete-hotel-dialog";

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: booking,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["hotel", id],
    queryFn: () => hotelsApi.get(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs">Loading hotel reservation details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Reservation not found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested hotel booking could not be located.</p>
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hotels">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {booking.hotel_name}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  booking.payment_status === "PAID"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : booking.payment_status === "PARTIAL"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {booking.payment_status}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Ref #{booking.booking_reference} • Booked on {booking.booking_date}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {remaining > 0 && (
            <Button
              variant="brand"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Add Remaining
            </Button>
          )}

          <Link href={`/hotels/${booking.id}/print`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              Print Voucher (PDF)
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            title="Delete Reservation"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Financial Status Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-slate-400 block">Total Contracted Price</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              PKR {total.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Total agreed rate</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
              Settled Advance Paid
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              PKR {paid.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600/70">
              {((paid / (total || 1)) * 100).toFixed(0)}% Disbursed
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block">
              Outstanding Remaining Balance
            </span>
            <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
              PKR {remaining.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-600/70">
              {remaining === 0 ? "Completely Settled" : "Pending Payment"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Specifications */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Property Specifications & Stay Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">City / Location:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              {booking.location}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Check-In Date:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {booking.check_in || "Not specified"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Check-Out Date:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {booking.check_out || "Not specified"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Booked By Agent:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {booking.created_by_name || "System Admin"}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-slate-400 block font-medium">Room Details / Bedding:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
              {booking.room_details || "Standard Room Configuration"}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-slate-400 block font-medium">Remarks / Operational Notes:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
              {booking.notes || "None"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Ledger Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Settlement Ledger History
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Complete chronological audit trail of advance and incremental payments
            </CardDescription>
          </div>
          {remaining > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <CreditCard className="h-3 w-3" />
              Add Payment
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!booking.payments || booking.payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No payments have been recorded for this hotel booking yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4 text-right">Amount (PKR)</th>
                    <th className="py-2.5 px-4">Recorded By</th>
                    <th className="py-2.5 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {booking.payments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {pmt.receipt_number}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {pmt.payment_date}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {pmt.payment_method}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        {pmt.reference_number || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        PKR {Number(pmt.amount).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                        {pmt.recorded_by_name || "Admin"}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                        {pmt.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddRemainingModal
        booking={booking}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditHotelModal
        booking={booking}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <DeleteHotelDialog
        booking={booking}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={() => router.push("/hotels")}
      />
    </div>
  );
}
