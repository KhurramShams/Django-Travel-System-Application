"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi, paymentsApi } from "@/lib/api/travel";
import { PackageEnrollment, TravelerPayment } from "@/types/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  PlusCircle,
  Receipt,
  Search,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  FileText,
  User,
} from "lucide-react";

export default function TravelerFinancePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<PackageEnrollment | null>(null);

  // Form states for payment
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Queries
  const { data: rawEnrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["finance-enrollments", searchTerm],
    queryFn: () => enrollmentsApi.list({ search: searchTerm || undefined }),
  });

  const enrollments: PackageEnrollment[] = Array.isArray(rawEnrollments) ? rawEnrollments : [];

  const { data: remainingSummary } = useQuery({
    queryKey: ["remaining-balances-summary"],
    queryFn: () => paymentsApi.getRemainingBalances(),
  });

  const { data: settledSummary } = useQuery({
    queryKey: ["settled-balances-summary"],
    queryFn: () => paymentsApi.getSettledBalances(),
  });

  // Mutation for recording payment
  const recordMutation = useMutation({
    mutationFn: (data: {
      enrollment: string;
      amount: number;
      payment_method: string;
      payment_date: string;
      reference_number?: string;
      notes?: string;
    }) => paymentsApi.record(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["remaining-balances-summary"] });
      queryClient.invalidateQueries({ queryKey: ["settled-balances-summary"] });
      closePaymentModal();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.amount?.[0] ||
        "Failed to record payment. Please check details.";
      setModalError(msg);
    },
  });

  const openPaymentModal = (enr: PackageEnrollment) => {
    setSelectedEnrollment(enr);
    setPaymentAmount(enr.remaining_balance);
    setModalError(null);
    setIsRecordModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsRecordModalOpen(false);
    setSelectedEnrollment(null);
    setPaymentAmount("");
    setReferenceNumber("");
    setPaymentNotes("");
    setModalError(null);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    const numAmount = Number(paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalError("Please specify a valid payment amount greater than zero.");
      return;
    }

    recordMutation.mutate({
      enrollment: selectedEnrollment.id,
      amount: numAmount,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      reference_number: referenceNumber || undefined,
      notes: paymentNotes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
              Financial Ledgers & Collections
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Traveler Financial Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track individual enrollment receivables, collection receipts, and audit trail of transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/finance/travelers/balances">
            <Button variant="outline" className="text-xs font-semibold">
              <AlertCircle className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
              Remaining Balance List
            </Button>
          </Link>
          <Link href="/finance/travelers/settled">
            <Button variant="outline" className="text-xs font-semibold">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Settled Clients List
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-amber-200/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Total Outstanding Receivables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200">
              PKR {Number(remainingSummary?.total_outstanding_amount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Pending collections across {remainingSummary?.count || 0} active client dossiers
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Total Settled Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
              PKR {Number(settledSummary?.total_settled_revenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              From {settledSummary?.count || 0} fully settled pilgrimage accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Enrollment Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {enrollments ? enrollments.length : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Managed contracts requiring ledger reconciliation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search ledgers by traveler name, CNIC, dossier number, or package code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <CardTitle className="text-base font-semibold">Traveler Payment Ledger</CardTitle>
          <CardDescription>
            Live balance calculation: Remaining Balance = Agreed Total - Total Paid
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {enrollmentsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : enrollments && enrollments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No enrollment contracts found matching query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/50">
                  <tr>
                    <th className="py-2.5 px-4">Dossier</th>
                    <th className="py-2.5 px-4">Traveler / CNIC</th>
                    <th className="py-2.5 px-4">Tour Package</th>
                    <th className="py-2.5 px-4">Agreed Total</th>
                    <th className="py-2.5 px-4">Total Paid</th>
                    <th className="py-2.5 px-4">Remaining Balance</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {enrollments?.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-medium text-emerald-800 dark:text-emerald-400">
                        {enr.enrollment_number}
                      </td>
                      <td className="py-2.5 px-4">
                        <Link href={`/travelers/${enr.traveler_id}`} className="font-semibold hover:underline">
                          {enr.traveler_name}
                        </Link>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {enr.traveler_cnic}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {enr.package_title}
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
                        {Number(enr.remaining_balance) > 0 && (
                          <Button
                            size="sm"
                            variant="brand"
                            className="h-7 text-xs px-2"
                            onClick={() => openPaymentModal(enr)}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Record Payment
                          </Button>
                        )}
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

      {/* Record Payment Modal */}
      {isRecordModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border dark:bg-slate-950 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b dark:bg-slate-900 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Record Client Payment Receipt
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Dossier: {selectedEnrollment.enrollment_number} • {selectedEnrollment.traveler_name}
                </p>
              </div>
              <button
                onClick={closePaymentModal}
                className="text-slate-400 hover:text-slate-600 rounded-md p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-4 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-50 text-red-700 text-xs border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Agreed Total</span>
                  <span className="text-xs font-semibold">
                    PKR {Number(selectedEnrollment.final_agreed_price).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Paid So Far</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    PKR {Number(selectedEnrollment.total_paid).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Remaining Due</span>
                  <span className="text-xs font-bold text-amber-600">
                    PKR {Number(selectedEnrollment.remaining_balance).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount to Collect (PKR) *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="font-mono text-base font-bold text-emerald-700"
                  required
                />
              </div>

              {/* Method & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment Instrument *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="CASH">Cash in Office</option>
                    <option value="BANK_TRANSFER">Online Transfer / IBFT</option>
                    <option value="CHEQUE">Bank Cheque / Pay Order</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Transaction Date *
                  </label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Bank Reference / Cheque # / Deposit Slip (Optional)
                </label>
                <Input
                  placeholder="e.g. HBL-IBFT-987654321"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Narration
                </label>
                <Input
                  placeholder="e.g. 1st installment cash received at counter"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={closePaymentModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  isLoading={recordMutation.isPending}
                >
                  Generate Official Receipt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
