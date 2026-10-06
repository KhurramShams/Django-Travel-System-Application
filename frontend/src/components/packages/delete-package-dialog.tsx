"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { packagesApi } from "@/lib/api/travel";
import { TravelPackage } from "@/types/travel";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  X,
  Loader2,
  Trash2,
  ShieldAlert,
  Users,
} from "lucide-react";

interface DeletePackageDialogProps {
  pkg: TravelPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeletePackageDialog({
  pkg,
  isOpen,
  onClose,
  onSuccess,
}: DeletePackageDialogProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!pkg) throw new Error("No package selected for deletion");
      return packagesApi.delete(pkg.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      console.error("Failed to delete package:", err);
      const res = err?.response?.data;
      const msg =
        res?.error?.message ||
        res?.error ||
        res?.detail ||
        "Cannot delete tour package. It may contain enrolled travelers or financial records.";
      setErrorMessage(msg);
    },
  });

  if (!isOpen || !pkg) return null;

  const hasEnrolled = (pkg.total_enrolled || 0) > 0;

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
                Delete Tour Package
              </CardTitle>
              <CardDescription className="text-xs">
                Permanent package catalog removal
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
            Are you sure you want to permanently delete tour package{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {pkg.title}
            </span>{" "}
            (Code: <span className="font-mono font-semibold">{pkg.package_code}</span>)?
          </p>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Departure - Return:</span>
              <span>{pkg.departure_date} to {pkg.return_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Quota / Capacity:</span>
              <span>{pkg.capacity} seats</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Currently Enrolled:</span>
              <span className={hasEnrolled ? "font-bold text-rose-600" : ""}>
                {pkg.total_enrolled} pilgrims
              </span>
            </div>
          </div>

          {hasEnrolled && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              <p className="font-semibold text-xs flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-rose-600" />
                Active Enrolled Travelers Notice
              </p>
              <p className="text-[11px] mt-0.5">
                This package has {pkg.total_enrolled} enrolled pilgrim(s). Deletion is blocked to safeguard client contracts. Remove all travelers from this package roster first.
              </p>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            This action cannot be undone. If no pilgrims are enrolled, this package catalog entry will be permanently removed.
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Package
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
