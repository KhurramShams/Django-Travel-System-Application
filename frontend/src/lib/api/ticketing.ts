import { api } from "@/lib/api/client";
import {
  AgencyTicket,
  TicketRefund,
  AgencyTicketLookup,
  TicketingSummaryKPI,
  CreateAgencyTicketInput,
  ProcessRefundInput,
  TicketFilters,
  RefundFilters,
} from "@/types/ticketing";

function extractResults<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (
    response &&
    typeof response === "object" &&
    "results" in response &&
    Array.isArray((response as { results: unknown }).results)
  ) {
    return (response as { results: T[] }).results;
  }
  return [];
}

// Agency Tickets API
export const ticketsApi = {
  list: (params?: TicketFilters): Promise<AgencyTicket[]> =>
    api.get<unknown>("/tickets/", params as Record<string, unknown>).then((res) => extractResults<AgencyTicket>(res)),

  get: (id: string): Promise<AgencyTicket> =>
    api.get<AgencyTicket>(`/tickets/${id}/`),

  create: (data: CreateAgencyTicketInput): Promise<AgencyTicket> =>
    api.post<AgencyTicket>("/tickets/", data),

  update: (id: string, data: Partial<CreateAgencyTicketInput>): Promise<AgencyTicket> =>
    api.patch<AgencyTicket>(`/tickets/${id}/`, data),

  delete: (id: string): Promise<void> =>
    api.delete<void>(`/tickets/${id}/`),

  lookup: (query: string): Promise<AgencyTicketLookup[]> =>
    api.get<unknown>("/tickets/lookup/", { q: query }).then((res) => extractResults<AgencyTicketLookup>(res)),

  getAnalyticsSummary: (): Promise<TicketingSummaryKPI> =>
    api.get<TicketingSummaryKPI>("/tickets/analytics/summary/"),
};

// Ticket Refunds API
export const refundsApi = {
  list: (params?: RefundFilters): Promise<TicketRefund[]> =>
    api.get<unknown>("/tickets/refunds/", params as Record<string, unknown>).then((res) => extractResults<TicketRefund>(res)),

  get: (id: string): Promise<TicketRefund> =>
    api.get<TicketRefund>(`/tickets/refunds/${id}/`),

  create: (data: ProcessRefundInput): Promise<TicketRefund> =>
    api.post<TicketRefund>("/tickets/refunds/", data),
};
