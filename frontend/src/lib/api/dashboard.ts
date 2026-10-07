import { api } from "@/lib/api/client";
import {
  DashboardMetrics,
  DashboardMetricsParams,
  MonthlyCashflowItem,
  PackageOccupancyItem,
  ReceivablesBreakdown,
} from "@/types/dashboard";

export const dashboardApi = {
  getMetrics: (params?: DashboardMetricsParams): Promise<DashboardMetrics> =>
    api
      .get<{ success: boolean; metrics: DashboardMetrics }>(
        "/dashboard/metrics/",
        params as Record<string, unknown>
      )
      .then((res) => res.metrics),

  getMonthlyCashflow: (months: number = 6): Promise<MonthlyCashflowItem[]> =>
    api
      .get<{ success: boolean; data: MonthlyCashflowItem[] }>(
        "/dashboard/charts/monthly-cashflow/",
        { months }
      )
      .then((res) => res.data),

  getPackageDistribution: (): Promise<PackageOccupancyItem[]> =>
    api
      .get<{ success: boolean; data: PackageOccupancyItem[] }>(
        "/dashboard/charts/package-distribution/"
      )
      .then((res) => res.data),

  getReceivablesBreakdown: (): Promise<ReceivablesBreakdown> =>
    api
      .get<{ success: boolean; data: ReceivablesBreakdown }>(
        "/dashboard/charts/receivables-breakdown/"
      )
      .then((res) => res.data),
};
