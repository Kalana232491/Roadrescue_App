/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') ?? localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'provider' | 'recipient';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  username: string;
  phone: string;
  password: string;
  password2: string;
  role: 'provider' | 'recipient';
}

export interface LoginData {
  usernameOrPhone: string;
  password: string;
}

export interface ProviderSearchResult {
  id: number;
  display_name: string;
  about?: string;
  phone_public: string;
  lat?: number;
  lng?: number;
  address_text?: string;
  status: 'pending' | 'approved' | 'rejected';
  types: string[];
  images: string[];
  avg_rating: number;
  reviews_count: number;
  distance_km?: number;
}

export interface ProviderProfileDetail {
  id: number;
  user_id: number;
  display_name: string;
  about?: string | null;
  phone_public: string;
  lat: number | null;
  lng: number | null;
  address_text?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  types: string[];
  images: string[];
  created_at: string;
  updated_at: string;
  username?: string;
  phone?: string;
}

export interface AdminProviderProfile extends ProviderProfileDetail {
  username: string;
  phone: string;
}

export interface AdminUserSummary {
  id: number;
  username: string;
  phone: string;
  role: User['role'];
  created_at: string;
}

// Auth API
export const auth = {
  register: (data: RegisterData) => api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginData) => api.post<AuthResponse>('/auth/login', data),
};

// Provider API
export const providers = {
  getMyProfile: () => api.get<ProviderProfileDetail | null>('/providers/me'),
  upsertProfile: (data: any) => api.post<ProviderProfileDetail>('/providers/upsert', data),
};

// Admin API
export const admin = {
  listUsers: () => api.get<AdminUserSummary[]>('/admin/users'),
  createAdminUser: (data: { username: string; phone: string; password: string; password2: string }) =>
    api.post<AdminUserSummary>('/admin/users', data),
  getProviderProfiles: (params?: { status?: 'pending' | 'approved' | 'rejected' }) =>
    api.get<AdminProviderProfile[]>('/admin/provider-profiles', { params }),
  updateProviderStatus: (data: { profile_id: number; status: 'pending' | 'approved' | 'rejected' }) =>
    api.post<AdminProviderProfile>('/admin/provider-status', data),
};

// Search API
export const search = {
  nearby: (params: { type: string; lat: number; lng: number; radius_km?: number }) =>
    api.get<ProviderSearchResult[]>('/search/nearby', { params }),
};

// Reviews API
export const reviews = {
  getReviews: (providerId: number) => api.get(`/reviews/${providerId}`),
  postReview: (providerId: number, data: { rating: number; comment?: string }) =>
    api.post(`/reviews/${providerId}`, data),
};

export default api;
