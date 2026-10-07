"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { hotelsApi } from "@/lib/api/hotels";
import { HotelLocation, HotelPaymentMethod } from "@/types/hotels";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  BedDouble,
  CreditCard,
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const bookHotelSchema = z
  .object({
    hotel_name: z.string().min(2, "Hotel property name must be at least 2 characters"),
    location: z.enum(["MAKKAH", "MADINAH", "OTHER"]),
    booking_date: z.string().min(1, "Booking date is required"),
    check_in: z.string().optional(),
    check_out: z.string().optional(),
    room_details: z.string().optional(),
    total_price: z.coerce.number().min(1, "Total contracted price must be greater than zero"),
    advance_paid: z.coerce.number().min(0, "Advance paid cannot be negative"),
    payment_method: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE"]).optional(),
    reference_number: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.advance_paid <= data.total_price, {
    message: "Advance paid cannot exceed the total contracted price.",
    path: ["advance_paid"],
  })
  .refine(
    (data) => {
      if (data.check_in && data.check_out) {
        return new Date(data.check_in) <= new Date(data.check_out);
      }
      return true;
    },
    {
      message: "Check-out date must occur on or after check-in date.",
      path: ["check_out"],
    }
  );

type BookHotelFormValues = z.infer<typeof bookHotelSchema>;

export default function BookHotelPage() {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookHotelFormValues>({
    resolver: zodResolver(bookHotelSchema),
    defaultValues: {
      location: "MAKKAH",
      booking_date: new Date().toISOString().split("T")[0],
      total_price: undefined,
      advance_paid: 0,
      payment_method: "CASH",
      reference_number: "",
      notes: "",
    },
  });

  const totalPrice = watch("total_price") || 0;
  const advancePaid = watch("advance_paid") || 0;
  const remainingAmount = React.useMemo(() => {
    return Math.max(0, Number(totalPrice) - Number(advancePaid));
  }, [totalPrice, advancePaid]);

  const projectedStatus = React.useMemo(() => {
    return Number(totalPrice) > 0 && Number(advancePaid) >= Number(totalPrice)
      ? "PAID"
      : Number(advancePaid) > 0
      ? "PARTIAL"
      : "UNPAID";
  }, [totalPrice, advancePaid]);

  const mutation = useMutation({
    mutationFn: (data: BookHotelFormValues) =>
      hotelsApi.create({
        hotel_name: data.hotel_name,
        location: data.location as HotelLocation,
        booking_date: data.booking_date,
        check_in: data.check_in || undefined,
        check_out: data.check_out || undefined,
        room_details: data.room_details || undefined,
        total_price: data.total_price,
        advance_paid: data.advance_paid,
        payment_method: data.payment_method as HotelPaymentMethod,
        reference_number: data.reference_number || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: (booking) => {
      toast.success(
        "Hotel Booking Saved",
        `${booking.hotel_name} (${booking.location}) reserved successfully.`
      );
      queryClient.invalidateQueries({ queryKey: ["hotels"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-summary"] });
      router.push(`/hotels/${booking.id}`);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.message ||
        "An unexpected error occurred while booking the hotel.";
      setServerError(msg);
      toast.error("Hotel Booking Failed", msg);
    },
  });

  const onSubmit = (data: BookHotelFormValues) => {
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hotels">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Book Hotel Reservation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contract accommodations, record room allotments, and capture initial deposits.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Form Fields (2 columns) */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Property & Reservation Specifications
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter property location, lodging dates, and room breakdown
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {serverError && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Hotel Name & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Hotel Property Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="e.g. Pullman Zamzam, Swissotel, Dar Al Taqwa"
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
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-medium"
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
                    {errors.check_out && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.check_out.message}</p>
                    )}
                  </div>
                </div>

                {/* Room Details */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Room Details & Bedding Allotment
                  </label>
                  <div className="relative">
                    <BedDouble className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. 2 Quad Rooms, 1 Double Bed, Haram View"
                      className="pl-8 text-xs"
                      {...register("room_details")}
                    />
                  </div>
                </div>

                {/* Operational Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Booking Notes & Remarks
                  </label>
                  <Input
                    placeholder="e.g. Complimentary breakfast included, late checkout requested"
                    className="text-xs"
                    {...register("notes")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Contract & Advance */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Financial Contract & Initial Settlement
                </CardTitle>
                <CardDescription className="text-xs">
                  Specify total contracted cost and initial deposit advance
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Contracted Price */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Total Contracted Price (PKR) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 150000"
                        className="pl-8 text-xs font-mono font-semibold"
                        {...register("total_price")}
                      />
                    </div>
                    {errors.total_price && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.total_price.message}</p>
                    )}
                  </div>

                  {/* Advance Paid */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Advance Paid Upon Booking (PKR)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 50000"
                        className="pl-8 text-xs font-mono font-semibold"
                        {...register("advance_paid")}
                      />
                    </div>
                    {errors.advance_paid && (
                      <p className="text-[11px] text-rose-500 mt-1">{errors.advance_paid.message}</p>
                    )}
                  </div>
                </div>

                {/* If advance paid > 0, capture payment channel details */}
                {advancePaid > 0 && (
                  <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 border border-emerald-100 dark:border-emerald-900/50 space-y-3">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                      Initial Advance Settlement Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Payment Method
                        </label>
                        <select
                          className="w-full h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                          {...register("payment_method")}
                        >
                          <option value="CASH">Cash</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Cheque / Bank Reference
                        </label>
                        <Input
                          placeholder="e.g. TRX-887766"
                          className="h-8 text-xs"
                          {...register("reference_number")}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Calculation Summary & Action */}
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs sticky top-4">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Balance Calculation
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time financial reconciliation
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Contracted Total:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    PKR {Number(totalPrice).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-emerald-600">Advance Paid:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    PKR {Number(advancePaid).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-slate-900 dark:text-white">Remaining Balance:</span>
                  <span
                    className={`font-mono text-sm font-extrabold ${
                      remainingAmount > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    PKR {remainingAmount.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1">Projected Status:</span>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      projectedStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : projectedStatus === "PARTIAL"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {projectedStatus}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 bg-slate-50/50 dark:bg-slate-900">
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full gap-2"
                  isLoading={mutation.isPending}
                  loadingText="Creating Reservation..."
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Save Booking
                </Button>

                <Link href="/hotels" className="w-full">
                  <Button type="button" variant="outline" className="w-full text-xs">
                    Cancel
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
