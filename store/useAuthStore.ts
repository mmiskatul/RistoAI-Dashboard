import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  phone?: string | null;
  preferred_language?: string;
  is_active?: boolean;
  email_verified?: boolean;
  restaurant_name?: string | null;
  location?: string | null;
  subscription_plan_name?: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  account_status?: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_selection_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Clear tokens from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Clear token from cookie
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      },
    }),
    {
      name: 'auth-storage', // unique name
    }
  )
);
