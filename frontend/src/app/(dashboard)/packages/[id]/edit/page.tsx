"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { packagesApi } from "@/lib/api/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

const packageEditSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  package_code: z.string().min(1, "Package code required"),
  location: z.enum(["MAKKAH", "MADINAH", "MAKKAH_MADINAH"]),
  star_rating: z.enum(["3_STAR", "4_STAR", "5_STAR"]),
  shuttle_service: z.boolean(),
  flight_name: z.string().min(2, "Flight details required"),
  departure_date: z.string().min(1, "Departure date required"),
  return_date: z.string().min(1, "Return date required"),
  adult_price: z.coerce.number().min(1, "Adult price required"),
  child_price: z.coerce.number().min(1, "Child price required"),
  infant_price: z.coerce.number().min(1, "Infant price required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]),
  description: z.string().optional(),
});

type PackageEditFormData = z.infer<typeof packageEditSchema>;

export default function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: pkg, isLoading } = useQuery({
    queryKey: ["package-edit", id],
    queryFn: () => packagesApi.get(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PackageEditFormData>({
    resolver: zodResolver(packageEditSchema),
  });

  useEffect(() => {
    if (pkg) {
      reset({
        title: pkg.title,
        package_code: pkg.package_code,
        location: pkg.location,
        star_rating: pkg.star_rating,
        shuttle_service: pkg.shuttle_service,
        flight_name: pkg.flight_name,
        departure_date: pkg.departure_date,
        return_date: pkg.return_date,
        adult_price: Number(pkg.adult_price),
        child_price: Number(pkg.child_price),
        infant_price: Number(pkg.infant_price),
        capacity: pkg.capacity,
        status: pkg.status,
        description: pkg.description || "",
      });
    }
  }, [pkg, reset]);

  const onSubmit = async (data: PackageEditFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        ...data,
        adult_price: data.adult_price.toString(),
        child_price: data.child_price.toString(),
        infant_price: data.infant_price.toString(),
      };
      await packagesApi.update(id, payload as any);
      router.push(`/packages/${id}`);
    } catch (err: any) {
      console.error("Package edit error:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.return_date?.[0] ||
        "Could not update package. Please check inputs.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/packages/${id}`}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Package Details
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Edit Travel Package</CardTitle>
          <CardDescription>Update departure schedule, hotel rating, or pricing tiers.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold">Package Title *</label>
                <Input error={!!errors.title} {...register("title")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Package Code *</label>
                <Input error={!!errors.package_code} {...register("package_code")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Status *</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
                  {...register("status")}
                >
                  <option value="ACTIVE">Active (Open for Booking)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Departure Date *</label>
                <Input type="date" error={!!errors.departure_date} {...register("departure_date")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Return Date *</label>
                <Input type="date" error={!!errors.return_date} {...register("return_date")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Airline & Flight Code *</label>
                <Input error={!!errors.flight_name} {...register("flight_name")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Passenger Quota Capacity *</label>
                <Input type="number" min={1} error={!!errors.capacity} {...register("capacity")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Adult Base Rate (PKR) *</label>
                <Input type="number" min={0} error={!!errors.adult_price} {...register("adult_price")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Child Base Rate (PKR) *</label>
                <Input type="number" min={0} error={!!errors.child_price} {...register("child_price")} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Infant Base Rate (PKR) *</label>
                <Input type="number" min={0} error={!!errors.infant_price} {...register("infant_price")} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input type="checkbox" className="rounded" {...register("shuttle_service")} />
                  <span>Dedicated Haram Shuttle Service Included</span>
                </label>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold">Itinerary & Hotel Details</label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs"
                  {...register("description")}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link href={`/packages/${id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="brand" isLoading={isSubmitting}>
              Save Package Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
