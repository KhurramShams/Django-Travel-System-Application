"use client";

import React from "react";
import { AGENCY_CONFIG } from "@/lib/config/agency";
import { KHAS_LOGO_BASE64 } from "@/assets/logo-data";

export interface PDFHeaderProps {
  /** Title of the document, e.g., "OFFICIAL CLIENT INVOICE" or "HOTEL VOUCHER" */
  docTitle?: string;
  /** Subtitle or reference code, e.g., "INV-10042" */
  docNumber?: string;
  /** Issue date or generation date */
  issueDate?: string;
  /** Custom document tagline */
  tagline?: string;
  /** Optional custom right-hand side elements (status badges, etc.) */
  rightContent?: React.ReactNode;
  /** Additional custom class names for the container */
  className?: string;
}

export function PDFHeader({
  docTitle,
  docNumber,
  issueDate,
  tagline = "Enterprise Hajj, Umrah & Tourism Management System",
  rightContent,
  className = "",
}: PDFHeaderProps) {
  return (
    <header className={`border-b-2 border-emerald-700 pb-6 mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Side: Brand Identity & Agency Information */}
        <div className="flex items-start gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1 border border-slate-200 shadow-xs print:border-slate-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={KHAS_LOGO_BASE64}
              alt={AGENCY_CONFIG.name}
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {AGENCY_CONFIG.name}
            </h1>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5">
              {tagline}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-md font-medium">
              <span>{AGENCY_CONFIG.address}</span>
              <span className="mx-1.5">•</span>
              <span>Tel: {AGENCY_CONFIG.phone}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Document Identification */}
        {(docTitle || docNumber || issueDate || rightContent) && (
          <div className="text-left sm:text-right shrink-0">
            {docTitle && (
              <span className="inline-block rounded-md bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-900 border border-emerald-300 uppercase tracking-wider dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                {docTitle}
              </span>
            )}
            {docNumber && (
              <p className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1.5">
                {docNumber}
              </p>
            )}
            {issueDate && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Date: <span className="font-medium text-slate-800 dark:text-slate-200">{issueDate}</span>
              </p>
            )}
            {rightContent && <div className="mt-2 flex justify-start sm:justify-end">{rightContent}</div>}
          </div>
        )}
      </div>
    </header>
  );
}
