"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Search,
  Receipt,
  Phone,
  Plane,
  Loader2,
  Calendar,
} from "lucide-react";

export default function RemainingBalancesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: report, isLoading, error } = useQuery({
    queryKey: ["remaining-balances-report"],
    queryFn: () => paymentsApi.getRemainingBalances(),
  });

  const resultsList = Array.isArray(report?.results) ? report.results : [];
  const filteredResults = resultsList.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.traveler_name.toLowerCase().includes(term) ||
      item.traveler_cnic.includes(term) ||
      item.enrollment_number.toLowerCase().includes(term) ||
      item.package_title.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/finance/travelers"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Financial Center
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full dark:bg-amber-950 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Outstanding Receivables
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Remaining Balances Report
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit list of all enrolled travelers with pending or partial payment balances.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            Total Outstanding Receivables
          </span>
          <span className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200">
            PKR {Number(report?.total_outstanding_amount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Filter by client name, CNIC, phone, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">Clients with Pending Dues</CardTitle>
          <CardDescription>
            {filteredResults ? `${filteredResults.length} traveler(s) with open balances` : "Loading balances..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-600">
              Failed to load remaining balances report.
            </div>
          ) : filteredResults && filteredResults.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No outstanding client balances found. All enrolled passengers are fully settled.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/50">
                  <tr>
                    <th className="py-2.5 px-4">Dossier</th>
                    <th className="py-2.5 px-4">Traveler Name</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Package</th>
                    <th className="py-2.5 px-4">Agreed Total</th>
                    <th className="py-2.5 px-4">Paid So Far</th>
                    <th className="py-2.5 px-4">Outstanding Balance</th>
                    <th className="py-2.5 px-4">Payment Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredResults?.map((item) => (
                    <tr key={item.enrollment_id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-medium text-emerald-800 dark:text-emerald-400">
                        {item.enrollment_number}
                      </td>
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/travelers/${item.traveler_id}`}
                          className="font-semibold text-slate-900 hover:underline dark:text-slate-100"
                        >
                          {item.traveler_name}
                        </Link>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {item.traveler_cnic}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{item.traveler_phone}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {item.package_title}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        PKR {Number(item.final_agreed_price).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-emerald-600 font-semibold">
                        PKR {Number(item.total_paid).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-amber-700 font-bold dark:text-amber-400">
                        PKR {Number(item.remaining_balance).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={item.payment_status === "PARTIAL" ? "warning" : "destructive"}
                          className="text-[10px]"
                        >
                          {item.payment_status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1">
                        <Link href={`/finance/invoice/${item.enrollment_id}`}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
