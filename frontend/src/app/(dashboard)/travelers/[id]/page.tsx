"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { travelersApi } from "@/lib/api/travel";
import { Traveler } from "@/types/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ArrowLeft,
  Phone,
  CreditCard,
  Plane,
  Receipt,
  Clock,
  Shield,
  FileText,
  UserPlus,
  Loader2,
  Calendar,
  Building,
  CheckCircle2,
} from "lucide-react";

export default function TravelerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: traveler, isLoading, error } = useQuery({
    queryKey: ["traveler", id],
    queryFn: () => travelersApi.get(id),
  });

  const { data: history } = useQuery({
    queryKey: ["traveler-history", id],
    queryFn: () => travelersApi.history(id),
  });

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Loading client dossier...</p>
      </div>
    );
  }

  if (error || !traveler) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-semibold">Traveler record not found.</p>
        <Link href="/travelers" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/travelers"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Travelers
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {traveler.full_name}
            </h1>
            <Badge variant="brand">{traveler.age_category}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            CNIC / B-Form: <span className="font-semibold">{traveler.cnic}</span>
            {traveler.passport_number && ` • Passport: ${traveler.passport_number}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!traveler.has_active_package ? (
            <Link href={`/enrollments/new?traveler_id=${traveler.id}`}>
              <Button variant="brand" className="font-semibold shadow-xs">
                <Plane className="mr-2 h-4 w-4" />
                Enroll in Package
              </Button>
            </Link>
          ) : (
            <Link href={`/finance/invoice/${traveler.active_enrollment_id}`}>
              <Button variant="outline" className="font-semibold shadow-xs">
                <FileText className="mr-2 h-4 w-4" />
                View Invoice Voucher
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Profile Info & Active Tour */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Dossier */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Personal & Contact Dossier</CardTitle>
            <CardDescription>Verified identification and logistics records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-slate-400">Phone / WhatsApp</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {traveler.phone_number}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Emergency Family Contact</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {traveler.emergency_contact || "Not provided"}
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400">Residential Address</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {traveler.address || "Not recorded"}
                </p>
              </div>

              {traveler.notes && (
                <div className="space-y-1 sm:col-span-2 rounded-lg bg-amber-50 p-3 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200">
                  <span className="font-bold text-[11px] uppercase tracking-wide block">
                    Operational & Special Assistance Notes:
                  </span>
                  <p className="text-xs">{traveler.notes}</p>
                </div>
              )}
            </div>

            {/* Family & Guardian Unit */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Family & Guardianship Hierarchy
              </h4>

              {traveler.guardian_details ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Primary Head / Guardian:</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {traveler.guardian_details.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      CNIC: {traveler.guardian_details.cnic} • Contact: {traveler.guardian_details.phone_number}
                    </p>
                  </div>
                  <Link href={`/travelers/${traveler.guardian}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View Guardian &rarr;
                    </Button>
                  </Link>
                </div>
              ) : traveler.dependents && traveler.dependents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-2">
                    Registered Dependents under this Traveler ({traveler.dependents.length}):
                  </p>
                  <div className="divide-y border rounded-lg dark:border-slate-800">
                    {traveler.dependents.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-900"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {dep.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            CNIC: {dep.cnic}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {dep.age_category}
                          </Badge>
                          <Link href={`/travelers/${dep.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                              Dossier
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No linked family members or dependents attached to this client.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Active Tour Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plane className="h-4 w-4 text-emerald-600" />
                Active Tour
              </CardTitle>
              <Badge
                variant={traveler.has_active_package ? "success" : "outline"}
                className="text-[10px]"
              >
                {traveler.has_active_package ? "Enrolled" : "Available"}
              </Badge>
            </div>
            <CardDescription>Current pilgrimage contract status</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {traveler.has_active_package ? (
              <div className="rounded-lg bg-emerald-50/70 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Booked Itinerary
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {traveler.active_package_title}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-emerald-200/60 dark:border-emerald-800">
                  <span className="text-slate-600 dark:text-slate-400">Single Active Rule:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Locked (1 Active Tour)
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed rounded-lg text-slate-400 space-y-2">
                <p className="text-xs">Traveler is not assigned to any ongoing departure.</p>
                <Link href={`/enrollments/new?traveler_id=${traveler.id}`}>
                  <Button size="sm" variant="brand" className="mt-2 text-xs">
                    Enroll in Package
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>

          <CardContent className="pt-0">
            <p className="text-[11px] text-slate-400">
              Per Karwan-e-Asotvi policy, each passenger can only hold 1 active tour contract at a time.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History Ledger */}
      {history && history.enrollments && history.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tour & Enrollment History</CardTitle>
            <CardDescription>Historical ledger of packages and payment settlement records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/50">
                  <tr>
                    <th className="py-2.5 px-4">Dossier Ref</th>
                    <th className="py-2.5 px-4">Package</th>
                    <th className="py-2.5 px-4">Enrolled Date</th>
                    <th className="py-2.5 px-4">Final Agreed Price</th>
                    <th className="py-2.5 px-4">Total Paid</th>
                    <th className="py-2.5 px-4">Remaining Balance</th>
                    <th className="py-2.5 px-4">Payment Status</th>
                    <th className="py-2.5 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.enrollments.map((enr: any) => (
                    <tr key={enr.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-medium">{enr.enrollment_number}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {enr.package_title}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{enr.enrolled_date}</td>
                      <td className="py-2.5 px-4 font-mono">PKR {Number(enr.final_agreed_price).toLocaleString()}</td>
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
                      <td className="py-2.5 px-4 text-right">
                        <Link href={`/finance/invoice/${enr.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
