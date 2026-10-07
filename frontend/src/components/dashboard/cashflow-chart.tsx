"use client";

import React, { useState } from "react";
import { MonthlyCashflowItem } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowDownLeft, ArrowUpRight, BarChart3 } from "lucide-react";

interface CashflowChartProps {
  data: MonthlyCashflowItem[];
  isLoading: boolean;
}

export function CashflowChart({ data, isLoading }: CashflowChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            Revenue vs. Operational Outflow Trend
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Monthly cash inflow compared against expenditures
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-64 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  // Find max value across all months for proportional scaling
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.inflow, d.outflow)),
    100000
  );

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
      <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            Monthly Cashflow Overview
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Collected revenue vs. operational payments over the past 6 months
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
            Inflow
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-xs bg-rose-500" />
            Outflow
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-6">
        {data.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-slate-400">
            No historical cashflow records found.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-52 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
              {data.map((item, idx) => {
                const inflowHeight = Math.max(4, Math.round((item.inflow / maxVal) * 100));
                const outflowHeight = Math.max(4, Math.round((item.outflow / maxVal) * 100));
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in duration-150">
                        <p className="font-bold text-slate-200">{item.label}</p>
                        <p className="text-emerald-400">
                          In: PKR {item.inflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-rose-400">
                          Out: PKR {item.outflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-blue-300 border-t border-slate-700 mt-0.5 pt-0.5">
                          Net: PKR {item.net_margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    )}

                    {/* Bars container */}
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Inflow bar */}
                      <div
                        style={{ height: `${inflowHeight}%` }}
                        className="w-1/2 max-w-[20px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                      />
                      {/* Outflow bar */}
                      <div
                        style={{ height: `${outflowHeight}%` }}
                        className="w-1/2 max-w-[20px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between items-center px-1 text-[11px] font-medium text-slate-500">
              {data.map((item) => (
                <span key={item.month} className="flex-1 text-center truncate">
                  {item.label.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
