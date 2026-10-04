"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { packagesApi } from "@/lib/api/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  ArrowLeft,
  Calendar,
  Plane,
  Star,
  Bus,
  DollarSign,
  AlertCircle,
} from "lucide-react";

const packageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  package_code: z.string().optional().or(z.literal("")),
  location: z.enum(["MAKKAH", "MADINAH", "MAKKAH_MADINAH"]),
  star_rating: z.enum(["3_STAR", "4_STAR", "5_STAR"]),
  shuttle_service: z.boolean(),
  flight_name: z.string().min(2, "Flight details required (e.g. Saudia SV-738)"),
  departure_date: z.string().min(1, "Departure date is required"),
  return_date: z.string().min(1, "Return date is required"),
  adult_price: z.coerce.number().min(1, "Adult price required"),
  child_price: z.coerce.number().min(1, "Child price required"),
  infant_price: z.coerce.number().min(1, "Infant price required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.enum(["DRAFT", "ACTIVE"]),
  description: z.string().optional(),
});

type PackageFormData = z.infer<typeof packageSchema>;

export default function NewPackagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      title: "",
      package_code: "",
      location: "MAKKAH_MADINAH",
      star_rating: "4_STAR",
      shuttle_service: true,
      flight_name: "",
      departure_date: "",
      return_date: "",
      adult_price: 280000,
      child_price: 210000,
      infant_price: 90000,
      capacity: 50,
      status: "ACTIVE",
      description: "",
    },
  });

  const onSubmit = async (data: PackageFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        ...data,
        adult_price: data.adult_price.toString(),
        child_price: data.child_price.toString(),
        infant_price: data.infant_price.toString(),
      };
      const created = await packagesApi.create(payload as any);
      router.push(`/packages/${created.id}`);
    } catch (err: any) {
      console.error("Package creation error:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.return_date?.[0] ||
        "Could not create package. Please check inputs.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/packages"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Packages
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <Package className="h-3.5 w-3.5" />
              Inventory Specification
            </span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Create Travel Package</CardTitle>
          <CardDescription>
            Specify tour details, hotel classification, departure dates, and category base rates.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. General Package Specifications
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Package Title *
                  </label>
                  <Input
                    placeholder="e.g. 15-Day Economy Umrah Package (Rabi-ul-Awwal)"
                    error={!!errors.title}
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-[11px] text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Package Inventory Code (Optional)
                  </label>
                  <Input
                    placeholder="e.g. PKG-2026-UMR-01"
                    className="font-mono uppercase"
                    {...register("package_code")}
                  />
                  <p className="text-[11px] text-slate-400">Auto-generated if left blank</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jurisdiction / Itinerary *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                    {...register("location")}
                  >
                    <option value="MAKKAH_MADINAH">Combined Makkah & Madinah</option>
                    <option value="MAKKAH">Makkah Mukarramah Only</option>
                    <option value="MADINAH">Madinah Munawwarah Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hotel Classification *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                    {...register("star_rating")}
                  >
                    <option value="4_STAR">4 Star Standard</option>
                    <option value="5_STAR">5 Star Luxury VIP</option>
                    <option value="3_STAR">3 Star Economy</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Package Status *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                    {...register("status")}
                  >
                    <option value="ACTIVE">Active (Open for Booking)</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      {...register("shuttle_service")}
                    />
                    <span>Include Dedicated Hotel-to-Haram Shuttle Transport</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Flight & Dates */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Travel Itinerary & Quota
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Airline & Flight Code *
                  </label>
                  <Input
                    placeholder="e.g. Saudia Airlines SV-738"
                    error={!!errors.flight_name}
                    {...register("flight_name")}
                  />
                  {errors.flight_name && (
                    <p className="text-[11px] text-red-500">{errors.flight_name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Passenger Quota Capacity *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    error={!!errors.capacity}
                    {...register("capacity")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Departure Date *
                  </label>
                  <Input
                    type="date"
                    error={!!errors.departure_date}
                    {...register("departure_date")}
                  />
                  {errors.departure_date && (
                    <p className="text-[11px] text-red-500">{errors.departure_date.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Return Date *
                  </label>
                  <Input
                    type="date"
                    error={!!errors.return_date}
                    {...register("return_date")}
                  />
                  {errors.return_date && (
                    <p className="text-[11px] text-red-500">{errors.return_date.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Base Tier Pricing */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Age Tier Base Rates (PKR)
              </h3>
              <p className="text-xs text-slate-500">
                These rates will be locked into enrollments based on the passenger&apos;s age category.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Adult Price (12+) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    error={!!errors.adult_price}
                    {...register("adult_price")}
                  />
                  {errors.adult_price && (
                    <p className="text-[11px] text-red-500">{errors.adult_price.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Child Price (2-11) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    error={!!errors.child_price}
                    {...register("child_price")}
                  />
                  {errors.child_price && (
                    <p className="text-[11px] text-red-500">{errors.child_price.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Infant Price (&lt;2) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    error={!!errors.infant_price}
                    {...register("infant_price")}
                  />
                  {errors.infant_price && (
                    <p className="text-[11px] text-red-500">{errors.infant_price.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Itinerary & Hotel Details
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Hotel names in Makkah (e.g. Swissotel) and Madinah (e.g. Anwar Al Madinah), room sharing options, meal inclusions..."
                  {...register("description")}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link href="/packages">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>

            <Button type="submit" variant="brand" isLoading={isSubmitting}>
              Publish Package Offering
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
