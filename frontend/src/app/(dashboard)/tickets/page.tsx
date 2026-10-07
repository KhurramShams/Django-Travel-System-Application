"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ticketsApi } from "@/lib/api/ticketing";
import { AgencyTicket, TicketStatus } from "@/types/ticketing";
import { RefundProcessingModal } from "@/components/ticketing/refund-modal";
import { EditTicketModal } from "@/components/ticketing/edit-ticket-modal";
import { DeleteTicketDialog } from "@/components/ticketing/delete-ticket-dialog";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  PlusCircle,
  Search,
  RotateCcw,
  Plane,
  Building,
  DollarSign,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  FileText,
  History,
  Edit3,
  Trash2,
} from "lucide-react";

export default function TicketsListPage() {
  const { role } = useAuth();
  const isAdmin = role === "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTicketForRefund, setSelectedTicketForRefund] = useState<AgencyTicket | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedTicketForEdit, setSelectedTicketForEdit] = useState<AgencyTicket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTicketForDelete, setSelectedTicketForDelete] = useState<AgencyTicket | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Queries
  const { data: rawTickets, isLoading, error } = useQuery({
    queryKey: ["tickets", searchTerm, statusFilter],
    queryFn: () =>
      ticketsApi.list({
        search: searchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
  });

  const { data: summaryKpi } = useQuery({
    queryKey: ["ticketing-kpi"],
    queryFn: () => ticketsApi.getAnalyticsSummary(),
  });

  const tickets: AgencyTicket[] = Array.isArray(rawTickets) ? rawTickets : [];

  const handleOpenRefund = (ticket: AgencyTicket) => {
    setSelectedTicketForRefund(ticket);
    setIsRefundModalOpen(true);
  };

  const handleOpenEdit = (ticket: AgencyTicket) => {
    setSelectedTicketForEdit(ticket);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (ticket: AgencyTicket) => {
    setSelectedTicketForDelete(ticket);
    setIsDeleteModalOpen(true);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "ISSUED":
        return <Badge variant="brand">Active / Issued</Badge>;
      case "PARTIALLY_REFUNDED":
        return <Badge variant="warning">Partially Refunded</Badge>;
      case "REFUNDED":
        return <Badge variant="destructive">Fully Refunded</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-400">
              <Ticket className="h-3.5 w-3.5" />
              Flight Ticketing Module
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Purchased AirLine Ticket Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor consolidator flight purchases, track active PNR seat quotas, edit booking records, and process ticket refunds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/tickets/refunds">
            <Button variant="outline" size="sm" className="text-xs">
              <History className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
              Refund Ticket
            </Button>
          </Link>
          <Link href="/tickets/book">
            <Button variant="brand" size="sm" className="font-semibold shadow-xs text-xs">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Book AirLine Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytical KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Spend (Wholesale)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              PKR {Number(summaryKpi?.total_booking_volume || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              From {summaryKpi?.total_bookings_records || 0} booking records
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Passenger Seats Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {summaryKpi?.total_tickets_issued || 0} seats
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summaryKpi?.total_refunded_seats || 0} seats cancelled/refunded
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Net Refunded Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-800 dark:text-rose-300">
              PKR {Number(summaryKpi?.total_refunded_volume || 0).toLocaleString()}
            </div>
            <p className="text-xs text-rose-600/80 dark:text-rose-400 mt-1">
              Total deductions: PKR {Number(summaryKpi?.total_penalties_deducted || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Unrefunded PNRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200">
              {summaryKpi?.active_tickets_count || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summaryKpi?.partially_refunded_count || 0} partially refunded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by PNR, Agency name, Airline carrier, or Sector notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
            {["ALL", "ISSUED", "PARTIALLY_REFUNDED", "REFUNDED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {st === "ALL"
                  ? "All Statuses"
                  : st === "PARTIALLY_REFUNDED"
                  ? "Partial Refund"
                  : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Purchased Tickets Table */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <CardTitle className="text-base font-semibold">Wholesale Flight Ticket Master Ledger</CardTitle>
          <CardDescription className="text-xs">
            Complete inventory of group bookings and seat refund statuses.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed to load ticketing records. Please check connection.
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Ticket className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No agency tickets found</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                No tickets match your query. Book your first agency ticket to start tracking seat inventory.
              </p>
              <Link href="/tickets/book" className="mt-3 inline-block">
                <Button size="sm" variant="brand" className="text-xs">
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Book First AirLine Ticket
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">PNR Code</th>
                    <th className="py-3 px-4">Agency / Consolidator</th>
                    <th className="py-3 px-4">Airline</th>
                    <th className="py-3 px-4 text-center">Seat Quota</th>
                    <th className="py-3 px-4 text-right">Wholesale Fare</th>
                    <th className="py-3 px-4 text-right">Per Seat Cost</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.map((t) => {
                    const isFullyRefunded = t.available_seats_to_refund <= 0 || t.status === "REFUNDED";
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-900 dark:text-slate-100">
                            {t.pnr_number}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {t.agency_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Plane className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{t.airline_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {t.available_seats_to_refund} / {t.total_tickets}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {t.refunded_seats_count > 0 ? `(${t.refunded_seats_count} refunded)` : "all active"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                          PKR {Number(t.total_price).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          PKR {Number(t.per_seat_cost).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {t.issue_date}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(t.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(t)}
                              className="text-[11px] h-7 px-2 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 dark:text-slate-200"
                              title={isAdmin ? "Edit airline ticket details" : "Administrator privileges required to edit ticket"}
                            >
                              <Edit3 className="mr-1 h-3 w-3 text-emerald-600" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDelete(t)}
                              className="text-[11px] h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40"
                              title={isAdmin ? "Delete airline ticket" : "Administrator privileges required to delete ticket"}
                            >
                              <Trash2 className="mr-1 h-3 w-3 text-rose-500" />
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant={isFullyRefunded ? "outline" : "destructive"}
                              disabled={isFullyRefunded}
                              onClick={() => handleOpenRefund(t)}
                              className="text-[11px] h-7 px-2"
                              title={isFullyRefunded ? "No remaining seats to refund" : "Process partial or full refund"}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              {isFullyRefunded ? "Refunded" : "Refund"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Ticket Modal */}
      <EditTicketModal
        ticket={selectedTicketForEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTicketForEdit(null);
        }}
      />

      {/* Delete Ticket Confirmation Dialog */}
      <DeleteTicketDialog
        ticket={selectedTicketForDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTicketForDelete(null);
        }}
      />

      {/* Refund Modal */}
      <RefundProcessingModal
        ticket={selectedTicketForRefund}
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedTicketForRefund(null);
        }}
      />
    </div>
  );
}
