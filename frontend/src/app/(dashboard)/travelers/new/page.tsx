"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { travelersApi } from "@/lib/api/travel";
import { TravelerLookup, AgeCategory } from "@/types/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Users,
  ArrowLeft,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Shield,
  HelpCircle,
} from "lucide-react";

const travelerSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC must follow format: 12345-1234567-1"),
  phone_number: z.string().min(10, "Valid contact number required"),
  passport_number: z.string().optional().or(z.literal("")),
  age_category: z.enum(["ADULT", "CHILD", "INFANT"]),
  guardian: z.string().optional().or(z.literal("")),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  notes: z.string().optional(),
});

type TravelerFormData = z.infer<typeof travelerSchema>;

export default function NewTravelerPage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Guardian search state
  const [guardianQuery, setGuardianQuery] = useState("");
  const [guardianResults, setGuardianResults] = useState<TravelerLookup[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<TravelerLookup | null>(null);
  const [isSearchingGuardian, setIsSearchingGuardian] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TravelerFormData>({
    resolver: zodResolver(travelerSchema),
    defaultValues: {
      full_name: "",
      cnic: "",
      phone_number: "",
      passport_number: "",
      age_category: "ADULT",
      guardian: "",
      address: "",
      emergency_contact: "",
      notes: "",
    },
  });

  const selectedAgeCategory = watch("age_category");

  // Format CNIC as user types: 12345-1234567-1
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 13) val = val.substring(0, 13);

    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5, 12)}-${val.substring(12, 13)}`;
    }
    setValue("cnic", formatted, { shouldValidate: true });
  };

  // Debounced Guardian search
  useEffect(() => {
    if (!guardianQuery || guardianQuery.trim().length < 2) {
      setGuardianResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGuardian(true);
      try {
        const results = await travelersApi.lookup(guardianQuery.trim());
        setGuardianResults(results);
      } catch (err) {
        console.error("Failed to search guardians:", err);
      } finally {
        setIsSearchingGuardian(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [guardianQuery]);

  const selectGuardian = (g: TravelerLookup) => {
    setSelectedGuardian(g);
    setValue("guardian", g.id, { shouldValidate: true });
    setGuardianQuery("");
    setGuardianResults([]);
  };

  const removeGuardian = () => {
    setSelectedGuardian(null);
    setValue("guardian", "", { shouldValidate: true });
  };

  const onSubmit = async (data: TravelerFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload: Partial<TravelerFormData> = {
        ...data,
        guardian: selectedGuardian ? selectedGuardian.id : undefined,
        passport_number: data.passport_number ? data.passport_number.trim() : undefined,
      };

      const created = await travelersApi.create(payload as any);
      toast.success("Traveler Registered", `${data.full_name} has been enrolled in Khas Travels.`);
      router.push(`/travelers/${created.id}`);
    } catch (err: any) {
      console.error("Traveler registration error:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.cnic?.[0] ||
        "Registration failed. Please verify submitted details.";
      setServerError(msg);
      toast.error("Registration Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/travelers"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Directory
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="h-3.5 w-3.5" />
              Client Onboarding
            </span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Register New Traveler</CardTitle>
          <CardDescription>
            Enter pilgrim identity, age classification, Pakistani CNIC / juvenile B-Form, and family linkage.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Section 1: Identity & Age Classification */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Passenger Identity & Classification
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Legal Name *
                  </label>
                  <Input
                    placeholder="e.g. Haji Muhammad Irfan"
                    error={!!errors.full_name}
                    {...register("full_name")}
                  />
                  {errors.full_name && (
                    <p className="text-[11px] text-red-500">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pakistani CNIC / B-Form Number *
                  </label>
                  <Input
                    placeholder="35202-1234567-1"
                    maxLength={15}
                    error={!!errors.cnic}
                    {...register("cnic")}
                    onChange={handleCnicChange}
                  />
                  <p className="text-[11px] text-slate-400">Standard 13-digit format with hyphens</p>
                  {errors.cnic && (
                    <p className="text-[11px] text-red-500">{errors.cnic.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    International Passport Number (Optional)
                  </label>
                  <Input
                    placeholder="e.g. AB1234567"
                    className="font-mono uppercase"
                    {...register("passport_number")}
                  />
                  <p className="text-[11px] text-slate-400">Can be attached prior to visa submission</p>
                </div>

                {/* Age Category Selector */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Age Category (Determines Package Rates) *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: "ADULT", label: "Adult", desc: "Age 12+ (Full fare)" },
                      { val: "CHILD", label: "Child", desc: "Age 2 – 11 (Reduced fare)" },
                      { val: "INFANT", label: "Infant", desc: "Under 2 (Base infant fare)" },
                    ].map((item) => (
                      <label
                        key={item.val}
                        className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAgeCategory === item.val
                            ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-600"
                            : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                        }`}
                      >
                        <input
                          type="radio"
                          value={item.val}
                          className="sr-only"
                          {...register("age_category")}
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500">{item.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Family & Guardian Linkage */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Family & Guardian Linking
                </h3>
                <span className="text-[11px] text-slate-400">
                  Required for minors & family dossiers
                </span>
              </div>

              {selectedGuardian ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/50">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {selectedGuardian.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        CNIC: {selectedGuardian.cnic} • Phone: {selectedGuardian.phone_number}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-600 hover:bg-red-50"
                    onClick={removeGuardian}
                  >
                    Remove Guardian
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search existing registered traveler by Name or CNIC to assign as Guardian..."
                      value={guardianQuery}
                      onChange={(e) => setGuardianQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {isSearchingGuardian && (
                    <p className="text-xs text-slate-400">Searching directory...</p>
                  )}

                  {guardianResults.length > 0 && (
                    <div className="border border-slate-200 rounded-lg divide-y max-h-48 overflow-y-auto bg-white dark:bg-slate-900 dark:border-slate-800 shadow-md">
                      {guardianResults.map((g) => (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => selectGuardian(g)}
                          className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {g.full_name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              CNIC: {g.cnic} • {g.phone_number}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Assign &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Contact & Logistics */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Contact & Logistics
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Primary Contact Number *
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Emergency Contact in Pakistan
                  </label>
                  <Input
                    placeholder="Name & Relationship (+92 ...)"
                    {...register("emergency_contact")}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Residential Address
                  </label>
                  <Input
                    placeholder="House / Street, City, District"
                    {...register("address")}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Operational Notes (Medical / Wheelchair / Special Accommodations)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-slate-300 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                    placeholder="Wheelchair required at Jeddah airport, diabetic meal, ground floor room preference..."
                    {...register("notes")}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link href="/travelers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>

            <Button type="submit" variant="brand" isLoading={isSubmitting}>
              Complete Registration
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
