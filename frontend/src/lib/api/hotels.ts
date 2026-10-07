import { api } from "@/lib/api/client";
import {
  HotelBooking,
  HotelPayment,
  HotelSummaryKPI,
  CreateHotelBookingPayload,
  UpdateHotelBookingPayload,
  AddRemainingPayload,
} from "@/types/hotels";

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

export interface HotelFilters {
  search?: string;
  status?: string;
  location?: string;
  include_inactive?: boolean;
}

export const hotelsApi = {
  list: (params?: HotelFilters): Promise<HotelBooking[]> =>
    api.get<unknown>("/hotels/", params as Record<string, unknown>).then((res) => extractResults<HotelBooking>(res)),

  get: (id: string): Promise<HotelBooking> =>
    api.get<HotelBooking>(`/hotels/${id}/`),

  create: (data: CreateHotelBookingPayload): Promise<HotelBooking> =>
    api.post<HotelBooking>("/hotels/", data),

  update: (id: string, data: UpdateHotelBookingPayload): Promise<HotelBooking> =>
    api.patch<HotelBooking>(`/hotels/${id}/`, data),

  delete: (id: string, force = false): Promise<void> =>
    api.delete<void>(`/hotels/${id}/${force ? "?force=true" : ""}`),

  addPayment: (
    id: string,
    data: AddRemainingPayload
  ): Promise<{ message: string; payment: HotelPayment; booking: HotelBooking }> =>
    api.post<{ message: string; payment: HotelPayment; booking: HotelBooking }>(`/hotels/${id}/add-payment/`, data),

  getSummary: (): Promise<HotelSummaryKPI> =>
    api.get<HotelSummaryKPI>("/hotels/summary/"),
};
