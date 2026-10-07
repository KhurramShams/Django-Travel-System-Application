"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { travelersApi, packagesApi, enrollmentsApi } from "@/lib/api/travel";
import { TravelerLookup, TravelPackage } from "@/types/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Calculator,
  UserCheck,
  Shield,
  Loader2,
  Calendar,
} from "lucide-react";

function EnrollmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTravelerId = searchParams.get("traveler_id");
  const preselectedPackageId = searchParams.get("package_id");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Traveler search
  const [travelerQuery, setTravelerQuery] = useState("");
  const [travelerResults, setTravelerResults] = useState<TravelerLookup[]>([]);
  const [selectedTraveler, setSelectedTraveler] = useState<TravelerLookup | null>(null);
  const [isSearchingTraveler, setIsSearchingTraveler] = useState(false);

  // Selected package
  const [selectedPackageId, setSelectedPackageId] = useState<string>(preselectedPackageId || "");
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);

  // Financial values
  const [basePrice, setBasePrice] = useState<number>(0);
  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [specialRequests, setSpecialRequests] = useState<string>("");

  // Load active packages list
  const { data: packagesList } = useQuery({
    queryKey: ["active-packages"],
    queryFn: () => packagesApi.list({ status: "ACTIVE" }),
  });

  // Prepopulate traveler if id provided
  useEffect(() => {
    if (preselectedTravelerId) {
      travelersApi.get(preselectedTravelerId).then((t) => {
        setSelectedTraveler({
          id: t.id,
          full_name: t.full_name,
          cnic: t.cnic,
          phone_number: t.phone_number,
          age_category: t.age_category,
          passport_number: t.passport_number,
          has_active_package: !!t.has_active_package,
          active_package_title: t.active_package_title,
        });
      });
    }
  }, [preselectedTravelerId]);

  // Debounced search for traveler
  useEffect(() => {
    if (!travelerQuery || travelerQuery.trim().length < 2) {
      setTravelerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingTraveler(true);
      try {
        const results = await travelersApi.lookup(travelerQuery.trim());
        setTravelerResults(results);
      } catch (err) {
        console.error("Traveler lookup error:", err);
      } finally {
        setIsSearchingTraveler(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [travelerQuery]);

  // When package selection changes, resolve package object
  useEffect(() => {
    if (selectedPackageId && packagesList) {
      const found = packagesList.find((p) => p.id === selectedPackageId);
      setSelectedPackage(found || null);
    }
  }, [selectedPackageId, packagesList]);

  // When traveler or package changes, auto-apply correct age-tier base rate
  useEffect(() => {
    if (selectedPackage && selectedTraveler) {
      const age = selectedTraveler.age_category;
      let price = Number(selectedPackage.adult_price);
      if (age === "CHILD") {
        price = Number(selectedPackage.child_price);
      } else if (age === "INFANT") {
        price = Number(selectedPackage.infant_price);
      }
      setBasePrice(price);
    } else {
      setBasePrice(0);
    }
  }, [selectedPackage, selectedTraveler]);

  // Computed final agreed total
  const finalAgreedPrice = Math.max(0, basePrice + Number(extraAmount) - Number(discount));

  const selectTraveler = (t: TravelerLookup) => {
    setSelectedTraveler(t);
    setTravelerQuery("");
    setTravelerResults([]);
  };

  const removeTraveler = () => {
    setSelectedTraveler(null);
  };

  const isBlockedByActivePackage = selectedTraveler?.has_active_package;

  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraveler) {
      setServerError("Please search and select a traveler.");
      return;
    }
    if (!selectedPackage) {
      setServerError("Please select a travel package.");
      return;
    }
    if (isBlockedByActivePackage) {
      setServerError("Cannot enroll: Traveler already belongs to an active package.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const created = await enrollmentsApi.create({
        traveler: selectedTraveler.id,
        package: selectedPackage.id,
        extra_amount: extraAmount,
        discount: discount,
        special_requests: specialRequests,
      });

      router.push(`/finance/invoice/${created.id}`);
    } catch (err: any) {
      console.error("Enrollment error:", err);
      const resData = err?.response?.data;
      let msg = "Failed to create enrollment. Please check inputs.";
      if (typeof resData === "string") {
        msg = resData;
      } else if (resData?.error?.message) {
        msg = resData.error.message;
      } else if (resData?.detail) {
        msg = resData.detail;
      } else if (resData?.traveler) {
        msg = Array.isArray(resData.traveler) ? resData.traveler.join(" ") : String(resData.traveler);
      } else if (resData?.package) {
        msg = Array.isArray(resData.package) ? resData.package.join(" ") : String(resData.package);
      } else if (resData?.non_field_errors) {
        msg = Array.isArray(resData.non_field_errors) ? resData.non_field_errors.join(" ") : String(resData.non_field_errors);
      }
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/enrollments"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Back to Enrollments
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <FileText className="h-3.5 w-3.5" />
              Enrollment Workflow
            </span>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            Enroll Traveler into Package
          </CardTitle>
          <CardDescription>
            Bind a client to a tour departure, auto-lock age-based pricing, and enforce single active package constraint.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmitEnrollment}>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Step 1: Select Traveler */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Select Traveler / Pilgrim
              </h3>

              {selectedTraveler ? (
                <div
                  className={`p-4 rounded-lg border transition-all ${
                    isBlockedByActivePackage
                      ? "border-red-300 bg-red-50/70 dark:border-red-900 dark:bg-red-950/40"
                      : "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <UserCheck
                        className={`h-6 w-6 mt-0.5 ${
                          isBlockedByActivePackage ? "text-red-600" : "text-emerald-700"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {selectedTraveler.full_name}
                          </span>
                          <Badge variant="brand" className="text-[10px]">
                            {selectedTraveler.age_category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          CNIC: {selectedTraveler.cnic} • Contact: {selectedTraveler.phone_number}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={removeTraveler}
                    >
                      Change Traveler
                    </Button>
                  </div>

                  {/* Constraint Warning Banner */}
                  {isBlockedByActivePackage && (
                    <div className="mt-3 flex items-start gap-2 rounded-md bg-red-100 p-2.5 text-xs text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          Constraint Violation: Active Tour Invariant
                        </span>
                        <span>
                          This traveler is currently actively booked in &quot;
                          {selectedTraveler.active_package_title}&quot;. A passenger cannot belong to
                          more than one active package simultaneously. Complete or cancel their
                          existing tour before re-enrolling.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Type client Name or CNIC (e.g. 35202-...) to search..."
                      value={travelerQuery}
                      onChange={(e) => setTravelerQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {isSearchingTraveler && (
                    <p className="text-xs text-slate-400">Searching traveler directory...</p>
                  )}

                  {travelerResults.length > 0 && (
                    <div className="border border-slate-200 rounded-lg divide-y max-h-52 overflow-y-auto bg-white dark:bg-slate-900 dark:border-slate-800 shadow-md">
                      {travelerResults.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => selectTraveler(t)}
                          className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {t.full_name}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {t.age_category}
                              </Badge>
                              {t.has_active_package && (
                                <Badge variant="destructive" className="text-[9px]">
                                  Already Enrolled
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">
                              CNIC: {t.cnic} • {t.phone_number}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600">
                            Select &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Select Package */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Target Travel Package
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Active Package Tour *
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="">-- Choose Package Departure --</option>
                  {packagesList?.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.seats_available <= 0}>
                      {p.title} ({p.package_code}) • Dep: {p.departure_date} • {p.seats_available} seats left
                    </option>
                  ))}
                </select>
              </div>

              {selectedPackage && (
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>Flight: {selectedPackage.flight_name}</span>
                    <span>
                      Duration: {selectedPackage.duration_days} Days ({selectedPackage.departure_date} to {selectedPackage.return_date})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Location: {selectedPackage.location.replace("_", " ")} • Hotel: {selectedPackage.star_rating.replace("_", " ")}
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Rate Calculation Invariant */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Pricing & Surcharges
                </h3>
                <span className="text-[11px] text-slate-400">
                  Agreed Total = (Base + Extras) - Discount
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Base Price (Applied from Age Tier)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={basePrice}
                      readOnly
                      className="bg-slate-100 font-mono font-bold dark:bg-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tier: {selectedTraveler ? selectedTraveler.age_category : "Select passenger"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Supplemental Extras (PKR)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="font-mono"
                  />
                  <p className="text-[11px] text-slate-400">Private transport, room upgrade, etc.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Authorized Discount (PKR)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="font-mono"
                  />
                  <p className="text-[11px] text-slate-400">Promotional or family concession</p>
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 p-4 text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-emerald-200 block font-semibold">
                    Final Agreed Package Contract Price
                  </span>
                  <span className="text-2xl font-bold font-mono">
                    PKR {finalAgreedPrice.toLocaleString()}
                  </span>
                </div>
                <Calculator className="h-8 w-8 text-emerald-200 opacity-60" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Special Client Requests
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950"
                  placeholder="Sharing room with family, wheelchair on arrival, specific airline meal, etc."
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link href="/enrollments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="brand"
              isLoading={isSubmitting}
              disabled={isBlockedByActivePackage || !selectedTraveler || !selectedPackage}
            >
              {isBlockedByActivePackage ? "Cannot Enroll (Blocked)" : "Execute Enrollment Contract"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NewEnrollmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <EnrollmentForm />
    </Suspense>
  );
}
