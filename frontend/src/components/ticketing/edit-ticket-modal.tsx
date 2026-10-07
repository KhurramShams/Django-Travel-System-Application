"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ticketsApi } from "@/lib/api/ticketing";
import { AgencyTicket } from "@/types/ticketing";
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
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { getErrorMessage } from "@/lib/utils";
import {
  Edit3,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  Building,
  Plane,
  Hash,
  DollarSign,
  Users,
  FileText,
  CheckCircle2,
} from "lucide-react";

const editTicketSchema = z.object({
  agency_name: z.string().min(2, "Agency name must be at least 2 characters"),
  airline_name: z.string().min(2, "Airline name must be at least 2 characters"),
  pnr_number: z
    .string()
    .min(5, "PNR must be at least 5 characters")
    .max(12, "PNR cannot exceed 12 characters")
    .regex(/^[A-Za-z0-9]+$/, "PNR must contain only alphanumeric characters"),
  total_tickets: z.coerce.number().min(1, "Total tickets must be at least 1"),
  issue_date: z.string().min(1, "Issue date is required"),
  total_price: z.coerce.number().min(1, "Total price must be greater than zero"),
  notes: z.string().optional(),
});

type EditTicketFormValues = z.infer<typeof editTicketSchema>;

interface EditTicketModalProps {
  ticket: AgencyTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditTicketModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: EditTicketModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === "Admin";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      agency_name: "",
      airline_name: "",
      pnr_number: "",
      total_tickets: 1,
      issue_date: "",
      total_price: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (ticket && isOpen) {
      reset({
        agency_name: ticket.agency_name,
        airline_name: ticket.airline_name,
        pnr_number: ticket.pnr_number,
        total_tickets: ticket.total_tickets,
        issue_date: ticket.issue_date,
        total_price: Number(ticket.total_price),
        notes: ticket.notes || "",
      });
      setServerError(null);
    }
  }, [ticket, isOpen, reset]);

  const watchedSeats = watch("total_tickets") || 1;
  const watchedPrice = watch("total_price") || 0;
  const calculatedPerSeat = React.useMemo(() => {
    return watchedSeats > 0 ? (watchedPrice / watchedSeats).toFixed(2) : "0.00";
  }, [watchedSeats, watchedPrice]);

  const mutation = useMutation({
    mutationFn: (data: EditTicketFormValues) => {
      if (!ticket) throw new Error("No ticket selected for edit");
      return ticketsApi.update(ticket.id, {
        agency_name: data.agency_name.trim(),
        airline_name: data.airline_name.trim(),
        pnr_number: data.pnr_number.trim().toUpperCase(),
        total_tickets: data.total_tickets,
        issue_date: data.issue_date,
        total_price: data.total_price,
        notes: data.notes?.trim() || "",
      });
    },
    onSuccess: () => {
      toast.success("Airline ticket reservation updated successfully");
      onClose();
      if (onSuccess) onSuccess();
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticketing-kpi"] });
    },
    onError: (err: any) => {
      console.error("Failed to update ticket:", err);
      const msg = getErrorMessage(
        err,
        "Failed to update airline ticket. Please review the values and try again."
      );
      setServerError(msg);
      toast.error("Update Failed", msg);
    },
  });

  const onSubmit = (data: EditTicketFormValues) => {
    setServerError(null);
    if (!ticket) return;

    if (ticket.refunded_seats_count > 0 && data.total_tickets < ticket.refunded_seats_count) {
      setServerError(
        `Cannot reduce total seats to ${data.total_tickets}. ${ticket.refunded_seats_count} seats have already been refunded.`
      );
      return;
    }

    if (
      Number(ticket.total_refunded_amount) > 0 &&
      data.total_price < Number(ticket.total_refunded_amount)
    ) {
      setServerError(
        `Cannot reduce total price to PKR ${data.total_price.toLocaleString()}. PKR ${Number(
          ticket.total_refunded_amount
        ).toLocaleString()} has already been refunded.`
      );
      return;
    }

    mutation.mutate(data);
  };

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Edit3 className="h-4 w-4" />
              Manage AirLine Ticket
            </div>
            <CardTitle className="text-lg font-bold">Edit AirLine Ticket ({ticket.pnr_number})</CardTitle>
            <CardDescription className="text-xs">
              Update wholesale agency, airline carrier, seat counts, or purchase pricing.
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <CardContent className="space-y-4 pt-4 text-xs">
            {serverError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Refund Safeguard Notice if refunds exist */}
            {ticket.refunded_seats_count > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                <p className="font-semibold text-xs flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Active Refund Safeguard Active
                </p>
                <p className="text-[11px] mt-0.5">
                  This ticket has {ticket.refunded_seats_count} refunded seats (PKR {Number(ticket.total_refunded_amount).toLocaleString()}).
                  Seats and fare cannot be set below already refunded totals.
                </p>
              </div>
            )}

            {/* PNR and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-emerald-600" />
                  PNR Number *
                </label>
                <Input
                  className="font-mono uppercase font-bold tracking-wider"
                  error={!!errors.pnr_number}
                  {...register("pnr_number")}
                  onChange={(e) => setValue("pnr_number", e.target.value.toUpperCase())}
                />
                {errors.pnr_number && (
                  <p className="text-[11px] text-red-500">{errors.pnr_number.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  Issue Date *
                </label>
                <Input
                  type="date"
                  error={!!errors.issue_date}
                  {...register("issue_date")}
                />
                {errors.issue_date && (
                  <p className="text-[11px] text-red-500">{errors.issue_date.message}</p>
                )}
              </div>
            </div>

            {/* Agency Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-emerald-600" />
                Wholesale Agency / Consolidator Name *
              </label>
              <Input
                placeholder="Consolidator or wholesale distributor"
                error={!!errors.agency_name}
                {...register("agency_name")}
              />
              {errors.agency_name && (
                <p className="text-[11px] text-red-500">{errors.agency_name.message}</p>
              )}
            </div>

            {/* Airline Carrier */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Plane className="h-3.5 w-3.5 text-emerald-600" />
                Airline Carrier *
              </label>
              <Input
                placeholder="e.g. Pakistan International Airlines (PIA), Saudia"
                error={!!errors.airline_name}
                {...register("airline_name")}
              />
              {errors.airline_name && (
                <p className="text-[11px] text-red-500">{errors.airline_name.message}</p>
              )}
            </div>

            {/* Total Tickets and Total Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  Total Seats *
                </label>
                <Input
                  type="number"
                  min={ticket.refunded_seats_count || 1}
                  error={!!errors.total_tickets}
                  {...register("total_tickets")}
                />
                {errors.total_tickets && (
                  <p className="text-[11px] text-red-500">{errors.total_tickets.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  Total Fare (PKR) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={Number(ticket.total_refunded_amount) || 1}
                  error={!!errors.total_price}
                  {...register("total_price")}
                />
                {errors.total_price && (
                  <p className="text-[11px] text-red-500">{errors.total_price.message}</p>
                )}
              </div>
            </div>

            {/* Dynamic Calculated Per Seat Cost */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-xs">Calculated Cost Per Seat:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                PKR {Number(calculatedPerSeat).toLocaleString()}
              </span>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Sector / Routing Notes
              </label>
              <Input
                placeholder="e.g. KHI-JED-KHI Direct Flight via PK741"
                {...register("notes")}
              />
            </div>

            {!isAdmin && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                <p className="font-semibold text-xs flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  Administrator Privileges Required
                </p>
                <p className="text-[11px] mt-0.5">
                  Only Administrator accounts are permitted to modify airline ticket inventory, pricing, and quotas.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={!isAdmin || mutation.isPending}
              isLoading={mutation.isPending}
              loadingText="Saving Changes..."
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
