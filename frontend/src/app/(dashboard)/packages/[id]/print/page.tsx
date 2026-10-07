"use client";

import React, { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { packagesApi } from "@/lib/api/travel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PDFHeader, PDFFooter } from "@/components/pdf";
import {
  Printer,
  ArrowLeft,
  Plane,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Loader2,
  Star,
  Users,
  Bus,
  Shield,
  Clock,
} from "lucide-react";

export default function PackagePrintDossierPage({
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

  const handlePrint = () => {
    window.print();
  };

  if (pkgLoading || rosterLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">Generating tour package PDF dossier...</p>
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

  const roster = rosterData?.roster || [];

  const totalContractRevenue = roster.reduce(
    (sum, enr) => sum + Number(enr.final_agreed_price || 0),
    0
  );
  const totalCollected = roster.reduce(
    (sum, enr) => sum + Number(enr.total_paid || 0),
    0
  );
  const totalReceivable = roster.reduce(
    (sum, enr) => sum + Number(enr.remaining_balance || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Non-Printable Action Bar */}
      <div className="print:hidden flex items-center justify-between">
        <Link
          href={`/packages/${id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Package Details
        </Link>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="brand" className="font-semibold shadow-xs">
            <Printer className="mr-2 h-4 w-4" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Printable Package Dossier Sheet */}
      <div className="mx-auto max-w-5xl bg-white p-8 sm:p-12 shadow-lg rounded-2xl border border-slate-200 text-slate-900 print:shadow-none print:border-none print:p-0 print:max-w-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100">
        {/* Unified Agency Header */}
        <PDFHeader
          docTitle="Official Package Dossier"
          docNumber={`REF: ${pkg.package_code}`}
          issueDate={new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
          tagline="Government Certified Hajj & Umrah Travel Services • License # 4289"
        />

        {/* Package Specifications Section */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                Tour Package Title
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {pkg.title}
              </h2>
              <p className="text-xs text-slate-500">
                Itinerary: <span className="font-semibold text-slate-700 dark:text-slate-300">{pkg.location.replace("_", " & ")}</span> • Hotel Tier: <span className="font-semibold text-slate-700 dark:text-slate-300">{pkg.star_rating.replace("_", " ")}</span>
              </p>
            </div>
            <div className="mt-3 sm:mt-0 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Flight Carrier</span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 font-mono">
                {pkg.flight_name}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 p-3 bg-white dark:bg-slate-900 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tour Schedule</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {pkg.departure_date} to {pkg.return_date}
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                {pkg.duration_days} Days Total
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white dark:bg-slate-900 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Seat Quota Capacity</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {pkg.total_enrolled} / {pkg.capacity} Enrolled
              </p>
              <span className="text-[10px] text-slate-500">
                {pkg.seats_available} seats remaining
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white dark:bg-slate-900 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Shuttle Service</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {pkg.shuttle_service ? "Included (24/7 Haramain)" : "Standard Walking / Taxi"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 bg-white dark:bg-slate-900 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Base Price Tiers</span>
              <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200 mt-0.5">
                Adult: PKR {Number(pkg.adult_price).toLocaleString()}
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                Child: PKR {Number(pkg.child_price).toLocaleString()} • Inf: PKR {Number(pkg.infant_price).toLocaleString()}
              </p>
            </div>
          </div>

          {pkg.description && (
            <div className="text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                Package Itinerary & Logistics Notes:
              </span>
              <p className="text-slate-600 dark:text-slate-400">{pkg.description}</p>
            </div>
          )}
        </div>

        {/* Enrolled Pilgrims Roster Table */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" />
              Complete Enrolled Traveler Roster ({roster.length} Pilgrims)
            </h3>
            <span className="text-xs text-slate-500">
              Verified Group Manifest
            </span>
          </div>

          {roster.length === 0 ? (
            <div className="text-center p-8 border rounded-lg text-xs text-slate-400">
              No pilgrims are currently enrolled in this package.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Dossier #</th>
                    <th className="py-2.5 px-3">Pilgrim Name</th>
                    <th className="py-2.5 px-3">CNIC / B-Form</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3">Passport #</th>
                    <th className="py-2.5 px-3 text-right">Agreed Fare</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {roster.map((enr, idx) => (
                    <tr key={enr.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-medium">{enr.enrollment_number}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {enr.traveler_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {enr.traveler_cnic}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                          {enr.traveler_age_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {enr.traveler_passport || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        PKR {Number(enr.final_agreed_price).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        PKR {Number(enr.total_paid).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                        PKR {Number(enr.remaining_balance).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            enr.payment_status === "PAID"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : enr.payment_status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {enr.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Financial Summary Box */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 break-inside-avoid">
          <div className="space-y-1 mb-3 sm:mb-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Package Financial Performance
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Total Pilgrim Contracts: {roster.length} | Cleared: {roster.filter((r) => r.payment_status === "PAID").length}
            </p>
          </div>

          <div className="flex gap-6 font-mono text-right text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Total Volume</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                PKR {totalContractRevenue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Total Recovered</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                PKR {totalCollected.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Remaining Due</span>
              <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">
                PKR {totalReceivable.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Unified Agency Footer & Signatures */}
        <PDFFooter
          signatures={[
            { title: "Prepared By", subtitle: "Operations Officer" },
            { title: "Tour Manager", subtitle: "Khas Travels" },
            { title: "Official Stamp", subtitle: "Director of Operations", isStamp: true },
          ]}
          note="This is an official group travel package dossier. All itineraries and schedules are subject to visa clearance and flight availability."
        />
      </div>
    </div>
  );
}
