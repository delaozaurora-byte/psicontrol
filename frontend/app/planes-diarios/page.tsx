'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDailyPlans, getPatients, deleteDailyPlan } from '@/lib/api';
import type { DailyPlan, Patient } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ClipboardCheck, Eye, Trash2, Plus, Search } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS = {
  completado:    'bg-green-500',
  parcial:       'bg-yellow-400',
  no_completado: 'bg-red-500',
  pendiente:     'bg-gray-300',
};

function MiniBar({ plan }: { plan: DailyPlan }) {
  const items = plan.sections.flatMap((s) => s.items);
  const total = items.length;
  if (total === 0) return <span className="text-xs text-gray-400">Sin actividades</span>;
  const done = items.filter((i) => i.status === 'completado').length;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}% ({done}/{total})</span>
    </div>
  );
}

export default function PlanesDiariosPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('');

  useEffect(() => {
    async function load() {
      const [p, pts] = await Promise.all([getDailyPlans(), getPatients()]);
      setPlans(p);
      setPatients(pts);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este plan?')) return;
    await deleteDailyPlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  const patientMap = Object.fromEntries(patients.map((p) => [p.id, p]));

  const filtered = plans.filter((plan) => {
    const patient = patientMap[plan.patient_id];
    const name = patient?.full_name?.toLowerCase() || '';
    const matchesSearch = !search || name.includes(search.toLowerCase()) || plan.title.toLowerCase().includes(search.toLowerCase());
    const matchesPatient = !filterPatient || plan.patient_id === Number(filterPatient);
    return matchesSearch && matchesPatient;
  });

  // Stats
  const totalItems = plans.flatMap((p) => p.sections.flatMap((s) => s.items));
  const completados = totalItems.filter((i) => i.status === 'completado').length;
  const globalPct = totalItems.length > 0 ? Math.round((completados / totalItems.length) * 100) : 0;
  const patientsWithPlans = new Set(plans.map((p) => p.patient_id)).size;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes Diarios de Responsabilidad</h1>
          <p className="text-sm text-gray-500 mt-0.5">Todos los planes de todos los pacientes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Planes totales</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-indigo-600">{patientsWithPlans}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pacientes con plan</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-green-600">{completados}</p>
          <p className="text-xs text-gray-500 mt-0.5">Actividades completadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-indigo-600">{globalPct}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Cumplimiento global</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente o título..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <select
          value={filterPatient}
          onChange={(e) => setFilterPatient(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">Todos los pacientes</option>
          {patients.filter((p) => plans.some((pl) => pl.patient_id === p.id)).map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay planes que coincidan</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Título</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Secciones</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Progreso</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((plan) => {
                const patient = patientMap[plan.patient_id];
                return (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      {patient ? (
                        <button
                          onClick={() => router.push(`/pacientes/${patient.id}`)}
                          className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                        >
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-700 text-xs font-bold">{patient.full_name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-gray-900">{patient.full_name}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">Paciente #{plan.patient_id}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(plan.plan_date)}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-xs truncate">{plan.title}</td>
                    <td className="px-5 py-3 text-gray-500">{plan.sections.length} secciones</td>
                    <td className="px-5 py-3"><MiniBar plan={plan} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => router.push(`/pacientes/${plan.patient_id}/planes/${plan.id}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Para crear un nuevo plan, ve al perfil del paciente → pestaña <strong>Planes Diarios</strong>
      </p>
    </div>
  );
}
