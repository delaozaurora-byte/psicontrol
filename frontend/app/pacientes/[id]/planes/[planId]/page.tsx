'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDailyPlan, getPatient, updateDailyPlanItem } from '@/lib/api';
import type { DailyPlan, Patient, DailyPlanItemStatus } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowLeft, Printer } from 'lucide-react';

const STATUS_CONFIG: Record<DailyPlanItemStatus, { label: string; color: string; bg: string; dot: string }> = {
  pendiente:     { label: 'Pendiente',     color: 'text-gray-500',   bg: 'bg-gray-100',   dot: '#9ca3af' },
  completado:    { label: 'Completado',    color: 'text-green-700',  bg: 'bg-green-100',  dot: '#16a34a' },
  parcial:       { label: 'Parcial',       color: 'text-yellow-700', bg: 'bg-yellow-100', dot: '#ca8a04' },
  no_completado: { label: 'No completado', color: 'text-red-700',    bg: 'bg-red-100',    dot: '#dc2626' },
};

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function PlanViewPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = Number(params.id);
  const planId = Number(params.planId);

  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [p, pt] = await Promise.all([getDailyPlan(planId), getPatient(patientId)]);
        setPlan(p);
        setPatient(pt);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar plan');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [planId, patientId]);

  async function handleStatusChange(itemId: number, status: DailyPlanItemStatus) {
    if (!plan) return;
    try {
      await updateDailyPlanItem(itemId, { status });
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) => ({
            ...s,
            items: s.items.map((it) => (it.id === itemId ? { ...it, status } : it)),
          })),
        };
      });
    } catch {/* ignore */}
  }

  if (loading) return <LoadingSpinner fullPage />;
  if (error || !plan || !patient) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error || 'No encontrado'}</div>
      </div>
    );
  }

  const totalItems = plan.sections.reduce((sum, s) => sum + s.items.length, 0);
  const completados = plan.sections.reduce((sum, s) => sum + s.items.filter((i) => i.status === 'completado').length, 0);
  const parciales = plan.sections.reduce((sum, s) => sum + s.items.filter((i) => i.status === 'parcial').length, 0);
  const noCumplidos = plan.sections.reduce((sum, s) => sum + s.items.filter((i) => i.status === 'no_completado').length, 0);
  const pct = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen-only toolbar */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="flex gap-4 text-xs">
            <span className="text-green-600 font-medium">{completados} completados</span>
            <span className="text-yellow-600 font-medium">{parciales} parciales</span>
            <span className="text-red-600 font-medium">{noCumplidos} no completados</span>
            <span className="text-indigo-600 font-semibold">{pct}% logrado</span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-3xl mx-auto my-8 print:my-0 print:max-w-none">
        <div className="bg-white shadow-sm print:shadow-none rounded-2xl print:rounded-none p-10 print:p-8">

          {/* Document header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-indigo-600">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-indigo-700 tracking-tight">PsiControl</h1>
            <h2 className="text-lg font-semibold text-gray-800 mt-2">{plan.title}</h2>
            <p className="text-sm text-gray-500 mt-1 capitalize">{formatDate(plan.plan_date)}</p>
          </div>

          {/* Patient info */}
          <div className="mb-8 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Paciente</span>
              <p className="font-semibold text-gray-900">{patient.full_name}</p>
            </div>
            {patient.rut_dni && (
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">RUT / DNI</span>
                <p className="font-medium text-gray-700">{patient.rut_dni}</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          {plan.instructions && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Instrucciones</p>
              <p className="text-sm text-blue-900">{plan.instructions}</p>
            </div>
          )}

          {/* Legend */}
          <div className="mb-6 flex flex-wrap gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
                {cfg.label}
              </div>
            ))}
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {plan.sections.map((section) => (
              <div key={section.id}>
                {/* Section heading */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white text-sm font-bold rounded-lg flex items-center justify-center flex-shrink-0">
                    {section.label}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                </div>

                {/* Items table */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-1/2">Actividad</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-32">Estado</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {section.items.map((item) => {
                        const cfg = STATUS_CONFIG[item.status as DailyPlanItemStatus] || STATUS_CONFIG.pendiente;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-800">{item.activity}</td>
                            <td className="px-4 py-3 text-center">
                              {/* Interactive on screen, static on print */}
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value as DailyPlanItemStatus)}
                                className={`print:hidden text-xs px-2.5 py-1.5 rounded-full border-0 font-medium cursor-pointer ${cfg.bg} ${cfg.color}`}
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="completado">Completado</option>
                                <option value="parcial">Parcial</option>
                                <option value="no_completado">No completado</option>
                              </select>
                              {/* Print version: colored dot + label */}
                              <span className={`hidden print:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cfg.dot }} />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs italic">{item.notes || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Summary (screen only) */}
          <div className="print:hidden mt-10 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumen del plan</h4>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-700">{completados}</p>
                <p className="text-xs text-green-600 mt-0.5">Completados</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-yellow-600">{parciales}</p>
                <p className="text-xs text-yellow-600 mt-0.5">Parciales</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-indigo-700">{pct}%</p>
                <p className="text-xs text-indigo-600 mt-0.5">Logrado</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Print summary */}
          <div className="hidden print:block mt-10 pt-6 border-t border-gray-300">
            <div className="grid grid-cols-4 gap-3 text-center text-sm">
              <div><span className="font-bold text-gray-800">{totalItems}</span> <span className="text-gray-500">Total</span></div>
              <div><span className="font-bold text-green-700">{completados}</span> <span className="text-gray-500">Completados</span></div>
              <div><span className="font-bold text-yellow-600">{parciales}</span> <span className="text-gray-500">Parciales</span></div>
              <div><span className="font-bold text-indigo-700">{pct}%</span> <span className="text-gray-500">Logrado</span></div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">Generado por PsiControl · {new Date().toLocaleDateString('es-CL')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
