/**
 * Authentication and Role-Based Access Control type definitions.
 */

export type UserRole = "Admin" | "Agent" | "Accountant";

export interface UserProfile {
  id: string;
  supabase_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface ApiResponse<T> {
  success: boolean;
  results?: T;
  data?: T;
  pagination?: {
    count: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    next: string | null;
    previous: string | null;
  };
  error?: {
    status_code: number;
    code: string;
    message: string;
    details: unknown;
  };
}
