import { api } from "@/lib/api/client";
import {
  Traveler,
  TravelerLookup,
  TravelPackage,
  PackageEnrollment,
  PackageEnrollmentDetail,
  TravelerPayment,
  BalancesReportResponse,
  InvoiceData,
} from "@/types/travel";

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

// Travelers API
export const travelersApi = {
  list: (params?: { search?: string; age_category?: string; has_guardian?: string }): Promise<Traveler[]> =>
    api.get<unknown>("/travelers/", params).then((res) => extractResults<Traveler>(res)),

  get: (id: string) =>
    api.get<Traveler>(`/travelers/${id}/`),

  create: (data: Partial<Traveler>) =>
    api.post<Traveler>("/travelers/", data),

  update: (id: string, data: Partial<Traveler>) =>
    api.patch<Traveler>(`/travelers/${id}/`, data),

  delete: (id: string) =>
    api.delete<void>(`/travelers/${id}/`),

  lookup: (query: string): Promise<TravelerLookup[]> =>
    api.get<unknown>("/travelers/lookup/", { q: query }).then((res) => extractResults<TravelerLookup>(res)),

  history: (id: string) =>
    api.get<{ traveler: Traveler; enrollments: unknown[] }>(`/travelers/${id}/history/`),
};

// Packages API
export const packagesApi = {
  list: (params?: { search?: string; status?: string; location?: string; star_rating?: string }): Promise<TravelPackage[]> =>
    api.get<unknown>("/packages/", params).then((res) => extractResults<TravelPackage>(res)),

  get: (id: string) =>
    api.get<TravelPackage>(`/packages/${id}/`),

  create: (data: Partial<TravelPackage>) =>
    api.post<TravelPackage>("/packages/", data),

  update: (id: string, data: Partial<TravelPackage>) =>
    api.patch<TravelPackage>(`/packages/${id}/`, data),

  archive: (id: string) =>
    api.delete<void>(`/packages/${id}/`),

  delete: (id: string, force?: boolean): Promise<void> =>
    api.delete<void>(`/packages/${id}/${force ? "?force=true" : ""}`),

  roster: (id: string) =>
    api.get<{
      package_id: string;
      package_title: string;
      package_code: string;
      capacity: number;
      total_enrolled: number;
      seats_available: number;
      roster: PackageEnrollment[];
    }>(`/packages/${id}/roster/`),
};

// Enrollments API
export const enrollmentsApi = {
  list: (params?: { package_id?: string; traveler_id?: string; status?: string; search?: string }): Promise<PackageEnrollment[]> =>
    api.get<unknown>("/enrollments/", params).then((res) => extractResults<PackageEnrollment>(res)),

  get: (id: string) =>
    api.get<PackageEnrollmentDetail>(`/enrollments/${id}/`),

  create: (data: {
    traveler: string;
    package: string;
    enrolled_date?: string;
    extra_amount?: number | string;
    discount?: number | string;
    special_requests?: string;
  }) =>
    api.post<PackageEnrollmentDetail>("/enrollments/", data),

  delete: (id: string, force?: boolean): Promise<void> =>
    api.delete<void>(`/enrollments/${id}/${force ? "?force=true" : ""}`),

  cancel: (id: string) =>
    api.post<{ success: boolean; message: string }>(`/enrollments/${id}/cancel/`),

  invoice: (id: string) =>
    api.get<InvoiceData>(`/enrollments/${id}/invoice/`),
};

// Payments & Financial Reports API
export const paymentsApi = {
  list: (params?: { enrollment_id?: string; payment_method?: string; search?: string }): Promise<TravelerPayment[]> =>
    api.get<unknown>("/payments/", params).then((res) => extractResults<TravelerPayment>(res)),

  record: (data: {
    enrollment: string;
    amount: number | string;
    payment_date?: string;
    payment_method: string;
    reference_number?: string;
    notes?: string;
  }) =>
    api.post<TravelerPayment>("/payments/", data),

  getRemainingBalances: () =>
    api.get<BalancesReportResponse>("/reports/balances/remaining/"),

  getSettledBalances: () =>
    api.get<BalancesReportResponse>("/reports/balances/settled/"),
};
