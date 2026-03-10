'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getPatients,
} from '@/lib/api';
import type { Appointment, AppointmentCreate, AppointmentStatus, AppointmentType, Patient } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, AlertCircle, Trash2, Edit2, Filter, CalendarDays } from 'lucide-react';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-yellow-100 text-yellow-700',
};
const statusLabels: Record<string, string> = {
  scheduled: 'Agendada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};
const typeLabels: Record<string, string> = {
  initial: 'Primera consulta',
  followup: 'Seguimiento',
  evaluation: 'Evaluación',
  discharge: 'Alta',
  other: 'Otra',
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('es-CL', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getDuration(start: string, end: string) {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  return `${diff} min`;
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

interface AppointmentFormProps {
  initial?: Partial<Appointment>;
  onSubmit: (data: AppointmentCreate) => void;
  loading: boolean;
  error: string;
  patients: Patient[];
}

function AppointmentForm({ initial, onSubmit, loading, error, patients }: AppointmentFormProps) {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60000);

  function toLocalISOString(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const [form, setForm] = useState({
    patient_id: initial?.patient_id?.toString() || '',
    therapist_id: '1',
    start_time: initial?.start_time ? initial.start_time.slice(0, 16) : toLocalISOString(defaultStart),
    end_time: initial?.end_time ? initial.end_time.slice(0, 16) : toLocalISOString(defaultEnd),
    status: (initial?.status || 'scheduled') as AppointmentStatus,
    appointment_type: (initial?.appointment_type || 'followup') as AppointmentType,
    fee: initial?.fee?.toString() || '',
    notes: initial?.notes || '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: AppointmentCreate = {
      patient_id: Number(form.patient_id),
      therapist_id: Number(form.therapist_id),
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      status: form.status,
      appointment_type: form.appointment_type,
    };
    if (form.fee) data.fee = Number(form.fee);
    if (form.notes) data.notes = form.notes;
    onSubmit(data);
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Paciente *</label>
          <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className={inputClass}>
            <option value="">Seleccionar paciente...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Fecha y hora de inicio *</label>
          <input type="datetime-local" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fecha y hora de fin *</label>
          <input type="datetime-local" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tipo</label>
          <select value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value as AppointmentType })} className={inputClass}>
            <option value="initial">Primera consulta</option>
            <option value="followup">Seguimiento</option>
            <option value="evaluation">Evaluación</option>
            <option value="discharge">Alta</option>
            <option value="other">Otra</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })} className={inputClass}>
            <option value="scheduled">Agendada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
            <option value="no_show">No asistió</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Honorario ($)</label>
          <input type="number" min="0" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className={inputClass} placeholder="50000" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Notas</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Guardando...</> : <><CalendarDays className="w-4 h-4" /> {initial ? 'Actualizar cita' : 'Crear cita'}</>}
        </button>
      </div>
    </form>
  );
}

export default function CitasPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  function getDateRange(filter: DateFilter): { start_date?: string; end_date?: string } {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (filter === 'today') {
      const today = fmt(now);
      return { start_date: today, end_date: today };
    }
    if (filter === 'week') {
      const day = now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { start_date: fmt(mon), end_date: fmt(sun) };
    }
    if (filter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start_date: fmt(start), end_date: fmt(end) };
    }
    return {};
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const range = getDateRange(dateFilter);
      const params: Parameters<typeof getAppointments>[0] = { ...range, limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const [apts, pats] = await Promise.all([
        getAppointments(params),
        getPatients(undefined, 0, 200),
      ]);
      setAppointments(apts);
      setPatients(pats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: AppointmentCreate) {
    setFormLoading(true);
    setFormError('');
    try {
      const created = await createAppointment(data);
      setAppointments((prev) => [created, ...prev]);
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear cita');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(data: AppointmentCreate) {
    if (!editingApt) return;
    setFormLoading(true);
    setFormError('');
    try {
      const updated = await updateAppointment(editingApt.id, data);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditingApt(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al actualizar cita');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta cita?')) return;
    try {
      await deleteAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  async function handleCancel(apt: Appointment) {
    try {
      const updated = await updateAppointment(apt.id, {
        patient_id: apt.patient_id,
        therapist_id: apt.therapist_id,
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: 'cancelled',
        appointment_type: apt.appointment_type,
        fee: apt.fee ?? undefined,
        notes: apt.notes ?? undefined,
      });
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  const filterLabels: Record<DateFilter, string> = {
    today: 'Hoy',
    week: 'Esta semana',
    month: 'Este mes',
    all: 'Todas',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 text-sm mt-1">{appointments.length} cita{appointments.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {(['today', 'week', 'month', 'all'] as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${dateFilter === f ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-600"
          >
            <option value="">Todos los estados</option>
            <option value="scheduled">Agendada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
            <option value="no_show">No asistió</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha/Hora</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Duración</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Honorario</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 60}px` }} /></td>
                    ))}
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">No hay citas para el período seleccionado</td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const patient = patients.find((p) => p.id === apt.patient_id);
                  return (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-900 whitespace-nowrap">{formatDateTime(apt.start_time)}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {patient?.full_name || apt.patient?.full_name || `#${apt.patient_id}`}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{typeLabels[apt.appointment_type] || apt.appointment_type}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[apt.status] || apt.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{getDuration(apt.start_time, apt.end_time)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600">{apt.fee ? `$${apt.fee.toLocaleString('es-CL')}` : '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingApt(apt); setFormError(''); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {apt.status === 'scheduled' && (
                            <button
                              onClick={() => handleCancel(apt)}
                              className="px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Cita" maxWidth="xl">
        <AppointmentForm
          onSubmit={handleCreate}
          loading={formLoading}
          error={formError}
          patients={patients}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingApt} onClose={() => setEditingApt(null)} title="Editar Cita" maxWidth="xl">
        {editingApt && (
          <AppointmentForm
            initial={editingApt}
            onSubmit={handleUpdate}
            loading={formLoading}
            error={formError}
            patients={patients}
          />
        )}
      </Modal>
    </div>
  );
}
