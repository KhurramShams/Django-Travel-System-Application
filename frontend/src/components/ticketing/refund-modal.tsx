"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refundsApi } from "@/lib/api/ticketing";
import { AgencyTicket, RefundMethod } from "@/types/ticketing";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  AlertCircle,
  X,
  Loader2,
  DollarSign,
  Ticket,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface RefundModalProps {
  ticket: AgencyTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RefundProcessingModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: RefundModalProps) {
  const queryClient = useQueryClient();

  const [refundSeats, setRefundSeats] = useState<number>(1);
  const [originalAmount, setOriginalAmount] = useState<string>("");
  const [penaltyFee, setPenaltyFee] = useState<string>("0");
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("CASH");
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form when ticket opens
  useEffect(() => {
    if (ticket) {
      const seats = Math.min(1, ticket.available_seats_to_refund);
      setRefundSeats(seats);
      const perSeat = Number(ticket.per_seat_cost) || 0;
      setOriginalAmount(String(perSeat * seats));
      setPenaltyFee("0");
      setRefundMethod("CASH");
      setReason("");
      setErrorMsg(null);
    }
  }, [ticket, isOpen]);

  const mutation = useMutation({
    mutationFn: refundsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["ticketing-kpi"] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg =
        data?.error?.message ||
        data?.detail ||
        data?.penalty_fee?.[0] ||
        data?.refund_seats_count?.[0] ||
        data?.ticket?.[0] ||
        "Failed to process refund. Please check inputs.";
      setErrorMsg(msg);
    },
  });

  if (!isOpen || !ticket) return null;

  const perSeatCost = Number(ticket.per_seat_cost) || 0;
  const maxSeats = ticket.available_seats_to_refund;

  const handleSeatsChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(maxSeats, newCount));
    setRefundSeats(clamped);
    setOriginalAmount(String((perSeatCost * clamped).toFixed(2)));
  };

  const grossVal = Number(originalAmount) || 0;
  const penaltyVal = Number(penaltyFee) || 0;
  const netRefundVal = Math.max(0, grossVal - penaltyVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (refundSeats < 1 || refundSeats > maxSeats) {
      setErrorMsg(`Seat count must be between 1 and ${maxSeats}.`);
      return;
    }
    if (penaltyVal > grossVal) {
      setErrorMsg("Airline penalty fee cannot exceed gross ticket fare.");
      return;
    }

    mutation.mutate({
      ticket: ticket.id,
      refund_seats_count: refundSeats,
      original_amount: grossVal,
      penalty_fee: penaltyVal,
      refund_method: refundMethod,
      reason: reason.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-lg border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <RotateCcw className="h-4 w-4" />
              Ticket Refund Processing
            </div>
            <CardTitle className="text-lg font-bold">PNR: {ticket.pnr_number}</CardTitle>
            <CardDescription className="text-xs">
              {ticket.airline_name} • {ticket.agency_name}
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Ticket Snapshot Metrics */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500">Total Booked</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{ticket.total_tickets} seats</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500">Already Refunded</p>
                <p className="font-bold text-sm text-amber-600 dark:text-amber-400">
                  {ticket.refunded_seats_count} seats
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-500">Eligible to Refund</p>
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {ticket.available_seats_to_refund} seats
                </p>
              </div>
            </div>

            {/* Refund Seats Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Number of Seats to Cancel & Refund (Max {maxSeats})
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={maxSeats}
                  value={refundSeats}
                  onChange={(e) => handleSeatsChange(parseInt(e.target.value) || 1)}
                  className="w-28 font-mono font-bold text-center"
                />
                <span className="text-slate-500 text-[11px]">
                  @ PKR {Number(ticket.per_seat_cost).toLocaleString()} per seat
                </span>
              </div>
            </div>

            {/* Financial Calculations */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Gross Fare to Refund (PKR)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  className="font-mono"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Airline Penalty Deduction (PKR)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={penaltyFee}
                  onChange={(e) => setPenaltyFee(e.target.value)}
                  className="font-mono text-rose-600 dark:text-rose-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Live Net Calculation Callout */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Net Refund Issued to Client / Agency
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Formula: Gross ({grossVal.toLocaleString()}) - Penalty ({penaltyVal.toLocaleString()})
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  PKR {netRefundVal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Refund Instrument */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Refund Payment Instrument
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
                className="w-full rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="CASH">Cash Refund</option>
                <option value="BANK_TRANSFER">Bank Transfer (IBFT)</option>
                <option value="CREDIT_ADJUSTMENT">Agency Credit Adjustment</option>
              </select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Cancellation Reason / Notes
              </label>
              <Input
                placeholder="e.g. Passenger schedule conflict, medical emergency, airline flight cancellation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              isLoading={mutation.isPending}
              disabled={maxSeats <= 0 || penaltyVal > grossVal}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Confirm & Post Refund
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
