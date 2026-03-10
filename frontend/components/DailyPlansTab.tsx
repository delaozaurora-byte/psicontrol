'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDailyPlans, createDailyPlan, deleteDailyPlan, updateDailyPlanItem } from '@/lib/api';
import type { DailyPlan, DailyPlanCreate, DailyPlanSectionCreate, DailyPlanItemCreate, DailyPlanItemStatus } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, Trash2, Eye, ChevronDown, ChevronUp, ClipboardCheck } from 'lucide-react';

interface Props {
  patientId: number;
  therapistId: number;
}

type ItemStatus = DailyPlanItemStatus;

const STATUS_CONFIG: Record<ItemStatus, { label: string; color: string; dot: string }> = {
  pendiente:      { label: 'Pendiente',      color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  completado:     { label: 'Completado',     color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  parcial:        { label: 'Parcial',        color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  no_completado:  { label: 'No completado',  color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
};

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Create Plan Modal ─────────────────────────────────────────────────────────

interface SectionDraft extends DailyPlanSectionCreate {
  _key: number;
  items: (DailyPlanItemCreate & { _key: number })[];
}

function CreatePlanModal({
  patientId,
  therapistId,
  onClose,
  onCreated,
}: {
  patientId: number;
  therapistId: number;
  onClose: () => void;
  onCreated: (plan: DailyPlan) => void;
}) {
  const [planDate, setPlanDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('Plan Diario de Responsabilidad');
  const [instructions, setInstructions] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nextKey, setNextKey] = useState(1);

  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function addSection() {
    const idx = sections.length;
    setSections((prev) => [
      ...prev,
      { _key: nextKey, label: labels[idx] || String(idx + 1), title: '', order: idx, items: [] },
    ]);
    setNextKey((k) => k + 1);
  }

  function removeSection(key: number) {
    setSections((prev) => prev.filter((s) => s._key !== key).map((s, i) => ({ ...s, label: labels[i] || String(i + 1), order: i })));
  }

  function updateSection(key: number, field: 'title' | 'label', value: string) {
    setSections((prev) => prev.map((s) => (s._key === key ? { ...s, [field]: value } : s)));
  }

  function addItem(sectionKey: number) {
    setSections((prev) =>
      prev.map((s) => {
        if (s._key !== sectionKey) return s;
        return {
          ...s,
          items: [...s.items, { _key: nextKey, activity: '', status: 'pendiente', notes: '', order: s.items.length }],
        };
      })
    );
    setNextKey((k) => k + 1);
  }

  function removeItem(sectionKey: number, itemKey: number) {
    setSections((prev) =>
      prev.map((s) => {
        if (s._key !== sectionKey) return s;
        return { ...s, items: s.items.filter((it) => it._key !== itemKey).map((it, i) => ({ ...it, order: i })) };
      })
    );
  }

  function updateItem(sectionKey: number, itemKey: number, field: 'activity' | 'notes', value: string) {
    setSections((prev) =>
      prev.map((s) => {
        if (s._key !== sectionKey) return s;
        return { ...s, items: s.items.map((it) => (it._key === itemKey ? { ...it, [field]: value } : it)) };
      })
    );
  }

  async function handleSubmit() {
    if (!planDate) { setError('Selecciona una fecha'); return; }
    if (sections.some((s) => !s.title.trim())) { setError('Todas las secciones deben tener título'); return; }
    if (sections.some((s) => s.items.some((it) => !it.activity.trim()))) {
      setError('Todas las actividades deben tener descripción');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload: DailyPlanCreate = {
        patient_id: patientId,
        therapist_id: therapistId,
        plan_date: planDate,
        title,
        instructions: instructions || undefined,
        sections: sections.map((s) => ({
          label: s.label,
          title: s.title,
          order: s.order,
          items: s.items.map((it) => ({
            activity: it.activity,
            status: it.status,
            notes: it.notes || undefined,
            order: it.order,
          })),
        })),
      };
      const created = await createDailyPlan(payload);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo Plan Diario de Responsabilidad</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

          {/* Plan meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha del plan</label>
              <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Instrucciones generales (opcional)</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2}
                placeholder="Ej: Marca cada actividad al completarla. Sé honesto contigo mismo."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section._key} className="border border-gray-200 rounded-xl p-4">
                {/* Section header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 text-sm font-bold rounded-lg flex-shrink-0">
                    {section.label}
                  </span>
                  <input
                    value={section.title}
                    onChange={(e) => updateSection(section._key, 'title', e.target.value)}
                    placeholder="Título de la sección (ej: Mañana antes de irme)"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={() => removeSection(section._key)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-2 pl-10">
                  {section.items.map((item) => (
                    <div key={item._key} className="flex items-center gap-2">
                      <input
                        value={item.activity}
                        onChange={(e) => updateItem(section._key, item._key, 'activity', e.target.value)}
                        placeholder="Descripción de la actividad"
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                      />
                      <input
                        value={item.notes || ''}
                        onChange={(e) => updateItem(section._key, item._key, 'notes', e.target.value)}
                        placeholder="Nota (opcional)"
                        className="w-36 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                      />
                      <button onClick={() => removeItem(section._key, item._key)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(section._key)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1">
                    <Plus className="w-3 h-3" /> Agregar actividad
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addSection}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar sección
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Guardando...' : 'Crear plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onDelete, onStatusChange }: {
  plan: DailyPlan;
  onDelete: (id: number) => void;
  onStatusChange: (planId: number, itemId: number, status: ItemStatus) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const totalItems = plan.sections.reduce((sum, s) => sum + s.items.length, 0);
  const completados = plan.sections.reduce((sum, s) => sum + s.items.filter((i) => i.status === 'completado').length, 0);
  const parciales = plan.sections.reduce((sum, s) => sum + s.items.filter((i) => i.status === 'parcial').length, 0);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Plan header */}
      <div className="px-5 py-4 bg-white flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-gray-900 truncate">{plan.title}</h3>
          </div>
          <p className="text-xs text-gray-500 capitalize">{formatDate(plan.plan_date)}</p>
          {totalItems > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500">{totalItems} actividades</span>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {completados} completadas
              </span>
              {parciales > 0 && (
                <span className="flex items-center gap-1 text-xs text-yellow-600">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                  {parciales} parciales
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <button
            onClick={() => router.push(`/pacientes/${plan.patient_id}/planes/${plan.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
          >
            <Eye className="w-3.5 h-3.5" /> Ver / Imprimir
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded sections */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {plan.sections.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400 text-center">Sin secciones</p>
          ) : (
            plan.sections.map((section) => (
              <div key={section.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded flex-shrink-0">
                    {section.label}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">{section.title}</span>
                </div>
                <div className="space-y-1.5 pl-8">
                  {section.items.map((item) => {
                    const cfg = STATUS_CONFIG[item.status as ItemStatus] || STATUS_CONFIG.pendiente;
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        {/* Status selector */}
                        <select
                          value={item.status}
                          onChange={(e) => onStatusChange(plan.id, item.id, e.target.value as ItemStatus)}
                          className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${cfg.color} focus:ring-2 focus:ring-indigo-400`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="completado">Completado</option>
                          <option value="parcial">Parcial</option>
                          <option value="no_completado">No completado</option>
                        </select>
                        <span className="text-sm text-gray-700 flex-1">{item.activity}</span>
                        {item.notes && <span className="text-xs text-gray-400 italic">{item.notes}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export default function DailyPlansTab({ patientId, therapistId }: Props) {
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDailyPlans(patientId);
      setPlans(data);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este plan?')) return;
    try {
      await deleteDailyPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch {/* ignore */}
  }

  async function handleStatusChange(planId: number, itemId: number, status: ItemStatus) {
    try {
      await updateDailyPlanItem(itemId, { status });
      setPlans((prev) =>
        prev.map((p) =>
          p.id !== planId ? p : {
            ...p,
            sections: p.sections.map((s) => ({
              ...s,
              items: s.items.map((it) => (it.id === itemId ? { ...it, status } : it)),
            })),
          }
        )
      );
    } catch {/* ignore */}
  }

  function handleCreated(plan: DailyPlan) {
    setPlans((prev) => [plan, ...prev]);
    setShowCreate(false);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Planes Diarios de Responsabilidad</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : plans.length === 0 ? (
        <div className="p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay planes diarios registrados</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            Crear primer plan
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePlanModal
          patientId={patientId}
          therapistId={therapistId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
