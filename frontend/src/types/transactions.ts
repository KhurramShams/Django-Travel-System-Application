/**
 * TypeScript domain models for the Central Master Transaction Ledger.
 */

export type LedgerSourceModule =
  | "ALL"
  | "CLIENT_PAYMENT"
  | "TICKET_PURCHASE"
  | "TICKET_REFUND"
  | "HOTEL_PAYMENT"
  | "OFFICE_PAYMENT"
  | "OFFICE_EXPENSE";

export type LedgerTransactionType = "ALL" | "CREDIT" | "DEBIT" | "TRANSFER";

export interface LedgerEntry {
  id: string;
  timestamp: string;
  date: string;
  source_module: LedgerSourceModule;
  description: string;
  transaction_type: "CREDIT" | "DEBIT" | "TRANSFER";
  amount: string;
  payment_mode?: string;
  account_or_bank?: string;
  party_name?: string;
  recorded_by?: string;
}

export interface LedgerPagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

export interface LedgerSummary {
  total_count: number;
  total_credit: string;
  total_debit: string;
  net_flow: string;
}

export interface LedgerResponse {
  success: boolean;
  pagination: LedgerPagination;
  summary: LedgerSummary;
  results: LedgerEntry[];
}

export interface LedgerFilters {
  start_date?: string;
  end_date?: string;
  source_module?: LedgerSourceModule | string;
  transaction_type?: LedgerTransactionType | string;
  payment_mode?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
