'use client';

import { useEffect, useState, useCallback } from 'react';
import { getExpenses, createExpense } from '@/lib/api';
import type { Expense, ExpenseCreate } from '@/lib/types';
import Modal from '@/components/Modal';
import { Plus, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
}

const CATEGORIES = [
  'Arriendo',
  'Servicios básicos',
  'Materiales de oficina',
  'Tecnología/Software',
  'Marketing',
  'Seguros',
  'Capacitación',
  'Honorarios externos',
  'Mantenimiento',
  'Otro',
];

interface ExpenseFormProps {
  onSubmit: (data: ExpenseCreate) => void;
  loading: boolean;
  error: string;
}

function ExpenseForm({ onSubmit, loading, error }: ExpenseFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<ExpenseCreate>({
    category: '',
    description: '',
    amount: 0,
    expense_date: today,
    is_deductible: false,
    notes: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: ExpenseCreate = {
      category: form.category,
      description: form.description,
      amount: form.amount,
      expense_date: form.expense_date,
      is_deductible: form.is_deductible,
    };
    if (form.notes) data.notes = form.notes;
    onSubmit(data);
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Categoría *</label>
          <select
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputClass}
          >
            <option value="">Seleccionar categoría...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Fecha *</label>
          <input
            type="date"
            required
            value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Descripción *</label>
          <input
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
            placeholder="Descripción del gasto..."
          />
        </div>
        <div>
          <label className={labelClass}>Monto ($) *</label>
          <input
            type="number"
            min="0"
            required
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className={inputClass}
            placeholder="50000"
          />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <input
            type="checkbox"
            id="deductible"
            checked={form.is_deductible}
            onChange={(e) => setForm({ ...form, is_deductible: e.target.checked })}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="deductible" className="text-sm text-gray-700 font-medium">Gasto deducible</label>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Notas</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading
            ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Guardando...</>
            : <><TrendingDown className="w-4 h-4" /> Registrar gasto</>
          }
        </button>
      </div>
    </form>
  );
}

export default function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Current month filter
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const pad = (n: number) => String(n).padStart(2, '0');
      const start = `${year}-${pad(month)}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${pad(month)}-${pad(lastDay)}`;
      const params: Parameters<typeof getExpenses>[0] = {
        start_date: start,
        end_date: end,
        limit: 200,
      };
      if (categoryFilter) params.category = categoryFilter;
      const data = await getExpenses(params);
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  }, [year, month, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: ExpenseCreate) {
    setFormLoading(true);
    setFormError('');
    try {
      const created = await createExpense(data);
      setExpenses((prev) => [created, ...prev]);
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al registrar gasto');
    } finally {
      setFormLoading(false);
    }
  }

  const totalMonth = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDeductible = expenses.filter((e) => e.is_deductible).reduce((s, e) => s + e.amount, 0);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-gray-500 text-sm mt-1">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''} en {monthNames[month - 1]} {year}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo gasto
        </button>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Total gastos del mes</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonth)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
            <p className="text-xs font-medium text-green-600 mb-1">Gastos deducibles</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalDeductible)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-600"
        >
          {monthNames.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-600"
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-600"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Monto</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Deducible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-4 rounded" style={{ width: '80px' }} /></td>
                    ))}
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    No hay gastos registrados para este período
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(expense.expense_date)}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">
                      {expense.description}
                      {expense.notes && <span className="ml-2 text-xs text-gray-400">({expense.notes})</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(expense.amount)}</td>
                    <td className="px-5 py-3.5 text-center">
                      {expense.is_deductible ? (
                        <CheckCircle className="w-4 h-4 text-green-500 inline" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {expenses.length > 0 && !loading && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-700">Total del período:</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(totalMonth)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Gasto" maxWidth="md">
        <ExpenseForm onSubmit={handleCreate} loading={formLoading} error={formError} />
      </Modal>
    </div>
  );
}
