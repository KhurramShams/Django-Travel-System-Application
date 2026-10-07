"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { travelersApi } from "@/lib/api/travel";
import { Traveler } from "@/types/travel";
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
  AlertTriangle,
  X,
  Loader2,
  Trash2,
  ShieldAlert,
  Plane,
} from "lucide-react";

interface DeleteTravelerDialogProps {
  traveler: Traveler | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteTravelerDialog({
  traveler,
  isOpen,
  onClose,
  onSuccess,
}: DeleteTravelerDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!traveler) throw new Error("No traveler selected for deletion");
      return travelersApi.delete(traveler.id);
    },
    onSuccess: () => {
      toast.success("Traveler Deleted", `${traveler?.full_name} was removed from records.`);
      onClose();
      if (onSuccess) onSuccess();
      queryClient.invalidateQueries({ queryKey: ["travelers"] });
    },
    onError: (err: any) => {
      console.error("Failed to delete traveler:", err);
      const msg = getErrorMessage(
        err,
        "Cannot delete traveler. The traveler may have active package enrollments."
      );
      setErrorMessage(msg);
      toast.error("Delete Failed", msg);
    },
  });

  if (!isOpen || !traveler) return null;

  const hasActiveTour = traveler.has_active_package;

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
                Delete Traveler Dossier
              </CardTitle>
              <CardDescription className="text-xs">
                Permanent client record removal
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
            Are you sure you want to permanently delete client profile{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {traveler.full_name}
            </span>{" "}
            (CNIC: <span className="font-mono font-semibold">{traveler.cnic}</span>)?
          </p>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Tier:</span>
              <span className="font-semibold">{traveler.age_category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact:</span>
              <span>{traveler.phone_number}</span>
            </div>
            {traveler.passport_number && (
              <div className="flex justify-between">
                <span className="text-slate-500">Passport:</span>
                <span className="font-mono">{traveler.passport_number}</span>
              </div>
            )}
          </div>

          {hasActiveTour && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              <p className="font-semibold text-xs flex items-center gap-1">
                <Plane className="h-3.5 w-3.5 text-rose-600" />
                Active Tour Enrollment Detected
              </p>
              <p className="text-[11px] mt-0.5">
                This traveler is enrolled in:{" "}
                <span className="font-bold">
                  {traveler.active_package_title || "Active Tour Package"}
                </span>
                . Deletion is blocked until the traveler is removed from this package.
              </p>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            This action will delete personal records and historical contracts. Family members linked to this guardian will be unlinked safely.
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
            isLoading={mutation.isPending}
            loadingText="Deleting..."
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete Traveler
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
