"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { hotelsApi } from "@/lib/api/hotels";
import { HotelBooking, HotelLocation } from "@/types/hotels";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Edit3,
  X,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  BedDouble,
  CheckCircle2,
} from "lucide-react";

interface EditHotelModalProps {
  booking: HotelBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const editHotelSchema = z.object({
  hotel_name: z.string().min(2, "Hotel property name must be at least 2 characters"),
  location: z.enum(["MAKKAH", "MADINAH", "OTHER"]),
  booking_date: z.string().min(1, "Booking date is required"),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  room_details: z.string().optional(),
  total_price: z.coerce.number().min(1, "Total contracted price must be greater than zero"),
  notes: z.string().optional(),
});

type EditHotelFormValues = z.infer<typeof editHotelSchema>;

export function EditHotelModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: EditHotelModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditHotelFormValues>({
    resolver: zodResolver(editHotelSchema),
  });

  useEffect(() => {
    if (booking) {
      reset({
        hotel_name: booking.hotel_name,
        location: booking.location,
        booking_date: booking.booking_date,
        check_in: booking.check_in || "",
        check_out: booking.check_out || "",
        room_details: booking.room_details || "",
        total_price: Number(booking.total_price),
        notes: booking.notes || "",
      });
      setServerError(null);
    }
  }, [booking, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditHotelFormValues) => {
      if (!booking) throw new Error("No hotel booking selected");
      return hotelsApi.update(booking.id, {
        hotel_name: data.hotel_name,
        location: data.location as HotelLocation,
        booking_date: data.booking_date,
        check_in: data.check_in || undefined,
        check_out: data.check_out || undefined,
        room_details: data.room_details || undefined,
        total_price: data.total_price,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast.success("Hotel reservation updated successfully");
      setServerError(null);
      onClose();
      if (onSuccess) onSuccess();
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      if (booking?.id) {
        queryClient.invalidateQueries({ queryKey: ["hotel", booking.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["hotel-summary"] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to update hotel booking.";
      setServerError(msg);
    },
  });

  if (!isOpen || !booking) return null;

  const advancePaid = Number(booking.advance_paid || 0);

  const onSubmit = (data: EditHotelFormValues) => {
    if (data.total_price < advancePaid) {
      setServerError(
        `Total price cannot be reduced below PKR ${advancePaid.toLocaleString()} because that amount has already been settled.`
      );
      return;
    }
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Edit3 className="h-4 w-4" />
              </span>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Edit Hotel Reservation
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Update booking reference #{booking.booking_reference}
            </CardDescription>
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

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <CardContent className="space-y-4 pt-5">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Property Name & City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hotel Property Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. Pullman Zamzam Makkah"
                    className="pl-8 text-xs font-medium"
                    {...register("hotel_name")}
                  />
                </div>
                {errors.hotel_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.hotel_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City / Location <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  {...register("location")}
                >
                  <option value="MAKKAH">Makkah</option>
                  <option value="MADINAH">Madinah</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Dates: Booking Date, Check-in, Check-out */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Booking Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input type="date" className="pl-8 text-xs" {...register("booking_date")} />
                </div>
                {errors.booking_date && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.booking_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Check-in Date
                </label>
                <Input type="date" className="text-xs" {...register("check_in")} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Check-out Date
                </label>
                <Input type="date" className="text-xs" {...register("check_out")} />
              </div>
            </div>

            {/* Room Details & Total Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Room Configuration / Bedding
                </label>
                <div className="relative">
                  <BedDouble className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. 2 Quad Rooms, 1 Double Bed"
                    className="pl-8 text-xs"
                    {...register("room_details")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Total Contracted Price (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-8 text-xs font-mono font-semibold"
                    {...register("total_price")}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Settled so far: PKR {advancePaid.toLocaleString()}
                </p>
                {errors.total_price && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.total_price.message}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Operational Notes
              </label>
              <Input
                placeholder="e.g. Includes breakfast buffet, Haram view requested"
                className="text-xs"
                {...register("notes")}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 bg-slate-50/50 dark:bg-slate-900">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={mutation.isPending}
              loadingText="Saving Changes..."
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Update Reservation
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
