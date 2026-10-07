"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { hotelsApi } from "@/lib/api/hotels";
import { HotelStatsCards } from "@/components/hotels/hotel-stats-cards";
import { HotelTable } from "@/components/hotels/hotel-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  LayoutGrid,
} from "lucide-react";

export default function HotelDirectoryPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "REMAINING" | "PAID">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["hotel-summary"],
    queryFn: () => hotelsApi.getSummary(),
  });

  const {
    data: bookings = [],
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
    refetch,
  } = useQuery({
    queryKey: ["hotels", activeTab, searchTerm, locationFilter],
    queryFn: () =>
      hotelsApi.list({
        status: activeTab !== "ALL" ? activeTab : undefined,
        location: locationFilter !== "ALL" ? locationFilter : undefined,
        search: searchTerm || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <Building2 className="h-3.5 w-3.5" />
              Accommodations & Lodging
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Hotel Bookings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage property contracts, room allocations, and incremental payment settlements across Makkah and Madinah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/hotels/book">
            <Button variant="brand" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Book Hotel
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <HotelStatsCards summary={summary} isLoading={isSummaryLoading} />

      {/* Filter and Tab Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab("REMAINING")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "REMAINING"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Remaining Hotel List
          </button>
          <button
            onClick={() => setActiveTab("PAID")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "PAID"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Hotel Paid List
          </button>
        </div>

        {/* Search & Location Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search hotel or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9 w-full sm:w-36 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="ALL">All Cities</option>
              <option value="MAKKAH">Makkah</option>
              <option value="MADINAH">Madinah</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <HotelTable
        bookings={bookings}
        isLoading={isBookingsLoading}
        isFetching={isBookingsFetching}
        onRefresh={() => refetch()}
      />
    </div>
  );
}
