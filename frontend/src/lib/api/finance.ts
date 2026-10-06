import { api } from "@/lib/api/client";
import {
  AddPaymentAmountInput,
  BankAccount,
  CreateBankAccountInput,
  CreateOfficeExpenseInput,
  CreateOfficePaymentInput,
  DailyExpenseSummary,
  ExpenseFilters,
  ExpenseReportData,
  OfficeExpense,
  OfficePayment,
  OfficePaymentAdjustment,
  PaymentFilters,
  UpdateOfficePaymentInput,
} from "@/types/finance";

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

// Operating Bank Accounts
export const bankAccountsApi = {
  list: (params?: { include_inactive?: boolean }): Promise<BankAccount[]> =>
    api
      .get<unknown>("/finance/accounts/", params as Record<string, unknown>)
      .then((res) => extractResults<BankAccount>(res)),

  get: (id: string): Promise<BankAccount> =>
    api.get<BankAccount>(`/finance/accounts/${id}/`),

  create: (data: CreateBankAccountInput): Promise<BankAccount> =>
    api.post<BankAccount>("/finance/accounts/", data),

  update: (id: string, data: Partial<CreateBankAccountInput>): Promise<BankAccount> =>
    api.patch<BankAccount>(`/finance/accounts/${id}/`, data),

  delete: (id: string): Promise<void> =>
    api.delete<void>(`/finance/accounts/${id}/`),
};

// Office Banking Payments (Screens 11 & 12)
export const officePaymentsApi = {
  list: (params?: PaymentFilters): Promise<OfficePayment[]> =>
    api
      .get<unknown>("/finance/payments/", params as Record<string, unknown>)
      .then((res) => extractResults<OfficePayment>(res)),

  get: (id: string): Promise<OfficePayment> =>
    api.get<OfficePayment>(`/finance/payments/${id}/`),

  create: (data: CreateOfficePaymentInput): Promise<OfficePayment> =>
    api.post<OfficePayment>("/finance/payments/", data),

  update: (id: string, data: UpdateOfficePaymentInput): Promise<OfficePayment> =>
    api.patch<OfficePayment>(`/finance/payments/${id}/`, data),

  delete: (id: string): Promise<void> =>
    api.delete<void>(`/finance/payments/${id}/`),

  addAmount: (
    id: string,
    data: AddPaymentAmountInput
  ): Promise<{ message: string; adjustment: OfficePaymentAdjustment; payment: OfficePayment }> =>
    api.post<{ message: string; adjustment: OfficePaymentAdjustment; payment: OfficePayment }>(
      `/finance/payments/${id}/add-amount/`,
      data
    ),

  lookup: (q: string): Promise<OfficePayment[]> =>
    api
      .get<unknown>("/finance/payments/lookup/", { q })
      .then((res) => extractResults<OfficePayment>(res)),
};

// Daily Operational Expenses (Screen 13)
export const officeExpensesApi = {
  list: (params?: ExpenseFilters): Promise<OfficeExpense[]> =>
    api
      .get<unknown>("/finance/expenses/", params as Record<string, unknown>)
      .then((res) => extractResults<OfficeExpense>(res)),

  get: (id: string): Promise<OfficeExpense> =>
    api.get<OfficeExpense>(`/finance/expenses/${id}/`),

  create: (data: CreateOfficeExpenseInput): Promise<OfficeExpense> =>
    api.post<OfficeExpense>("/finance/expenses/", data),

  update: (id: string, data: Partial<CreateOfficeExpenseInput>): Promise<OfficeExpense> =>
    api.patch<OfficeExpense>(`/finance/expenses/${id}/`, data),

  delete: (id: string): Promise<void> =>
    api.delete<void>(`/finance/expenses/${id}/`),

  dailySummary: (date?: string): Promise<DailyExpenseSummary> =>
    api.get<DailyExpenseSummary>("/finance/expenses/daily-summary/", { date }),

  report: (date?: string): Promise<ExpenseReportData> =>
    api.get<ExpenseReportData>("/finance/expenses/report/", { date }),
};
