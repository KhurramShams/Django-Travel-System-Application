import { api } from "@/lib/api/client";
import { LedgerFilters, LedgerResponse } from "@/types/transactions";

export const transactionsApi = {
  list: (params?: LedgerFilters): Promise<LedgerResponse> =>
    api.get<LedgerResponse>("/transactions/", params as Record<string, unknown>),
};
