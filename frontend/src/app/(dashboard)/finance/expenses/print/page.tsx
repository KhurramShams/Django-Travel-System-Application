"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { officeExpensesApi } from "@/lib/api/finance";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Calendar, FileText, Loader2 } from "lucide-react";

function ExpensePrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date().toISOString().split("T")[0];
  const date = searchParams.get("date") || today;

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["expense-report", date],
    queryFn: () => officeExpensesApi.report(date),
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-8 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm">Generating Daily Expense Sheet for {date}...</p>
      </div>
    );
  }

  const expenses = reportData?.expenses || [];
  const totalAmount = Number(reportData?.total_amount || 0);
  const totalItems = reportData?.total_items || 0;

  // Compute category totals
  const categoryMap = new Map<string, number>();
  expenses.forEach((e) => {
    const prev = categoryMap.get(e.category) || 0;
    categoryMap.set(e.category, prev + Number(e.amount || 0));
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 print:p-0 print:bg-white text-slate-900">
      {/* Print Control Toolbar (Hidden in Print) */}
      <div className="mx-auto max-w-4xl mb-6 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/finance/expenses")}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Expenses
          </Button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Date: {date}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Official Printable Statement Sheet */}
      <div className="mx-auto max-w-4xl bg-white p-8 sm:p-12 shadow-md print:shadow-none print:p-0 print:border-none border border-slate-200 rounded-lg">
        {/* Header Letterhead */}
        <div className="border-b-2 border-emerald-700 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                KARWAN-E-ASOTVI TRAVELS & TOURS
              </h1>
              <p className="text-xs text-slate-600 font-medium tracking-wide uppercase mt-0.5">
                Government Licensed Hajj & Umrah Travel System
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Head Office: Main Commercial Plaza, Faisalabad Road, Pakistan
              </p>
              <p className="text-[11px] text-slate-500">
                Contact: +92 (300) 123-4567 | accounts@karwaneasotvi.com
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-bold uppercase tracking-wider">
                Official Expense Sheet
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-2">
                Expense Date: <span className="font-bold">{date}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Overview Box */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-md p-4 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Recorded Disbursements
            </span>
            <p className="text-xl font-black text-rose-700 mt-0.5">
              PKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Vouchers
            </span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {totalItems} Item{totalItems === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Itemized Vouchers Table */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Itemized Expense Register
          </h2>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">Sr #</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Voucher Reference</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Item / Purpose</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Spender</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Category</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Mode</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    No operational expenses recorded for this date.
                  </td>
                </tr>
              ) : (
                expenses.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-medium text-slate-800">
                      {item.expense_reference}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                      {item.item_name}
                      {item.notes && (
                        <span className="block text-[10px] text-slate-400 italic">
                          {item.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                      {item.person_name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                      {item.category.replace("_", " ")}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-[11px] text-slate-600">
                      {item.payment_mode.replace("_", " ")}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-400 font-bold">
                <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs">
                  Grand Total for {date}:
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm text-rose-700">
                  PKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Category Breakdown Table */}
        {categoryMap.size > 0 && (
          <div className="mb-12">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Summary By Department / Category
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from(categoryMap.entries()).map(([cat, amt]) => (
                <div
                  key={cat}
                  className="p-2 border border-slate-200 rounded bg-slate-50/50 text-xs flex justify-between items-center"
                >
                  <span className="text-slate-600 font-medium">{cat.replace("_", " ")}:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    PKR {amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature & Verification Block */}
        <div className="mt-16 pt-8 border-t border-slate-300">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="h-14 border-b border-dashed border-slate-400"></div>
              <p className="mt-2 text-xs font-bold text-slate-800">Prepared By</p>
              <p className="text-[10px] text-slate-500">Cashier / Office Incharge</p>
            </div>
            <div>
              <div className="h-14 border-b border-dashed border-slate-400"></div>
              <p className="mt-2 text-xs font-bold text-slate-800">Checked By</p>
              <p className="text-[10px] text-slate-500">Accounts Manager</p>
            </div>
            <div>
              <div className="h-14 border-b border-dashed border-slate-400"></div>
              <p className="mt-2 text-xs font-bold text-slate-800">Authorized Signature</p>
              <p className="text-[10px] text-slate-500">Managing Director / Partner</p>
            </div>
          </div>
        </div>

        {/* Print Footer Notice */}
        <div className="mt-8 text-center text-[10px] text-slate-400 print:block">
          This document is generated by Karwan-e-Asotvi ERP. Any alterations render this voucher void.
        </div>
      </div>
    </div>
  );
}

export default function ExpensePrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ExpensePrintContent />
    </Suspense>
  );
}
