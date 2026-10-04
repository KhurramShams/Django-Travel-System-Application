"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { packagesApi } from "@/lib/api/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ArrowLeft,
  Calendar,
  Plane,
  Star,
  Bus,
  Users,
  UserPlus,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  DollarSign,
} from "lucide-react";

export default function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: pkg, isLoading: pkgLoading } = useQuery({
    queryKey: ["package", id],
    queryFn: () => packagesApi.get(id),
  });

  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ["package-roster", id],
    queryFn: () => packagesApi.roster(id),
  });

  if (pkgLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Loading package details...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-semibold">Package not found.</p>
        <Link href="/packages" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Packages
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/packages"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Packages
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {pkg.title}
            </h1>
            <Badge variant={pkg.status === "ACTIVE" ? "success" : "outline"}>
              {pkg.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Inventory Code: <span className="font-semibold">{pkg.package_code}</span> • Flight: {pkg.flight_name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/enrollments/new?package_id=${pkg.id}`}>
            <Button variant="brand" className="font-semibold shadow-xs">
              <UserPlus className="mr-2 h-4 w-4" />
              Enroll Pilgrim
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Total Quota</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{pkg.capacity} Seats</span>
            </div>
            <Users className="h-8 w-8 text-slate-300" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Enrolled Pilgrims</span>
              <span className="text-xl font-bold text-emerald-600">{pkg.total_enrolled} Booked</span>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-100 dark:text-emerald-950" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Available Quota</span>
              <span className="text-xl font-bold text-teal-600">{pkg.seats_available} Seats Left</span>
            </div>
            <Package className="h-8 w-8 text-teal-100 dark:text-teal-950" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Duration</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{pkg.duration_days} Days</span>
            </div>
            <Calendar className="h-8 w-8 text-slate-300" />
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Specification */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Itinerary & Tiered Pricing</CardTitle>
            <CardDescription>Flight details, hotel classification, and category rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-xs">Destination Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pkg.location.replace("_", " ")}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-xs">Hotel Star Classification</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pkg.star_rating.replace("_", " ")}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-xs">Departure Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pkg.departure_date}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-xs">Return Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pkg.return_date}
                </span>
              </div>
            </div>

            {/* Base Tier Pricing Breakdown */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Age Tier Base Rates (PKR)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-center border">
                  <span className="text-xs text-slate-500 block">Adult (12+)</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    PKR {Number(pkg.adult_price).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-center border">
                  <span className="text-xs text-slate-500 block">Child (2-11)</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    PKR {Number(pkg.child_price).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-center border">
                  <span className="text-xs text-slate-500 block">Infant (&lt;2)</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    PKR {Number(pkg.infant_price).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {pkg.description && (
              <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Package Description & Inclusions:
                </span>
                <p className="whitespace-pre-line">{pkg.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transport & Amenities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Transport & Flights</CardTitle>
            <CardDescription>Logistics specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
              <Plane className="h-5 w-5 text-emerald-600" />
              <div>
                <span className="text-slate-400 text-[11px] block">Flight / Airline</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{pkg.flight_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
              <Bus className="h-5 w-5 text-teal-600" />
              <div>
                <span className="text-slate-400 text-[11px] block">Shuttle Transport</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {pkg.shuttle_service ? "Included (Dedicated Bus)" : "Not Included (Walking / Taxi)"}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
              <span className="font-bold text-[11px] block mb-1">Enrollment Rule:</span>
              <p className="text-[11px]">
                Enrolled travelers will have base rates frozen at time of booking. Single active package constraint is enforced automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Passenger Roster */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Enrolled Traveler Roster</CardTitle>
              <CardDescription>
                {rosterData?.roster ? `${rosterData.roster.length} pilgrim(s) enrolled` : "Loading roster..."}
              </CardDescription>
            </div>
            <Link href={`/enrollments/new?package_id=${pkg.id}`}>
              <Button size="sm" variant="brand">
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Add Traveler to Roster
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rosterLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : rosterData && rosterData.roster.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No travelers enrolled yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Seats available: {pkg.seats_available} of {pkg.capacity}.
              </p>
              <Link href={`/enrollments/new?package_id=${pkg.id}`} className="mt-3">
                <Button size="sm" variant="brand">
                  Enroll First Pilgrim
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/50">
                  <tr>
                    <th className="py-2.5 px-4">Dossier #</th>
                    <th className="py-2.5 px-4">Traveler Name</th>
                    <th className="py-2.5 px-4">CNIC</th>
                    <th className="py-2.5 px-4">Age Tier</th>
                    <th className="py-2.5 px-4">Agreed Total</th>
                    <th className="py-2.5 px-4">Paid</th>
                    <th className="py-2.5 px-4">Balance</th>
                    <th className="py-2.5 px-4">Payment Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rosterData?.roster.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-medium">{enr.enrollment_number}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        <Link href={`/travelers/${enr.traveler_id}`} className="hover:underline">
                          {enr.traveler_name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {enr.traveler_cnic}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {enr.traveler_age_category}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        PKR {Number(enr.final_agreed_price).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-emerald-600 font-semibold">
                        PKR {Number(enr.total_paid).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-amber-600 font-semibold">
                        PKR {Number(enr.remaining_balance).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={
                            enr.payment_status === "PAID"
                              ? "success"
                              : enr.payment_status === "PARTIAL"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {enr.payment_status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1">
                        <Link href={`/finance/invoice/${enr.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                            <Receipt className="h-3 w-3 mr-1" />
                            Invoice
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
