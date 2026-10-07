"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "@/lib/api/travel";
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
import { getErrorMessage } from "@/lib/utils";
import {
  UserMinus,
  X,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
} from "lucide-react";

interface RemoveTravelerDialogProps {
  enrollmentId: string | null;
  travelerName: string;
  packageTitle: string;
  totalPaid?: string | number;
  packageId?: string;
  travelerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RemoveTravelerDialog({
  enrollmentId,
  travelerName,
  packageTitle,
  totalPaid = 0,
  packageId,
  travelerId,
  isOpen,
  onClose,
  onSuccess,
}: RemoveTravelerDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [force, setForce] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasPayments = Number(totalPaid) > 0;

  const mutation = useMutation({
    mutationFn: () => {
      if (!enrollmentId) throw new Error("No enrollment selected");
      return enrollmentsApi.delete(enrollmentId, force);
    },
    onSuccess: () => {
      toast.success("Traveler successfully removed from package");
      onClose();
      if (onSuccess) onSuccess();
      if (packageId) {
        queryClient.invalidateQueries({ queryKey: ["package-roster", packageId] });
        queryClient.invalidateQueries({ queryKey: ["package", packageId] });
      }
      if (travelerId) {
        queryClient.invalidateQueries({ queryKey: ["traveler", travelerId] });
        queryClient.invalidateQueries({ queryKey: ["traveler-history", travelerId] });
      }
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["travelers"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (err: any) => {
      console.error("Failed to remove traveler from package:", err);
      const msg = getErrorMessage(
        err,
        "Failed to remove traveler from enrolled package."
      );
      setErrorMessage(msg);
      toast.error("Removal Failed", msg);
    },
  });

  if (!isOpen || !enrollmentId) return null;

  const handleConfirm = () => {
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="rounded-full bg-rose-100 dark:bg-rose-950/50 p-2 text-rose-600">
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Remove Traveler from Package
              </CardTitle>
              <CardDescription className="text-xs">
                Cancel active enrollment & release seat quota
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
            Are you sure you want to remove{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {travelerName}
            </span>{" "}
            from the active tour package{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {packageTitle}
            </span>
            ?
          </p>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Traveler:</span>
              <span className="font-semibold">{travelerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Package:</span>
              <span>{packageTitle}</span>
            </div>
            {hasPayments && (
              <div className="flex justify-between font-mono">
                <span className="text-slate-500 font-sans">Recorded Paid Amount:</span>
                <span className="font-bold text-emerald-600">
                  PKR {Number(totalPaid).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {hasPayments && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 space-y-2">
              <div className="flex items-start gap-1.5">
                <CreditCard className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs">Financial Transactions Notice</p>
                  <p className="text-[11px] mt-0.5">
                    This traveler has paid PKR {Number(totalPaid).toLocaleString()}. Deleting enrollment will remove payment vouchers for this tour.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  className="rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Confirm forced removal (clear payments & release seat)
                </span>
              </label>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Removing this enrollment will immediately restore 1 seat to the package quota and free the traveler to enroll in other tours.
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
            onClick={handleConfirm}
            isLoading={mutation.isPending}
            loadingText="Removing..."
            disabled={hasPayments && !force}
          >
            <UserMinus className="mr-1.5 h-3.5 w-3.5" />
            Remove from Package
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
