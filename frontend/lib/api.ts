import type {
  User,
  Patient,
  PatientCreate,
  Appointment,
  AppointmentCreate,
  ClinicalSession,
  ClinicalSessionCreate,
  Diagnosis,
  DiagnosisCreate,
  Invoice,
  InvoiceCreate,
  Expense,
  ExpenseCreate,
  DashboardStats,
  FinancialSummary,
  AuthToken,
} from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth
export async function login(email: string, password: string): Promise<AuthToken> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    let errorMessage = 'Credenciales incorrectas';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/api/auth/me');
}

// Patients
export async function getPatients(
  search?: string,
  skip = 0,
  limit = 50
): Promise<Patient[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());
  return apiFetch<Patient[]>(`/api/patients?${params.toString()}`);
}

export async function createPatient(data: PatientCreate): Promise<Patient> {
  return apiFetch<Patient>('/api/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPatient(id: number): Promise<Patient> {
  return apiFetch<Patient>(`/api/patients/${id}`);
}

export async function updatePatient(
  id: number,
  data: Partial<PatientCreate>
): Promise<Patient> {
  return apiFetch<Patient>(`/api/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: number): Promise<void> {
  return apiFetch<void>(`/api/patients/${id}`, {
    method: 'DELETE',
  });
}

// Appointments
export async function getAppointments(params?: {
  patient_id?: number;
  therapist_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}): Promise<Appointment[]> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  return apiFetch<Appointment[]>(`/api/appointments?${searchParams.toString()}`);
}

export async function createAppointment(data: AppointmentCreate): Promise<Appointment> {
  return apiFetch<Appointment>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(
  id: number,
  data: Partial<AppointmentCreate>
): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAppointment(id: number): Promise<void> {
  return apiFetch<void>(`/api/appointments/${id}`, {
    method: 'DELETE',
  });
}

// Clinical Sessions
export async function getClinicalSessions(patientId?: number): Promise<ClinicalSession[]> {
  const params = new URLSearchParams();
  if (patientId) params.append('patient_id', patientId.toString());
  return apiFetch<ClinicalSession[]>(`/api/clinical/sessions?${params.toString()}`);
}

export async function createClinicalSession(data: ClinicalSessionCreate): Promise<ClinicalSession> {
  return apiFetch<ClinicalSession>('/api/clinical/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClinicalSession(
  id: number,
  data: Partial<ClinicalSessionCreate>
): Promise<ClinicalSession> {
  return apiFetch<ClinicalSession>(`/api/clinical/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Diagnoses
export async function getDiagnoses(patientId?: number): Promise<Diagnosis[]> {
  const params = new URLSearchParams();
  if (patientId) params.append('patient_id', patientId.toString());
  return apiFetch<Diagnosis[]>(`/api/clinical/diagnoses?${params.toString()}`);
}

export async function createDiagnosis(data: DiagnosisCreate): Promise<Diagnosis> {
  return apiFetch<Diagnosis>('/api/clinical/diagnoses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Invoices
export async function getInvoices(params?: {
  patient_id?: number;
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<Invoice[]> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  return apiFetch<Invoice[]>(`/api/billing/invoices?${searchParams.toString()}`);
}

export async function createInvoice(data: InvoiceCreate): Promise<Invoice> {
  return apiFetch<Invoice>('/api/billing/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvoice(id: number, data: Partial<InvoiceCreate & { status: string }>): Promise<Invoice> {
  return apiFetch<Invoice>(`/api/billing/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Expenses
export async function getExpenses(params?: {
  category?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}): Promise<Expense[]> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  return apiFetch<Expense[]>(`/api/billing/expenses?${searchParams.toString()}`);
}

export async function createExpense(data: ExpenseCreate): Promise<Expense> {
  return apiFetch<Expense>('/api/billing/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Financial Summary
export async function getFinancialSummary(year: number, month: number): Promise<FinancialSummary> {
  return apiFetch<FinancialSummary>(`/api/billing/summary?year=${year}&month=${month}`);
}

// Dashboard
export async function getDashboard(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/dashboard');
}
