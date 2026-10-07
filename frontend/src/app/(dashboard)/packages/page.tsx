"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { packagesApi } from "@/lib/api/travel";
import { TravelPackage } from "@/types/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  PlusCircle,
  Search,
  Calendar,
  Plane,
  Star,
  Bus,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  Edit3,
  Trash2,
} from "lucide-react";
import { DeletePackageDialog } from "@/components/packages/delete-package-dialog";

export default function PackagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [selectedPackageForDelete, setSelectedPackageForDelete] = useState<TravelPackage | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: rawPackages, isLoading, error } = useQuery({
    queryKey: ["packages", searchTerm, statusFilter, locationFilter],
    queryFn: () =>
      packagesApi.list({
        search: searchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        location: locationFilter !== "ALL" ? locationFilter : undefined,
      }),
  });

  const packages: TravelPackage[] = Array.isArray(rawPackages) ? rawPackages : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <Package className="h-3.5 w-3.5" />
              Tour Catalog
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Travel Packages & Groups
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define Hajj, Umrah, and Ziyarat packages with tiered pricing, hotel classifications, and passenger quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/packages/new">
            <Button variant="brand" className="font-semibold shadow-xs">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Package
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search packages by title, code, flight carrier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                {["ALL", "ACTIVE", "DRAFT", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      statusFilter === st
                        ? "bg-white text-emerald-800 shadow-xs dark:bg-slate-800 dark:text-emerald-400 font-semibold"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-sm">Loading package inventory...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-8 text-sm text-red-600 gap-2">
          <AlertCircle className="h-5 w-5" />
          Failed to load packages. Please check connection.
        </div>
      ) : packages && packages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Package className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No travel packages configured</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Create your first Umrah or Hajj package to start enrolling pilgrims.
            </p>
            <Link href="/packages/new" className="mt-4">
              <Button size="sm" variant="brand">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Create First Package
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages?.map((pkg: TravelPackage) => (
            <Card
              key={pkg.id}
              className="flex flex-col justify-between overflow-hidden transition-all hover:shadow-md border-slate-200 dark:border-slate-800"
            >
              <div>
                {/* Card Top Banner */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 dark:bg-slate-900/40 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {pkg.package_code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mt-0.5">
                      {pkg.title}
                    </h3>
                  </div>
                  <Badge
                    variant={pkg.status === "ACTIVE" ? "success" : "outline"}
                    className="text-[10px]"
                  >
                    {pkg.status}
                  </Badge>
                </div>

                {/* Details Section */}
                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Itinerary Dates */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {pkg.departure_date} &rarr; {pkg.return_date}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {pkg.duration_days} Days
                    </span>
                  </div>

                  {/* Flight & Transport */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <Plane className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{pkg.flight_name}</span>
                    </span>
                    {pkg.shuttle_service && (
                      <span className="flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-medium dark:bg-teal-950 dark:text-teal-300">
                        <Bus className="h-3 w-3" />
                        Shuttle
                      </span>
                    )}
                  </div>

                  {/* Quota Progress */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Seat Quota:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {pkg.total_enrolled} / {pkg.capacity} ({pkg.seats_available} Left)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (pkg.total_enrolled / (pkg.capacity || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Pricing Tiers */}
                  <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Tier Base Rates:
                    </span>
                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Adult</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {Number(pkg.adult_price).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Child</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {Number(pkg.child_price).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Infant</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {Number(pkg.infant_price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Card Footer */}
              <div className="border-t border-slate-100 p-3 bg-white dark:bg-slate-950 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link href={`/enrollments/new?package_id=${pkg.id}`}>
                  <Button size="sm" variant="brand" className="h-8 text-xs">
                    Enroll Pilgrim
                  </Button>
                </Link>

                <div className="flex items-center gap-1">
                  <Link href={`/packages/${pkg.id}/edit`}>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Edit Package">
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Delete Package"
                    onClick={() => {
                      setSelectedPackageForDelete(pkg);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  <Link href={`/packages/${pkg.id}`}>
                    <Button size="sm" variant="ghost" className="h-8 text-xs">
                      Details
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Package Dialog */}
      <DeletePackageDialog
        pkg={selectedPackageForDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedPackageForDelete(null);
        }}
      />
    </div>
  );
}
