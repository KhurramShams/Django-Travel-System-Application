/**
 * TypeScript definitions for executive dashboard metrics and visual analytics.
 */

export interface SecondaryMetrics {
  bank_liquidity: string;
  active_packages: number;
  issued_tickets_count: number;
  hotel_bookings_count: number;
}

export interface DashboardMetricsParams {
  start_date?: string;
  end_date?: string;
}

export interface DashboardMetrics {
  total_customers: number;
  received_amount: string;
  remaining_amount: string;
  today_expense: string;
  secondary: SecondaryMetrics;
}

export interface MonthlyCashflowItem {
  month: string;
  label: string;
  inflow: number;
  outflow: number;
  net_margin: number;
}

export interface PackageOccupancyItem {
  id: string;
  title: string;
  package_code: string;
  capacity: number;
  enrolled: number;
  occupancy_rate: number;
  departure_date: string | null;
}

export interface ReceivablesStatusItem {
  count: number;
  amount: string;
}

export interface ReceivablesBreakdown {
  paid: ReceivablesStatusItem;
  partial: ReceivablesStatusItem;
  unpaid: ReceivablesStatusItem;
  total_active_enrollments: number;
}
