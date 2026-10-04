"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api/travel";
import { PackageEnrollment } from "@/types/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  UserPlus,
  Search,
  Plane,
  Receipt,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function EnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: rawEnrollments, isLoading, error } = useQuery({
    queryKey: ["enrollments", searchTerm, statusFilter],
    queryFn: () =>
      enrollmentsApi.list({
        search: searchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const enrollments: PackageEnrollment[] = Array.isArray(rawEnrollments) ? rawEnrollments : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <FileText className="h-3.5 w-3.5" />
              Tour Bookings & Contracts
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Package Enrollments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Binding passenger contracts tying travelers to specific tour packages with locked rates and payment tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/enrollments/new">
            <Button variant="brand" className="font-semibold shadow-xs">
              <UserPlus className="mr-2 h-4 w-4" />
              Enroll Traveler in Package
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
                placeholder="Search by dossier number, traveler name, CNIC, or package title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((st) => (
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

      {/* Enrollments Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">Active Enrollment Contracts</CardTitle>
          <CardDescription>
            {enrollments ? `${enrollments.length} enrollment record(s) found` : "Loading enrollments..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-600">
              Failed to load enrollments. Please verify service.
            </div>
          ) : enrollments && enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No enrollments recorded</p>
              <p className="text-xs text-slate-500 mt-1">
                Link a traveler to an active package to generate their contract and ledger.
              </p>
              <Link href="/enrollments/new" className="mt-4">
                <Button size="sm" variant="brand">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Create First Enrollment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/50">
                  <tr>
                    <th className="py-3 px-4">Dossier / Ref</th>
                    <th className="py-3 px-4">Traveler</th>
                    <th className="py-3 px-4">Tour Package</th>
                    <th className="py-3 px-4">Enrolled Date</th>
                    <th className="py-3 px-4">Agreed Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {enrollments?.map((enr: PackageEnrollment) => (
                    <tr key={enr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-medium text-emerald-800 dark:text-emerald-400">
                        {enr.enrollment_number}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/travelers/${enr.traveler_id}`}
                          className="font-semibold text-slate-900 hover:underline dark:text-slate-100 block"
                        >
                          {enr.traveler_name}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">
                          {enr.traveler_cnic} • {enr.traveler_age_category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/packages/${enr.package_id}`}
                          className="text-slate-800 hover:underline dark:text-slate-200 line-clamp-1 font-medium"
                        >
                          {enr.package_title}
                        </Link>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          Dep: {enr.departure_date}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{enr.enrolled_date}</td>
                      <td className="py-3 px-4 font-mono font-medium">
                        PKR {Number(enr.final_agreed_price).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                        PKR {Number(enr.total_paid).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                        PKR {Number(enr.remaining_balance).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-right space-x-1">
                        <Link href={`/finance/invoice/${enr.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs px-2">
                            <Receipt className="h-3.5 w-3.5 mr-1" />
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
