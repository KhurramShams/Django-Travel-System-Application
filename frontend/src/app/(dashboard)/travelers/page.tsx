"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { travelersApi } from "@/lib/api/travel";
import { Traveler, AgeCategory } from "@/types/travel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  CreditCard,
  Plane,
  ChevronRight,
  Shield,
  Loader2,
  Calendar,
  AlertCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import { EditTravelerModal } from "@/components/travelers/edit-traveler-modal";
import { DeleteTravelerDialog } from "@/components/travelers/delete-traveler-dialog";

export default function TravelersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAge, setSelectedAge] = useState<string>("ALL");
  const [selectedTravelerForEdit, setSelectedTravelerForEdit] = useState<Traveler | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTravelerForDelete, setSelectedTravelerForDelete] = useState<Traveler | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: rawTravelers, isLoading, error } = useQuery({
    queryKey: ["travelers", searchTerm, selectedAge],
    queryFn: () =>
      travelersApi.list({
        search: searchTerm || undefined,
        age_category: selectedAge !== "ALL" ? selectedAge : undefined,
      }),
  });

  const travelers: Traveler[] = Array.isArray(rawTravelers) ? rawTravelers : [];

  const getAgeBadgeVariant = (category: AgeCategory) => {
    switch (category) {
      case "ADULT":
        return "brand";
      case "CHILD":
        return "warning";
      case "INFANT":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="h-3.5 w-3.5" />
              Client Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Travelers & Pilgrims
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage individual client profiles, family hierarchies, B-Forms, and passport dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/travelers/new">
            <Button variant="brand" className="font-semibold shadow-xs">
              <UserPlus className="mr-2 h-4 w-4" />
              Register Traveler
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by full name, CNIC (35202-...), phone or passport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Tier:</span>
              <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                {["ALL", "ADULT", "CHILD", "INFANT"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedAge(cat)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      selectedAge === cat
                        ? "bg-white text-emerald-800 shadow-xs dark:bg-slate-800 dark:text-emerald-400 font-semibold"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traveler Table / List */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Registered Clients</CardTitle>
              <CardDescription>
                {travelers ? `${travelers.length} traveler profile(s) found` : "Loading directory..."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-sm">Fetching traveler directory...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-sm text-red-600 gap-2">
              <AlertCircle className="h-5 w-5" />
              Failed to load travelers. Ensure backend service is reachable.
            </div>
          ) : travelers && travelers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No travelers registered</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Get started by clicking &quot;Register Traveler&quot; to onboard clients and create family groups.
              </p>
              <Link href="/travelers/new" className="mt-4">
                <Button size="sm" variant="outline">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Add New Traveler
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">CNIC / B-Form</th>
                    <th className="py-3 px-4">Age Category</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Family / Guardian</th>
                    <th className="py-3 px-4">Active Tour</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {travelers?.map((t: Traveler) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-900/40"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <Link
                          href={`/travelers/${t.id}`}
                          className="hover:text-emerald-700 hover:underline flex items-center gap-1.5"
                        >
                          {t.full_name}
                        </Link>
                        {t.passport_number && (
                          <span className="block text-[11px] text-slate-400 font-mono">
                            Pass: {t.passport_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {t.cnic}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getAgeBadgeVariant(t.age_category)} className="text-[10px]">
                          {t.age_category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{t.phone_number}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {t.guardian_details ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {t.guardian_details.full_name} (Guardian)
                          </span>
                        ) : t.dependents && t.dependents.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-800 font-medium dark:bg-teal-950 dark:text-teal-300">
                            {t.dependents.length} Dependent(s)
                          </span>
                        ) : (
                          <span className="text-slate-400">Head of dossier</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {t.has_active_package ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold dark:text-emerald-400">
                            <Plane className="h-3 w-3" />
                            {t.active_package_title || "Active Tour"}
                          </span>
                        ) : (
                          <span className="text-slate-400">No active tour</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-700 hover:text-emerald-700 hover:border-emerald-300 dark:text-slate-200"
                            onClick={() => {
                              setSelectedTravelerForEdit(t);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit traveler profile"
                          >
                            <Edit3 className="mr-1 h-3 w-3 text-emerald-600" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40"
                            onClick={() => {
                              setSelectedTravelerForDelete(t);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete traveler profile"
                          >
                            <Trash2 className="mr-1 h-3 w-3 text-rose-500" />
                            Delete
                          </Button>
                          <Link href={`/travelers/${t.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              Dossier
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Traveler Modal */}
      <EditTravelerModal
        traveler={selectedTravelerForEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTravelerForEdit(null);
        }}
      />

      {/* Delete Traveler Dialog */}
      <DeleteTravelerDialog
        traveler={selectedTravelerForDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTravelerForDelete(null);
        }}
      />
    </div>
  );
}
