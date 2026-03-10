'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getPatient,
  updatePatient,
  getAppointments,
  getClinicalSessions,
  getDiagnoses,
  getMe,
} from '@/lib/api';
import type { Patient, PatientCreate, Appointment, ClinicalSession, Diagnosis, User as UserType } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import DailyPlansTab from '@/components/DailyPlansTab';
import { ArrowLeft, Save, AlertCircle, Calendar, ClipboardList, Stethoscope, User, ClipboardCheck } from 'lucide-react';

type Tab = 'info' | 'citas' | 'sesiones' | 'diagnosticos' | 'planes';

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PatientCreate>({ full_name: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    getMe().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPatient(id);
        setPatient(data);
        setForm({
          full_name: data.full_name,
          email: data.email || '',
          phone: data.phone || '',
          rut_dni: data.rut_dni || '',
          birth_date: data.birth_date || '',
          gender: data.gender || '',
          address: data.address || '',
          insurance: data.insurance || '',
          emergency_contact: data.emergency_contact || '',
          emergency_phone: data.emergency_phone || '',
          notes: data.notes || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar paciente');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const loadTabData = useCallback(async (tab: Tab) => {
    setTabLoading(true);
    try {
      if (tab === 'citas') {
        const data = await getAppointments({ patient_id: id });
        setAppointments(data);
      } else if (tab === 'sesiones') {
        const data = await getClinicalSessions(id);
        setSessions(data);
      } else if (tab === 'diagnosticos') {
        const data = await getDiagnoses(id);
        setDiagnoses(data);
      }
    } catch {
      // ignore
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'info') {
      loadTabData(activeTab);
    }
  }, [activeTab, loadTabData]);

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updatePatient(id, form);
      setPatient(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner fullPage />;
  if (error || !patient) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error || 'Paciente no encontrado'}</p>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'info', label: 'Información', icon: User },
    { key: 'citas', label: 'Citas', icon: Calendar },
    { key: 'sesiones', label: 'Sesiones Clínicas', icon: ClipboardList },
    { key: 'diagnosticos', label: 'Diagnósticos', icon: Stethoscope },
    { key: 'planes', label: 'Planes Diarios', icon: ClipboardCheck },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 text-lg font-bold">{patient.full_name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
            <p className="text-gray-500 text-sm">{patient.email || 'Sin email'} · Paciente #{patient.id}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Datos del Paciente</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>

          {saveError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{saveError}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Nombre completo</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>RUT / DNI</label>
              <input value={form.rut_dni || ''} onChange={(e) => setForm({ ...form, rut_dni: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fecha de nacimiento</label>
              <input type="date" value={form.birth_date || ''} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Género</label>
              <select value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} disabled={!editing} className={inputClass}>
                <option value="">—</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
                <option value="prefer_not_to_say">Prefiero no decir</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Seguro médico</label>
              <input value={form.insurance || ''} onChange={(e) => setForm({ ...form, insurance: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Dirección</label>
              <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contacto de emergencia</label>
              <input value={form.emergency_contact || ''} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Teléfono emergencia</label>
              <input value={form.emergency_phone || ''} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} disabled={!editing} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Notas</label>
              <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={!editing} rows={3} className={inputClass} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
            <span>Creado: {formatDate(patient.created_at)}</span>
            <span>Actualizado: {formatDate(patient.updated_at)}</span>
            <span className={`px-2 py-0.5 rounded-full ${patient.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {patient.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      )}

      {activeTab === 'citas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Citas del Paciente</h2>
          </div>
          {tabLoading ? (
            <LoadingSpinner />
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No hay citas registradas</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha/Hora</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Honorario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">{formatDateTime(apt.start_time)}</td>
                    <td className="px-5 py-3 capitalize">{apt.appointment_type}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[apt.status] || ''}`}>
                        {statusLabels[apt.status] || apt.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">{apt.fee ? `$${apt.fee.toLocaleString('es-CL')}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'sesiones' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Sesiones Clínicas</h2>
          </div>
          {tabLoading ? (
            <LoadingSpinner />
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No hay sesiones clínicas registradas</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <div key={session.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Sesión #{session.session_number}</span>
                      <span className="ml-3 text-xs text-gray-500">{formatDate(session.session_date)}</span>
                      <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{session.modality}</span>
                    </div>
                  </div>
                  {session.summary && <p className="text-sm text-gray-600 mt-1">{session.summary}</p>}
                  {(session.subjective || session.objective || session.assessment || session.plan) && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      {session.subjective && <div><span className="font-medium text-gray-500">S:</span> {session.subjective}</div>}
                      {session.objective && <div><span className="font-medium text-gray-500">O:</span> {session.objective}</div>}
                      {session.assessment && <div><span className="font-medium text-gray-500">A:</span> {session.assessment}</div>}
                      {session.plan && <div><span className="font-medium text-gray-500">P:</span> {session.plan}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'diagnosticos' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Diagnósticos</h2>
          </div>
          {tabLoading ? (
            <LoadingSpinner />
          ) : diagnoses.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No hay diagnósticos registrados</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {diagnoses.map((dx) => (
                <div key={dx.id} className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    {dx.code && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono">{dx.code}</span>
                    )}
                    {dx.is_primary && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Principal</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(dx.date_diagnosed)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{dx.description}</p>
                  {dx.notes && <p className="text-xs text-gray-500 mt-1">{dx.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'planes' && (
        <DailyPlansTab
          patientId={id}
          therapistId={currentUser?.id ?? 1}
        />
      )}
    </div>
  );
}
