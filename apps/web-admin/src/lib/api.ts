const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Fetch wrapper for the Anvix API.
 * Automatically adds auth token and handles JSON responses.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

/** Platform API methods */
export const api = {
  // Plans
  getPlans: () => apiFetch<Plan[]>('/platform/plans'),
  getPlan: (id: string) => apiFetch<Plan>(`/platform/plans/${id}`),
  createPlan: (data: CreatePlanInput) =>
    apiFetch<Plan>('/platform/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: string, data: Partial<CreatePlanInput>) =>
    apiFetch<Plan>(`/platform/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (id: string) => apiFetch<Plan>(`/platform/plans/${id}`, { method: 'DELETE' }),

  // Tenants
  getTenants: () => apiFetch<Tenant[]>('/platform/tenants'),
  getTenant: (id: string) => apiFetch<Tenant>(`/platform/tenants/${id}`),
  updateTenantStatus: (id: string, status: string, reason?: string) =>
    apiFetch<Tenant>(`/platform/tenants/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),
  deleteTenant: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/platform/tenants/${id}`, { method: 'DELETE' }),
  provisionTenant: (id: string) =>
    apiFetch<Tenant>(`/platform/tenants/${id}/provision`, { method: 'POST' }),
};

// Types matching the API responses
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceInPaise: number;
  billingCycle: string;
  maxStudents: number;
  smsQuota: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  board: string;
  principalName: string;
  principalPhone: string;
  email: string;
  subdomain: string;
  schemaName: string | null;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  name: string;
  description?: string;
  priceInPaise: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  maxStudents: number;
  smsQuota?: number;
  features?: string[];
}
