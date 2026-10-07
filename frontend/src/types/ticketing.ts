/**
 * TypeScript domain models for Agency Flight Ticketing and Refunds.
 */

export type TicketStatus = "ISSUED" | "PARTIALLY_REFUNDED" | "REFUNDED" | "CANCELLED";

export type RefundMethod = "CASH" | "BANK_TRANSFER" | "CREDIT_ADJUSTMENT";

export interface AgencyTicket {
  id: string;
  agency_name: string;
  airline_name: string;
  pnr_number: string;
  total_tickets: number;
  issue_date: string;
  total_price: string;
  status: TicketStatus;
  notes?: string;
  refunded_seats_count: number;
  available_seats_to_refund: number;
  total_refunded_amount: string;
  total_penalty_paid?: string;
  per_seat_cost: string;
  created_by_name?: string;
  refunds?: TicketRefund[];
  created_at: string;
}

export interface TicketRefund {
  id: string;
  ticket_id: string;
  ticket_pnr: string;
  agency_name: string;
  airline_name: string;
  refund_seats_count: number;
  original_amount: string;
  penalty_fee: string;
  net_refund_amount: string;
  refund_date: string;
  refund_method: RefundMethod;
  reason?: string;
  processed_by_name?: string;
  created_at: string;
}

export interface AgencyTicketLookup {
  id: string;
  pnr_number: string;
  agency_name: string;
  airline_name: string;
  total_tickets: number;
  total_price: string;
  status: TicketStatus;
  available_seats_to_refund: number;
  per_seat_cost: string;
  issue_date: string;
}

export interface TicketingSummaryKPI {
  total_tickets_issued: number;
  total_booking_volume: number | string;
  total_refunded_volume: number | string;
  total_penalties_deducted: number | string;
  total_refunded_seats: number;
  active_tickets_count: number;
  partially_refunded_count: number;
  fully_refunded_count: number;
  total_bookings_records: number;
}

export interface CreateAgencyTicketInput {
  agency_name: string;
  airline_name: string;
  pnr_number: string;
  total_tickets: number;
  issue_date?: string;
  total_price: number | string;
  notes?: string;
}

export interface ProcessRefundInput {
  ticket: string; // Ticket UUID
  refund_seats_count: number;
  original_amount?: number | string;
  penalty_fee: number | string;
  refund_date?: string;
  refund_method: RefundMethod;
  reason?: string;
}

export interface TicketFilters {
  search?: string;
  status?: string;
  agency?: string;
  airline?: string;
  date_from?: string;
  date_to?: string;
}

export interface RefundFilters {
  search?: string;
  refund_method?: string;
  ticket_id?: string;
  date_from?: string;
  date_to?: string;
}
