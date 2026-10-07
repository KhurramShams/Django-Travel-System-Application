"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { travelersApi } from "@/lib/api/travel";
import { Traveler, AgeCategory } from "@/types/travel";
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
import {
  Edit3,
  AlertCircle,
  X,
  Loader2,
  Users,
  CreditCard,
  Phone,
  Plane,
  Home,
  CheckCircle2,
  FileText,
} from "lucide-react";

const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;

const editTravelerSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  cnic: z
    .string()
    .regex(cnicPattern, "CNIC must follow the format: XXXXX-XXXXXXX-X"),
  phone_number: z.string().min(7, "Valid phone number is required"),
  age_category: z.enum(["ADULT", "CHILD", "INFANT"]),
  passport_number: z.string().optional().or(z.literal("")),
  emergency_contact: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type EditTravelerFormData = z.infer<typeof editTravelerSchema>;

interface EditTravelerModalProps {
  traveler: Traveler | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: Traveler) => void;
}

export function EditTravelerModal({
  traveler,
  isOpen,
  onClose,
  onSuccess,
}: EditTravelerModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTravelerFormData>({
    resolver: zodResolver(editTravelerSchema),
  });

  useEffect(() => {
    if (traveler && isOpen) {
      reset({
        full_name: traveler.full_name,
        cnic: traveler.cnic,
        phone_number: traveler.phone_number,
        age_category: traveler.age_category,
        passport_number: traveler.passport_number || "",
        emergency_contact: traveler.emergency_contact || "",
        address: traveler.address || "",
        notes: traveler.notes || "",
      });
      setServerError(null);
    }
  }, [traveler, isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditTravelerFormData) => {
      if (!traveler) throw new Error("No traveler selected");
      const payload: Partial<Traveler> = {
        full_name: data.full_name.trim(),
        cnic: data.cnic.trim(),
        phone_number: data.phone_number.trim(),
        age_category: data.age_category,
        passport_number: data.passport_number?.trim() || undefined,
        emergency_contact: data.emergency_contact?.trim() || "",
        address: data.address?.trim() || "",
        notes: data.notes?.trim() || "",
      };
      return travelersApi.update(traveler.id, payload);
    },
    onSuccess: (data) => {
      toast.success("Traveler profile updated successfully");
      onClose();
      if (onSuccess) onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ["travelers"] });
      queryClient.invalidateQueries({ queryKey: ["traveler", traveler?.id] });
      queryClient.invalidateQueries({ queryKey: ["traveler-history", traveler?.id] });
    },
    onError: (err: any) => {
      console.error("Traveler update error:", err);
      const res = err?.response?.data;
      const msg =
        res?.error?.message ||
        res?.cnic?.[0] ||
        res?.passport_number?.[0] ||
        res?.detail ||
        "Failed to update traveler details. Please check form inputs.";
      setServerError(msg);
    },
  });

  const onSubmit = (data: EditTravelerFormData) => {
    setServerError(null);
    mutation.mutate(data);
  };

  if (!isOpen || !traveler) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <Card className="w-full max-w-xl border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Edit3 className="h-4 w-4" />
              Client Profile Administration
            </div>
            <CardTitle className="text-lg font-bold">Edit Traveler Profile</CardTitle>
            <CardDescription className="text-xs">
              Update identification details, age category, contact information, and special notes.
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

            {/* Full Name & Age Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                  Full Name *
                </label>
                <Input
                  placeholder="e.g. Muhammad Ahmad"
                  error={!!errors.full_name}
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-[11px] text-red-500">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Age Category (Pricing Tier) *
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register("age_category")}
                >
                  <option value="ADULT">Adult (Age 12+)</option>
                  <option value="CHILD">Child (Age 2 - 11)</option>
                  <option value="INFANT">Infant (Under 2 years)</option>
                </select>
              </div>
            </div>

            {/* CNIC & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  CNIC / B-Form Number *
                </label>
                <Input
                  placeholder="35202-1234567-1"
                  className="font-mono text-xs"
                  error={!!errors.cnic}
                  {...register("cnic")}
                />
                {errors.cnic && (
                  <p className="text-[11px] text-red-500">{errors.cnic.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  Phone / WhatsApp *
                </label>
                <Input
                  placeholder="+92 300 1234567"
                  error={!!errors.phone_number}
                  {...register("phone_number")}
                />
                {errors.phone_number && (
                  <p className="text-[11px] text-red-500">{errors.phone_number.message}</p>
                )}
              </div>
            </div>

            {/* Passport & Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Plane className="h-3.5 w-3.5 text-slate-500" />
                  Passport Number (Optional)
                </label>
                <Input
                  placeholder="e.g. PK1234567"
                  className="font-mono uppercase text-xs"
                  {...register("passport_number")}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Emergency Family Contact
                </label>
                <Input
                  placeholder="e.g. Brother: 0321-9876543"
                  {...register("emergency_contact")}
                />
              </div>
            </div>

            {/* Residential Address */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Home className="h-3.5 w-3.5 text-slate-500" />
                Residential Address
              </label>
              <Input
                placeholder="City, Sector, Street address"
                {...register("address")}
              />
            </div>

            {/* Special Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                Special Assistance / Medical Notes
              </label>
              <textarea
                rows={2}
                placeholder="Wheelchair assistance, diabetic dietary requirements, etc."
                className="w-full rounded-md border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register("notes")}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800 shrink-0">
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
              type="submit"
              variant="brand"
              size="sm"
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
