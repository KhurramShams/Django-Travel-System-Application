"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { bankAccountsApi } from "@/lib/api/finance";
import { BankAccount } from "@/types/finance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Landmark,
  PlusCircle,
  Edit3,
  CreditCard,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Building,
  CheckCircle2,
} from "lucide-react";
import { BankAccountModal } from "@/components/finance/bank-account-modal";

export default function BankAccountsPage() {
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: accounts = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountsApi.list(),
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);
  const activeCount = accounts.filter((acc) => acc.is_active).length;

  const handleOpenNew = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setSelectedAccount(acc);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Corporate Bank Accounts
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Module 5
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Maintain institutional bank accounts, account titles, and real-time ledger liquidity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
            title="Refresh accounts"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="brand"
            onClick={handleOpenNew}
            className="gap-1.5 text-xs font-medium shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Total Operating Liquidity
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                PKR {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Combined real-time balances</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Active Bank Accounts
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {activeCount}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Approved operational accounts</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Landmark className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Ledger Direct Action
              </p>
              <div className="mt-2">
                <Link href="/finance/payments/new">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                    <PlusCircle className="h-3 w-3" />
                    Record Transaction
                  </Button>
                </Link>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-xs">Loading corporate bank accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Landmark className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No bank accounts configured yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Add your company bank accounts (e.g. Meezan Bank, HBL, UBL) to track balances and office payments.
          </p>
          <Button size="sm" variant="brand" onClick={handleOpenNew} className="mt-4 gap-1.5 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Add First Bank Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const balanceNum = Number(acc.current_balance || 0);
            return (
              <Card
                key={acc.id}
                className="border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                          {acc.bank_name}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                          {acc.account_name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={acc.is_active ? "success" : "default"}
                      className="text-[10px] uppercase font-bold"
                    >
                      {acc.is_active ? "Active" : "Archived"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 flex-1">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Account Number
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-wide">
                      {acc.account_number}
                    </p>
                    {acc.branch_code && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Branch Code: <span className="font-mono">{acc.branch_code}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Current Ledger Balance
                    </span>
                    <p
                      className={`text-xl font-black mt-0.5 ${
                        balanceNum >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      PKR {balanceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(acc)}
                    className="h-8 text-xs gap-1.5 text-slate-600 dark:text-slate-300"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit Details
                  </Button>

                  <Link href={`/finance/payments?bank=${acc.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                    >
                      <span>Ledger</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <BankAccountModal
        account={selectedAccount}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccount(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
