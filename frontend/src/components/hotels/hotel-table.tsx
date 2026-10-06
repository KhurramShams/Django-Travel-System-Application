"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HotelBooking } from "@/types/hotels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  CreditCard,
  Edit3,
  ExternalLink,
  MapPin,
  Printer,
  Trash2,
  ChevronRight,
  PlusCircle,
  Eye,
} from "lucide-react";
import { AddRemainingModal } from "./add-remaining-modal";
import { EditHotelModal } from "./edit-hotel-modal";
import { DeleteHotelDialog } from "./delete-hotel-dialog";

interface HotelTableProps {
  bookings: HotelBooking[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export function HotelTable({ bookings, isLoading, onRefresh }: HotelTableProps) {
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<HotelBooking | null>(null);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<HotelBooking | null>(null);
  const [selectedBookingForDelete, setSelectedBookingForDelete] = useState<HotelBooking | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs">Loading hotel reservations...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No hotel reservations found</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          No bookings match your current filter criteria. You can create a new reservation using the Book Hotel screen.
        </p>
        <Link href="/hotels/book" className="mt-4">
          <Button size="sm" variant="brand" className="gap-1.5 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Book Hotel
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Booking Ref</th>
              <th className="py-3 px-4">Hotel Property</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Booking Date</th>
              <th className="py-3 px-4 text-right">Contracted Total</th>
              <th className="py-3 px-4 text-right">Advance Paid</th>
              <th className="py-3 px-4 text-right">Remaining Balance</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookings.map((booking) => {
              const remaining = Number(booking.remaining_amount);
              return (
                <tr
                  key={booking.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Reference */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    <Link
                      href={`/hotels/${booking.id}`}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline"
                    >
                      {booking.booking_reference}
                    </Link>
                  </td>

                  {/* Hotel Name */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {booking.hotel_name}
                    </div>
                    {booking.room_details && (
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {booking.room_details}
                      </span>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        booking.location === "MAKKAH"
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                          : booking.location === "MADINAH"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      {booking.location}
                    </span>
                  </td>

                  {/* Booking Date */}
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {booking.booking_date}
                  </td>

                  {/* Contracted Total */}
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                    PKR {Number(booking.total_price).toLocaleString()}
                  </td>

                  {/* Advance Paid */}
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    PKR {Number(booking.advance_paid).toLocaleString()}
                  </td>

                  {/* Remaining Balance */}
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    <span
                      className={
                        remaining > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    >
                      PKR {remaining.toLocaleString()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        booking.payment_status === "PAID"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : booking.payment_status === "PARTIAL"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {booking.payment_status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Add Remaining Button (if balance remains) */}
                      {remaining > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                          title="Record Installment (Add Remaining)"
                          onClick={() => setSelectedBookingForPayment(booking)}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Add Remaining
                        </Button>
                      )}

                      {/* Print PDF Voucher */}
                      <Link href={`/hotels/${booking.id}/print`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Print Hotel Voucher"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      {/* View Details */}
                      <Link href={`/hotels/${booking.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      {/* Edit Booking */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Edit Booking"
                        onClick={() => setSelectedBookingForEdit(booking)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>

                      {/* Delete Booking */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete Booking"
                        onClick={() => setSelectedBookingForDelete(booking)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Remaining Modal */}
      <AddRemainingModal
        booking={selectedBookingForPayment}
        isOpen={Boolean(selectedBookingForPayment)}
        onClose={() => setSelectedBookingForPayment(null)}
        onSuccess={onRefresh}
      />

      {/* Edit Hotel Modal */}
      <EditHotelModal
        booking={selectedBookingForEdit}
        isOpen={Boolean(selectedBookingForEdit)}
        onClose={() => setSelectedBookingForEdit(null)}
        onSuccess={onRefresh}
      />

      {/* Delete Hotel Dialog */}
      <DeleteHotelDialog
        booking={selectedBookingForDelete}
        isOpen={Boolean(selectedBookingForDelete)}
        onClose={() => setSelectedBookingForDelete(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}
