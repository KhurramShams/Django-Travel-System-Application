"use client";

import React from "react";
import { AGENCY_CONFIG } from "@/lib/config/agency";

export interface PDFSignature {
  title: string;
  subtitle?: string;
  isStamp?: boolean;
}

export interface PDFFooterProps {
  /** Optional terms and conditions or policies snippet */
  terms?: React.ReactNode;
  /** Optional array of signatures to display */
  signatures?: PDFSignature[];
  /** Optional system note or disclaimers */
  note?: string;
  /** Custom generation date/time text */
  generatedAt?: string;
  /** Additional container classes */
  className?: string;
}

export function PDFFooter({
  terms,
  signatures,
  note,
  generatedAt,
  className = "",
}: PDFFooterProps) {
  const currentTimestamp =
    generatedAt ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <footer className={`mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 break-inside-avoid ${className}`}>
      {/* Optional Terms & Conditions */}
      {terms && <div className="mb-8">{terms}</div>}

      {/* Optional Signatures Grid */}
      {signatures && signatures.length > 0 && (
        <div
          className={`grid gap-6 text-center text-xs mb-8 ${
            signatures.length === 2
              ? "grid-cols-2"
              : signatures.length === 3
              ? "grid-cols-3"
              : "grid-cols-4"
          }`}
        >
          {signatures.map((sig, idx) =>
            sig.isStamp ? (
              <div
                key={idx}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center p-3 h-20"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {sig.title || "Official Seal & Stamp"}
                </span>
                {sig.subtitle && (
                  <span className="text-[9px] text-slate-400 mt-0.5">{sig.subtitle}</span>
                )}
              </div>
            ) : (
              <div key={idx}>
                <div className="h-14 border-b border-dashed border-slate-300 dark:border-slate-700 mb-2" />
                <p className="font-bold text-slate-800 dark:text-slate-200">{sig.title}</p>
                {sig.subtitle && (
                  <p className="text-[10px] text-slate-400">{sig.subtitle}</p>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Electronically Generated Note */}
      {note && (
        <p className="text-center text-[10px] text-slate-400 mb-3">
          {note}
        </p>
      )}

      {/* Bottom Unified Attribution Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-900 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {AGENCY_CONFIG.footerText}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-[10px] text-slate-400">
            Enterprise Travel ERP System
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
          <span>Generated: {currentTimestamp}</span>
        </div>
      </div>
    </footer>
  );
}
