'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getClinicalSessions,
  createClinicalSession,
  getPatients,
} from '@/lib/api';
import type { ClinicalSession, ClinicalSessionCreate, SessionModality, Patient } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, AlertCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

const modalityLabels: Record<string, string> = {
  in_person: 'Presencial',
  online: 'Online',
  phone: 'Teléfono',
};

interface SessionFormProps {
  onSubmit: (data: ClinicalSessionCreate) => void;
  loading: boolean;
  error: string;
  patients: Patient[];
}

function SessionForm({ onSubmit, loading, error, patients }: SessionFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    patient_id: '',
    therapist_id: '1',
    session_date: today,
    modality: 'in_person' as SessionModality,
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    summary: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: ClinicalSessionCreate = {
      patient_id: Number(form.patient_id),
      therapist_id: Number(form.therapist_id),
      session_date: form.session_date,
      modality: form.modality,
    };
    if (form.subjective) data.subjective = form.subjective;
    if (form.objective) data.objective = form.objective;
    if (form.assessment) data.assessment = form.assessment;
    if (form.plan) data.plan = form.plan;
    if (form.summary) data.summary = form.summary;
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
          <label className={labelClass}>Fecha *</label>
          <input type="date" required value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Modalidad</label>
          <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as SessionModality })} className={inputClass}>
            <option value="in_person">Presencial</option>
            <option value="online">Online</option>
            <option value="phone">Teléfono</option>
          </select>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notas SOAP</h4>
        <div>
          <label className={labelClass}>S - Subjetivo (lo que reporta el paciente)</label>
          <textarea value={form.subjective} onChange={(e) => setForm({ ...form, subjective: e.target.value })} rows={2} className={inputClass} placeholder="El paciente refiere..." />
        </div>
        <div>
          <label className={labelClass}>O - Objetivo (observaciones del terapeuta)</label>
          <textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} rows={2} className={inputClass} placeholder="Se observa..." />
        </div>
        <div>
          <label className={labelClass}>A - Valoración/Análisis</label>
          <textarea value={form.assessment} onChange={(e) => setForm({ ...form, assessment: e.target.value })} rows={2} className={inputClass} placeholder="Evaluación clínica..." />
        </div>
        <div>
          <label className={labelClass}>P - Plan</label>
          <textarea value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} rows={2} className={inputClass} placeholder="Plan de intervención..." />
        </div>
      </div>

      <div>
        <label className={labelClass}>Resumen general</label>
        <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className={inputClass} placeholder="Resumen de la sesión..." />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Guardando...</> : <><Plus className="w-4 h-4" /> Crear sesión</>}
        </button>
      </div>
    </form>
  );
}

function SessionRow({ session, patients }: { session: ClinicalSession; patients: Patient[] }) {
  const [expanded, setExpanded] = useState(false);
  const patient = patients.find((p) => p.id === session.patient_id);

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-5 py-3.5 text-gray-600">{formatDate(session.session_date)}</td>
        <td className="px-5 py-3.5 font-medium text-gray-900">
          {patient?.full_name || session.patient?.full_name || `#${session.patient_id}`}
        </td>
        <td className="px-5 py-3.5 text-gray-600">
          {session.therapist?.full_name || `Terapeuta #${session.therapist_id}`}
        </td>
        <td className="px-5 py-3.5 text-center">
          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
            #{session.session_number}
          </span>
        </td>
        <td className="px-5 py-3.5 text-gray-600">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
            {modalityLabels[session.modality] || session.modality}
          </span>
        </td>
        <td className="px-5 py-3.5 text-gray-500 text-sm max-w-xs truncate">{session.summary || '—'}</td>
        <td className="px-5 py-3.5 text-right">
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 inline" /> : <ChevronDown className="w-4 h-4 text-gray-400 inline" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-indigo-50/30">
          <td colSpan={7} className="px-8 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {session.subjective && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Subjetivo</p>
                  <p className="text-gray-700">{session.subjective}</p>
                </div>
              )}
              {session.objective && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Objetivo</p>
                  <p className="text-gray-700">{session.objective}</p>
                </div>
              )}
              {session.assessment && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Valoración</p>
                  <p className="text-gray-700">{session.assessment}</p>
                </div>
              )}
              {session.plan && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Plan</p>
                  <p className="text-gray-700">{session.plan}</p>
                </div>
              )}
              {!session.subjective && !session.objective && !session.assessment && !session.plan && (
                <p className="text-gray-400 col-span-2 text-center py-2">No hay notas SOAP registradas</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function SesionesPage() {
  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sess, pats] = await Promise.all([
        getClinicalSessions(patientFilter ? Number(patientFilter) : undefined),
        getPatients(undefined, 0, 200),
      ]);
      setSessions(sess);
      setPatients(pats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, [patientFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: ClinicalSessionCreate) {
    setFormLoading(true);
    setFormError('');
    try {
      const created = await createClinicalSession(data);
      setSessions((prev) => [created, ...prev]);
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear sesión');
    } finally {
      setFormLoading(false);
    }
  }

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sesiones Clínicas</h1>
          <p className="text-gray-500 text-sm mt-1">{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva sesión
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <select
          value={patientFilter}
          onChange={(e) => setPatientFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-600"
        >
          <option value="">Todos los pacientes</option>
          {filteredPatients.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Terapeuta</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Sesión #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Modalidad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Resumen</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" style={{ width: '80px' }} /></td>
                    ))}
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">No hay sesiones clínicas registradas</td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <SessionRow key={session.id} session={session} patients={patients} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Sesión Clínica" maxWidth="2xl">
        <SessionForm onSubmit={handleCreate} loading={formLoading} error={formError} patients={patients} />
      </Modal>
    </div>
  );
}
