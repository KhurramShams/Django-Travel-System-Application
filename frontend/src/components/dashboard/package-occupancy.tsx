"use client";

import React from "react";
import Link from "next/link";
import { PackageOccupancyItem } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Package, ArrowRight, Users } from "lucide-react";

interface PackageOccupancyProps {
  data: PackageOccupancyItem[];
  isLoading: boolean;
}

export function PackageOccupancyWidget({ data, isLoading }: PackageOccupancyProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" />
            Active Package Occupancy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-48 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" />
            Tour Package Occupancy
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Real-time passenger bookings vs. group capacity
          </CardDescription>
        </div>
        <Link
          href="/packages"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
        >
          <span>All Packages</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {data.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No active packages open for booking.</p>
        ) : (
          data.slice(0, 4).map((pkg) => (
            <div key={pkg.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                  {pkg.title}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {pkg.enrolled} / {pkg.capacity} seats ({pkg.occupancy_rate}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, pkg.occupancy_rate)}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    pkg.occupancy_rate >= 90
                      ? "bg-rose-500"
                      : pkg.occupancy_rate >= 60
                      ? "bg-emerald-500"
                      : "bg-blue-500"
                  }`}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
