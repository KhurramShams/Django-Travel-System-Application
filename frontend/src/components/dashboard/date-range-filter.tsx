"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, RotateCcw, Filter, Check } from "lucide-react";

export type DatePreset = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";

interface DateRangeFilterProps {
  onDateChange: (range: { startDate?: string; endDate?: string; preset: DatePreset }) => void;
  isLoading?: boolean;
}

export function DateRangeFilter({ onDateChange, isLoading }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<DatePreset>("ALL");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSelectPreset = (preset: DatePreset) => {
    setActivePreset(preset);
    const now = new Date();
    const todayStr = getLocalDateString(now);

    if (preset === "ALL") {
      setCustomStart("");
      setCustomEnd("");
      onDateChange({ startDate: undefined, endDate: undefined, preset: "ALL" });
    } else if (preset === "TODAY") {
      setCustomStart(todayStr);
      setCustomEnd(todayStr);
      onDateChange({ startDate: todayStr, endDate: todayStr, preset: "TODAY" });
    } else if (preset === "THIS_WEEK") {
      const d = new Date(now);
      const dayOfWeek = d.getDay();
      const diffToMonday = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diffToMonday));
      const mondayStr = getLocalDateString(monday);

      setCustomStart(mondayStr);
      setCustomEnd(todayStr);
      onDateChange({ startDate: mondayStr, endDate: todayStr, preset: "THIS_WEEK" });
    } else if (preset === "THIS_MONTH") {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStartStr = getLocalDateString(firstOfMonth);

      setCustomStart(monthStartStr);
      setCustomEnd(todayStr);
      onDateChange({ startDate: monthStartStr, endDate: todayStr, preset: "THIS_MONTH" });
    } else if (preset === "CUSTOM") {
      if (customStart || customEnd) {
        onDateChange({
          startDate: customStart || undefined,
          endDate: customEnd || undefined,
          preset: "CUSTOM",
        });
      }
    }
  };

  const handleApplyCustom = () => {
    setActivePreset("CUSTOM");
    onDateChange({
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
      preset: "CUSTOM",
    });
  };

  const handleReset = () => {
    handleSelectPreset("ALL");
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
          <span>Period:</span>
        </span>

        <button
          onClick={() => handleSelectPreset("ALL")}
          disabled={isLoading}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            activePreset === "ALL"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          All Time
        </button>

        <button
          onClick={() => handleSelectPreset("TODAY")}
          disabled={isLoading}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            activePreset === "TODAY"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Today
        </button>

        <button
          onClick={() => handleSelectPreset("THIS_WEEK")}
          disabled={isLoading}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            activePreset === "THIS_WEEK"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          This Week
        </button>

        <button
          onClick={() => handleSelectPreset("THIS_MONTH")}
          disabled={isLoading}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
            activePreset === "THIS_MONTH"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          This Month
        </button>
      </div>

      {/* Custom Date Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => {
              setCustomStart(e.target.value);
              setActivePreset("CUSTOM");
            }}
            placeholder="Start Date"
            className="h-8 text-xs w-32 px-2"
          />
          <span className="text-xs text-slate-400">to</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => {
              setCustomEnd(e.target.value);
              setActivePreset("CUSTOM");
            }}
            placeholder="End Date"
            className="h-8 text-xs w-32 px-2"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyCustom}
          disabled={isLoading || (!customStart && !customEnd)}
          className="h-8 text-xs gap-1"
        >
          <Check className="h-3.5 w-3.5" />
          Apply
        </Button>

        {activePreset !== "ALL" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
            className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            title="Reset to All Time"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
