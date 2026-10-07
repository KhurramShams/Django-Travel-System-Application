/**
 * Domain TypeScript types for Module 2: Travelers, Packages, Enrollments, and Payments.
 */

export type AgeCategory = "ADULT" | "CHILD" | "INFANT";

export interface TravelerDependent {
  id: string;
  full_name: string;
  cnic: string;
  age_category: AgeCategory;
  phone_number: string;
  passport_number?: string | null;
}

export interface TravelerGuardian {
  id: string;
  full_name: string;
  cnic: string;
  phone_number: string;
}

export interface Traveler {
  id: string;
  full_name: string;
  cnic: string;
  phone_number: string;
  passport_number?: string | null;
  age_category: AgeCategory;
  guardian?: string | null;
  guardian_details?: TravelerGuardian | null;
  dependents?: TravelerDependent[];
  address?: string;
  emergency_contact?: string;
  notes?: string;
  has_active_package?: boolean;
  active_package_title?: string | null;
  active_enrollment_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TravelerLookup {
  id: string;
  full_name: string;
  cnic: string;
  phone_number: string;
  age_category: AgeCategory;
  passport_number?: string | null;
  guardian_name?: string | null;
  has_active_package: boolean;
  active_package_title?: string | null;
}

export type LocationChoice = "MAKKAH" | "MADINAH" | "MAKKAH_MADINAH";
export type StarRating = "3_STAR" | "4_STAR" | "5_STAR";
export type PackageStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface TravelPackage {
  id: string;
  title: string;
  package_code: string;
  location: LocationChoice;
  star_rating: StarRating;
  shuttle_service: boolean;
  flight_name: string;
  departure_date: string;
  return_date: string;
  adult_price: string;
  child_price: string;
  infant_price: string;
  capacity: number;
  status: PackageStatus;
  description: string;
  duration_days: number;
  total_enrolled: number;
  seats_available: number;
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export interface PackageEnrollment {
  id: string;
  enrollment_number: string;
  traveler_id: string;
  traveler_name: string;
  traveler_cnic: string;
  traveler_phone: string;
  traveler_passport?: string;
  traveler_age_category: AgeCategory;
  package_id: string;
  package_title: string;
  package_code: string;
  departure_date: string;
  enrolled_date: string;
  base_price_applied: string;
  extra_amount: string;
  discount: string;
  final_agreed_price: string;
  total_paid: string;
  remaining_balance: string;
  payment_status: PaymentStatus;
  status: EnrollmentStatus;
}

export interface PackageEnrollmentDetail {
  id: string;
  enrollment_number: string;
  traveler: Traveler;
  package: TravelPackage;
  enrolled_date: string;
  base_price_applied: string;
  extra_amount: string;
  discount: string;
  final_agreed_price: string;
  total_paid: string;
  remaining_balance: string;
  payment_status: PaymentStatus;
  status: EnrollmentStatus;
  special_requests?: string;
  payments: TravelerPayment[];
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE";

export interface TravelerPayment {
  id: string;
  receipt_number: string;
  enrollment: string;
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string;
  recorded_by?: string;
  recorded_by_name?: string | null;
  traveler_name?: string;
  enrollment_number?: string;
  created_at: string;
}

export interface BalanceReportItem {
  enrollment_id: string;
  enrollment_number: string;
  traveler_id: string;
  traveler_name: string;
  traveler_cnic: string;
  traveler_phone: string;
  package_title: string;
  package_code: string;
  departure_date: string;
  final_agreed_price: string;
  total_paid: string;
  remaining_balance?: string;
  payment_status?: string;
  status?: string;
}

export interface BalancesReportResponse {
  count: number;
  total_outstanding_amount?: string;
  total_settled_revenue?: string;
  results: BalanceReportItem[];
}

export interface InvoiceData {
  agency: {
    name: string;
    tagline: string;
    contact: string;
    address: string;
  };
  invoice: {
    enrollment_number: string;
    issue_date: string;
    enrolled_date: string;
    status: string;
    payment_status: string;
  };
  traveler: {
    id: string;
    full_name: string;
    cnic: string;
    phone_number: string;
    passport_number: string;
    age_category: string;
    guardian: string | null;
    dependents: Array<{
      full_name: string;
      cnic: string;
      age_category: string;
      passport_number: string;
    }>;
  };
  package: {
    id: string;
    title: string;
    package_code: string;
    location: string;
    star_rating: string;
    flight_name: string;
    departure_date: string;
    return_date: string;
    duration_days: number;
    shuttle_service: boolean;
  };
  financials: {
    base_price_applied: string;
    extra_amount: string;
    discount: string;
    final_agreed_price: string;
    total_paid: string;
    remaining_balance: string;
    is_fully_paid: boolean;
  };
  payments_history: Array<{
    receipt_number: string;
    amount: string;
    payment_date: string;
    payment_method: string;
    reference_number: string;
    notes: string;
  }>;
}
