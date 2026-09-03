// API service layer
// All frontend calls to the backend go through this file.
// No page should ever construct its own fetch URL or handle raw errors independently.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dms_token') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorBody.error || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

// ============================================================
// DASHBOARD
// ============================================================
export const getDashboardData = () =>
  apiFetch<{
    kpis: Record<string, number>;
    recent_disasters: Record<string, unknown>[];
    shelter_stats: Record<string, unknown>[];
  }>('/dashboard');

// ============================================================
// DISASTERS
// ============================================================
export const getDisasters = () =>
  apiFetch<Record<string, unknown>[]>('/disasters');

export const getDisaster = (name: string) =>
  apiFetch<Record<string, unknown>>(`/disasters/${encodeURIComponent(name)}`);

export const createDisaster = (data: Record<string, unknown>) =>
  apiFetch('/disasters', { method: 'POST', body: JSON.stringify(data) });

export const updateDisaster = (name: string, data: Record<string, unknown>) =>
  apiFetch(`/disasters/${encodeURIComponent(name)}`, { method: 'PUT', body: JSON.stringify(data) });

// ============================================================
// VICTIMS
// ============================================================
export const getVictims = () =>
  apiFetch<Record<string, unknown>[]>('/victims');

export const getVictim = (id: string) =>
  apiFetch<Record<string, unknown>>(`/victims/${id}`);

export const createVictim = (data: Record<string, unknown>) =>
  apiFetch('/victims', { method: 'POST', body: JSON.stringify(data) });

// ============================================================
// SHELTERS
// ============================================================
export const getShelters = () =>
  apiFetch<Record<string, unknown>[]>('/shelters');

export const getShelter = (id: string) =>
  apiFetch<Record<string, unknown>>(`/shelters/${id}`);

export const createShelter = (data: Record<string, unknown>) =>
  apiFetch('/shelters', { method: 'POST', body: JSON.stringify(data) });

export const checkInVictim = (data: { victim_id: string; shelter_id: string; checkin_date?: string }) =>
  apiFetch('/shelters/checkin', { method: 'POST', body: JSON.stringify(data) });

export const checkOutVictim = (data: { victim_id: string; shelter_id: string; checkout_date?: string }) =>
  apiFetch('/shelters/checkout', { method: 'POST', body: JSON.stringify(data) });

export const getVictimStays = (victim_id: string) =>
  apiFetch<Record<string, unknown>[]>(`/shelters/stays/${victim_id}`);

// ============================================================
// WAREHOUSES
// ============================================================
export const getWarehouses = () =>
  apiFetch<Record<string, unknown>[]>('/warehouses');

export const createWarehouse = (data: Record<string, unknown>) =>
  apiFetch('/warehouses', { method: 'POST', body: JSON.stringify(data) });

// ============================================================
// VEHICLES
// ============================================================
export const getVehicles = () =>
  apiFetch<Record<string, unknown>[]>('/vehicles');

export const createVehicle = (data: Record<string, unknown>) =>
  apiFetch('/vehicles', { method: 'POST', body: JSON.stringify(data) });

export const stationVehicle = (data: { vehicle_id: string; warehouse_id: string }) =>
  apiFetch('/vehicles/station', { method: 'POST', body: JSON.stringify(data) });

export const unstationVehicle = (data: { vehicle_id: string }) =>
  apiFetch('/vehicles/station', { method: 'DELETE', body: JSON.stringify(data) });

// ============================================================
// DONATIONS
// ============================================================
export const getDonations = () =>
  apiFetch<Record<string, unknown>[]>('/donations');

export const createDonation = (data: Record<string, unknown>) =>
  apiFetch('/donations', { method: 'POST', body: JSON.stringify(data) });

// ============================================================
// DISTRIBUTIONS (Relief)
// ============================================================
export const getDistributions = () =>
  apiFetch<Record<string, unknown>[]>('/distributions');

export const createDistribution = (data: Record<string, unknown>) =>
  apiFetch('/distributions', { method: 'POST', body: JSON.stringify(data) });

// ============================================================
// PERSONNEL
// ============================================================
export const getPersonnel = () =>
  apiFetch<Record<string, unknown>[]>('/personnel');

export const getVolunteers = () =>
  apiFetch<Record<string, unknown>[]>('/personnel/volunteers');

export const getMedicalStaff = () =>
  apiFetch<Record<string, unknown>[]>('/personnel/medical');

export const createPersonnel = (data: Record<string, unknown>) =>
  apiFetch('/personnel', { method: 'POST', body: JSON.stringify(data) });

export const deployPersonnel = (data: { person_id: string; shelter_id: string; start_date?: string }) =>
  apiFetch('/personnel/deploy', { method: 'POST', body: JSON.stringify(data) });

export const undeployPersonnel = (data: { person_id: string; shelter_id: string; end_date?: string }) =>
  apiFetch('/personnel/deploy', { method: 'DELETE', body: JSON.stringify(data) });

export const getPersonnelDeployments = (person_id: string) =>
  apiFetch<Record<string, unknown>[]>(`/personnel/deploy/${person_id}`);

// ============================================================
// SYSTEM STATUS
// ============================================================
export const getSystemStatus = () =>
  apiFetch<{ backend: boolean; database: boolean; db_message: string }>('/status');

