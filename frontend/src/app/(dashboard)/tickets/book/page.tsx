"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ticketsApi } from "@/lib/api/ticketing";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Plane,
  Building,
  Hash,
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText,
  CheckCircle2,
  Ticket,
} from "lucide-react";

const ticketBookingSchema = z.object({
  agency_name: z.string().min(2, "Agency name must be at least 2 characters"),
  airline_name: z.string().min(2, "Airline name must be at least 2 characters"),
  pnr_number: z
    .string()
    .min(5, "PNR must be at least 5 alphanumeric characters")
    .max(12, "PNR cannot exceed 12 characters")
    .regex(/^[A-Za-z0-9]+$/, "PNR must contain only alphanumeric characters"),
  total_tickets: z.coerce.number().min(1, "Total tickets must be at least 1"),
  issue_date: z.string().min(1, "Issue date is required"),
  total_price: z.coerce.number().min(1, "Total purchase price must be greater than zero"),
  notes: z.string().optional(),
});

type TicketBookingFormValues = z.infer<typeof ticketBookingSchema>;

export default function BookAgencyTicketPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TicketBookingFormValues>({
    resolver: zodResolver(ticketBookingSchema),
    defaultValues: {
      agency_name: "",
      airline_name: "",
      pnr_number: "",
      total_tickets: 1,
      issue_date: new Date().toISOString().split("T")[0],
      total_price: 0,
      notes: "",
    },
  });

  const watchedTotalSeats = watch("total_tickets") || 1;
  const watchedTotalPrice = watch("total_price") || 0;
  const perSeatEstimate =
    watchedTotalSeats > 0 ? (watchedTotalPrice / watchedTotalSeats).toFixed(2) : "0.00";

  const onSubmit = async (data: TicketBookingFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await ticketsApi.create({
        agency_name: data.agency_name.trim(),
        airline_name: data.airline_name.trim(),
        pnr_number: data.pnr_number.trim().toUpperCase(),
        total_tickets: data.total_tickets,
        issue_date: data.issue_date,
        total_price: data.total_price,
        notes: data.notes?.trim() || "",
      });

      router.push("/tickets");
    } catch (err: any) {
      console.error("Ticket issuance error:", err);
      const resData = err?.response?.data;
      const msg =
        resData?.error?.message ||
        resData?.pnr_number?.[0] ||
        resData?.total_price?.[0] ||
        resData?.detail ||
        "Failed to issue agency ticket. Please review form inputs.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAgencies = ["Falcon Aviation Consolidators", "Gerry's International", "Bukhari Travels", "Air Falcon Services", "Dunya Travels"];
  const presetAirlines = ["Pakistan International Airlines (PIA)", "Saudia (Saudi Arabian Airlines)", "Emirates Airline", "Fly Jinnah", "Airblue", "Flynas", "Qatar Airways"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link & Header */}
      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Purchased Ticket Logs
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
            <Ticket className="h-3.5 w-3.5" />
            Wholesale Ticket Inventory
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Book AirLine Ticket
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Record purchased wholesale group tickets, airline carrier details, and seat quotas under consolidator PNRs.
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-semibold">Ticketing Purchase Details</CardTitle>
          <CardDescription>
            Enter the airline PNR reference, wholesale distributor, seat allocations, and wholesale invoice price.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 pt-5">
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* PNR Code & Issue Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-emerald-600" />
                  PNR Number (Booking Code) *
                </label>
                <Input
                  placeholder="e.g. PK741A, SV890X"
                  className="font-mono uppercase font-bold tracking-wider"
                  error={!!errors.pnr_number}
                  {...register("pnr_number")}
                  onChange={(e) => setValue("pnr_number", e.target.value.toUpperCase())}
                />
                {errors.pnr_number && (
                  <p className="text-[11px] text-red-500">{errors.pnr_number.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  Issue / Purchase Date *
                </label>
                <Input
                  type="date"
                  error={!!errors.issue_date}
                  {...register("issue_date")}
                />
                {errors.issue_date && (
                  <p className="text-[11px] text-red-500">{errors.issue_date.message}</p>
                )}
              </div>
            </div>

            {/* Agency Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-emerald-600" />
                Ticketing Agency / Consolidator Name *
              </label>
              <Input
                placeholder="e.g. Falcon Aviation Consolidators, Gerry's, Bukhari Travels"
                error={!!errors.agency_name}
                {...register("agency_name")}
              />
              {errors.agency_name && (
                <p className="text-[11px] text-red-500">{errors.agency_name.message}</p>
              )}
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Popular:</span>
                {presetAgencies.map((agency) => (
                  <button
                    key={agency}
                    type="button"
                    onClick={() => setValue("agency_name", agency, { shouldValidate: true })}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {agency}
                  </button>
                ))}
              </div>
            </div>

            {/* Airline Carrier */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Plane className="h-3.5 w-3.5 text-emerald-600" />
                Operating Airline *
              </label>
              <Input
                placeholder="e.g. Pakistan International Airlines (PIA), Saudia, Fly Jinnah"
                error={!!errors.airline_name}
                {...register("airline_name")}
              />
              {errors.airline_name && (
                <p className="text-[11px] text-red-500">{errors.airline_name.message}</p>
              )}
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Select:</span>
                {presetAirlines.map((air) => (
                  <button
                    key={air}
                    type="button"
                    onClick={() => setValue("airline_name", air, { shouldValidate: true })}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {air.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Passenger Seats & Total Purchase Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  Total Passenger Seats *
                </label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 10"
                  error={!!errors.total_tickets}
                  {...register("total_tickets")}
                />
                {errors.total_tickets && (
                  <p className="text-[11px] text-red-500">{errors.total_tickets.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  Total Purchase Price (PKR) *
                </label>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  placeholder="e.g. 1500000"
                  error={!!errors.total_price}
                  {...register("total_price")}
                />
                {errors.total_price && (
                  <p className="text-[11px] text-red-500">{errors.total_price.message}</p>
                )}
              </div>
            </div>

            {/* Live Pricing Breakdown Card */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Calculated Cost Per Passenger Seat
                </p>
                <p className="text-[11px] text-slate-500">
                  Wholesale baseline: PKR {Number(watchedTotalPrice || 0).toLocaleString()} ÷ {watchedTotalSeats} seats
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  PKR {Number(perSeatEstimate).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">per seat</span>
              </div>
            </div>

            {/* Flight Sectors / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Flight Sectors & Routing Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Sector: ISB -> JED -> ISB | Baggage: 2x 23KG | Flight: SV-723 / SV-724"
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register("notes")}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link href="/tickets">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="brand" size="sm" isLoading={isSubmitting}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Save & Book AirLine Ticket
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
