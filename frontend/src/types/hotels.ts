/**
 * TypeScript domain models for Hotel Bookings, Accommodations, and Settlement Ledgers.
 */

export type HotelLocation = "MAKKAH" | "MADINAH" | "OTHER";

export type HotelPaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export type HotelPaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE";

export interface HotelPayment {
  id: string;
  hotel_booking: string;
  booking_reference?: string;
  hotel_name?: string;
  amount: string;
  payment_date: string;
  payment_method: HotelPaymentMethod;
  receipt_number: string;
  reference_number?: string;
  notes?: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface HotelBooking {
  id: string;
  booking_reference: string;
  hotel_name: string;
  location: HotelLocation;
  booking_date: string;
  check_in?: string | null;
  check_out?: string | null;
  room_details?: string;
  total_price: string;
  advance_paid: string;
  remaining_amount: string;
  payment_status: HotelPaymentStatus;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  payments_count?: number;
  payments?: HotelPayment[];
  created_at: string;
  updated_at?: string;
}

export interface CreateHotelBookingPayload {
  hotel_name: string;
  location: HotelLocation;
  booking_date: string;
  check_in?: string;
  check_out?: string;
  room_details?: string;
  total_price: number | string;
  advance_paid: number | string;
  payment_method?: HotelPaymentMethod;
  reference_number?: string;
  notes?: string;
}

export interface UpdateHotelBookingPayload {
  hotel_name?: string;
  location?: HotelLocation;
  booking_date?: string;
  check_in?: string;
  check_out?: string;
  room_details?: string;
  total_price?: number | string;
  notes?: string;
}

export interface AddRemainingPayload {
  amount: number | string;
  payment_date?: string;
  payment_method?: HotelPaymentMethod;
  reference_number?: string;
  notes?: string;
}

export interface HotelSummaryKPI {
  total_contracted: string | number;
  total_advance_paid: string | number;
  total_remaining: string | number;
  total_count: number;
  remaining_count: number;
  paid_count: number;
}
