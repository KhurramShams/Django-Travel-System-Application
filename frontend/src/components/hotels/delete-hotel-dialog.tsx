"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hotelsApi } from "@/lib/api/hotels";
import { HotelBooking } from "@/types/hotels";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface DeleteHotelDialogProps {
  booking: HotelBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteHotelDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: DeleteHotelDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!booking) throw new Error("No hotel booking selected");
      return hotelsApi.delete(booking.id);
    },
    onSuccess: () => {
      toast.success("Hotel Booking Removed", "Reservation was deleted successfully.");
      setError(null);
      onClose();
      if (onSuccess) onSuccess();
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-summary"] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to delete hotel reservation.";
      setError(msg);
      toast.error("Delete Failed", msg);
    },
  });

  if (!isOpen || !booking) return null;

  const advancePaid = Number(booking.advance_paid || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Delete Hotel Booking
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Confirm reservation cancellation & archive
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {error && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-400">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to remove the hotel reservation for{" "}
            <strong className="text-slate-900 dark:text-white font-semibold">{booking.hotel_name}</strong>{" "}
            ({booking.booking_reference})?
          </p>

          {advancePaid > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-1">Financial Audit Notice:</p>
              This booking currently has <strong>PKR {advancePaid.toLocaleString()}</strong> in recorded settlement payments. Removing this reservation will safely archive the record and preserve historical ledgers.
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 bg-slate-50/50 dark:bg-slate-900">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            isLoading={mutation.isPending}
            loadingText="Deleting..."
            onClick={() => mutation.mutate()}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Confirm Deletion
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
