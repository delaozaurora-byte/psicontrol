export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'therapist' | 'receptionist';
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  rut_dni: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  insurance: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  full_name: string;
  email?: string;
  phone?: string;
  rut_dni?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  insurance?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'initial' | 'followup' | 'evaluation' | 'discharge' | 'other';

export interface Appointment {
  id: number;
  patient_id: number;
  therapist_id: number;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  fee: number | null;
  notes: string | null;
  patient?: Patient;
  therapist?: User;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  patient_id: number;
  therapist_id: number;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  fee?: number;
  notes?: string;
}

export type SessionModality = 'in_person' | 'online' | 'phone';

export interface ClinicalSession {
  id: number;
  patient_id: number;
  therapist_id: number;
  appointment_id: number | null;
  session_number: number;
  session_date: string;
  modality: SessionModality;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  summary: string | null;
  patient?: Patient;
  therapist?: User;
  created_at: string;
  updated_at: string;
}

export interface ClinicalSessionCreate {
  patient_id: number;
  therapist_id: number;
  appointment_id?: number;
  session_date: string;
  modality?: SessionModality;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  summary?: string;
}

export interface Diagnosis {
  id: number;
  patient_id: number;
  therapist_id: number;
  code: string | null;
  description: string;
  date_diagnosed: string;
  is_primary: boolean;
  notes: string | null;
  patient?: Patient;
  therapist?: User;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisCreate {
  patient_id: number;
  therapist_id: number;
  code?: string;
  description: string;
  date_diagnosed: string;
  is_primary?: boolean;
  notes?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  therapist_id: number | null;
  issue_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  items: InvoiceItem[];
  patient?: Patient;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  patient_id: number;
  therapist_id?: number;
  issue_date: string;
  due_date?: string;
  status?: InvoiceStatus;
  notes?: string;
  items: Omit<InvoiceItem, 'id' | 'subtotal'>[];
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  is_deductible: boolean;
  receipt_url: string | null;
  notes: string | null;
  created_by_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCreate {
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  is_deductible?: boolean;
  notes?: string;
}

export interface DashboardStats {
  total_patients: number;
  active_patients: number;
  todays_appointments: number;
  week_appointments: number;
  monthly_income: number;
  pending_invoices: number;
  upcoming_appointments: Appointment[];
  recent_patients: Patient[];
}

export interface FinancialSummary {
  year: number;
  month: number;
  total_invoiced: number;
  total_paid: number;
  total_pending: number;
  total_expenses: number;
  net_income: number;
}

// ── Plan Diario de Responsabilidad ────────────────────────────────────────────

export type DailyPlanItemStatus = 'pendiente' | 'completado' | 'parcial' | 'no_completado';

export interface DailyPlanItem {
  id: number;
  section_id: number;
  activity: string;
  status: DailyPlanItemStatus;
  notes: string | null;
  order: number;
}

export interface DailyPlanItemCreate {
  activity: string;
  status?: DailyPlanItemStatus;
  notes?: string;
  order?: number;
}

export interface DailyPlanSection {
  id: number;
  plan_id: number;
  label: string;   // A, B, C…
  title: string;
  order: number;
  items: DailyPlanItem[];
}

export interface DailyPlanSectionCreate {
  label: string;
  title: string;
  order?: number;
  items: DailyPlanItemCreate[];
}

export interface DailyPlan {
  id: number;
  patient_id: number;
  therapist_id: number;
  plan_date: string;
  title: string;
  instructions: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  sections: DailyPlanSection[];
}

export interface DailyPlanCreate {
  patient_id: number;
  therapist_id: number;
  plan_date: string;
  title?: string;
  instructions?: string;
  sections: DailyPlanSectionCreate[];
}

export interface DailyPlanUpdate {
  plan_date?: string;
  title?: string;
  instructions?: string;
  status?: string;
}

export interface DailyPlanItemUpdate {
  activity?: string;
  status?: DailyPlanItemStatus;
  notes?: string;
  order?: number;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
