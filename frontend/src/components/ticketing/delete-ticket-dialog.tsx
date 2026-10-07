"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { getErrorMessage } from "@/lib/utils";
import {
  AlertTriangle,
  X,
  Loader2,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface DeleteTicketDialogProps {
  ticket: AgencyTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteTicketDialog({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: DeleteTicketDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === "Admin";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!ticket) throw new Error("No ticket selected for deletion");
      return ticketsApi.delete(ticket.id);
    },
    onSuccess: () => {
      toast.success("Ticket Deleted", `Ticket PNR ${ticket?.pnr_number} was deleted.`);
      onClose();
      if (onSuccess) onSuccess();
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticketing-kpi"] });
    },
    onError: (err: any) => {
      console.error("Failed to delete ticket:", err);
      const msg = getErrorMessage(
        err,
        "Cannot delete ticket. It may have associated refund or financial records."
      );
      setErrorMessage(msg);
      toast.error("Delete Failed", msg);
    },
  });

  if (!isOpen || !ticket) return null;

  const hasRefunds = (ticket.refunded_seats_count || 0) > 0;

  const handleDelete = () => {
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="rounded-full bg-rose-100 dark:bg-rose-950/50 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Delete AirLine Ticket
              </CardTitle>
              <CardDescription className="text-xs">
                Permanent deletion confirmation
              </CardDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 text-xs">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to delete the airline ticket with PNR{" "}
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {ticket.pnr_number}
            </span>{" "}
            issued by{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {ticket.agency_name}
            </span>{" "}
            ({ticket.airline_name})?
          </p>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Total Seats:</span>
              <span className="font-bold">{ticket.total_tickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Total Fare:</span>
              <span className="font-bold">PKR {Number(ticket.total_price).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Refunded Seats:</span>
              <span className={hasRefunds ? "font-bold text-amber-600" : ""}>
                {ticket.refunded_seats_count}
              </span>
            </div>
          </div>

          {hasRefunds && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              <p className="font-semibold text-xs flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                Active Financial Record Detected
              </p>
              <p className="text-[11px] mt-0.5">
                This ticket has recorded refunds. Deletion is strictly prevented to safeguard accounting integrity.
              </p>
            </div>
          )}

          {!isAdmin && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              <p className="font-semibold text-xs flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Administrator Privileges Required
              </p>
              <p className="text-[11px] mt-0.5">
                Only Administrator accounts are permitted to permanently void or delete flight tickets from inventory.
              </p>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            This action cannot be undone. All seat quotas associated with this PNR will be removed from inventory.
          </p>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!isAdmin || hasRefunds || mutation.isPending}
            isLoading={mutation.isPending}
            loadingText="Deleting..."
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete Ticket
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
