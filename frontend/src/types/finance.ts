/**
 * TypeScript domain models for Banking, Office Payments, Adjustments, and Operational Expenses.
 */

export type TransactionType = "CREDIT" | "DEBIT" | "TRANSFER";

export type PaymentMode = "CASH" | "ONLINE_TRANSFER" | "CHEQUE" | "DEPOSIT_SLIP";

export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "SALARIES"
  | "REFRESHMENTS"
  | "OFFICE_SUPPLIES"
  | "MAINTENANCE"
  | "MARKETING"
  | "OTHER";

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code?: string;
  current_balance: string;
  is_active: boolean;
  payments_count?: number;
  created_by_name?: string;
  created_at: string;
}

export interface CreateBankAccountInput {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_code?: string;
}

export interface OfficePaymentAdjustment {
  id: string;
  office_payment: string;
  payment_reference?: string;
  added_amount: string;
  adjustment_date: string;
  notes?: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface OfficePayment {
  id: string;
  payment_reference: string;
  person_name: string;
  bank: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  transaction_type: TransactionType;
  payment_mode: PaymentMode;
  amount: string;
  payment_date: string;
  notes?: string;
  is_active: boolean;
  adjustments_count?: number;
  adjustments?: OfficePaymentAdjustment[];
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateOfficePaymentInput {
  person_name: string;
  bank: string;
  transaction_type: TransactionType;
  payment_mode: PaymentMode;
  amount: number | string;
  payment_date: string;
  notes?: string;
}

export interface UpdateOfficePaymentInput {
  person_name?: string;
  payment_mode?: PaymentMode;
  payment_date?: string;
  notes?: string;
}

export interface AddPaymentAmountInput {
  added_amount: number | string;
  adjustment_date?: string;
  notes?: string;
}

export interface PaymentFilters {
  search?: string;
  bank?: string;
  transaction_type?: string;
  payment_mode?: string;
  payment_date?: string;
  start_date?: string;
  end_date?: string;
}

export interface OfficeExpense {
  id: string;
  expense_reference: string;
  person_name: string;
  item_name: string;
  category: ExpenseCategory;
  amount: string;
  expense_date: string;
  payment_mode: PaymentMode;
  notes?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface CreateOfficeExpenseInput {
  person_name: string;
  item_name: string;
  category: ExpenseCategory;
  amount: number | string;
  expense_date: string;
  payment_mode: PaymentMode;
  notes?: string;
}

export interface ExpenseFilters {
  search?: string;
  category?: string;
  expense_date?: string;
  start_date?: string;
  end_date?: string;
}

export interface DailyExpenseSummary {
  date: string;
  total_amount: string | number;
  total_items: number;
  category_breakdown: Array<{
    category: ExpenseCategory;
    category_total: string | number;
    count: number;
  }>;
}

export interface ExpenseReportData {
  date: string;
  total_amount: string | number;
  total_items: number;
  expenses: OfficeExpense[];
}
