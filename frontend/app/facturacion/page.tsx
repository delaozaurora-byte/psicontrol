'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  getPatients,
} from '@/lib/api';
import type { Invoice, InvoiceCreate, InvoiceStatus, Patient } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, AlertCircle, CheckCircle, FileText, Trash2 } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  overdue: 'bg-orange-100 text-orange-700',
};
const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  cancelled: 'Cancelada',
  overdue: 'Vencida',
};

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceFormProps {
  onSubmit: (data: InvoiceCreate) => void;
  loading: boolean;
  error: string;
  patients: Patient[];
}

function InvoiceForm({ onSubmit, loading, error, patients }: InvoiceFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    patient_id: '',
    issue_date: today,
    due_date: '',
    status: 'draft' as InvoiceStatus,
    notes: '',
  });
  const [items, setItems] = useState<LineItem[]>([
    { description: 'Sesión de psicoterapia', quantity: 1, unit_price: 0 },
  ]);

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  }
  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, field: keyof LineItem, value: string) {
    const updated = [...items];
    if (field === 'quantity' || field === 'unit_price') {
      updated[i] = { ...updated[i], [field]: Number(value) };
    } else {
      updated[i] = { ...updated[i], [field]: value };
    }
    setItems(updated);
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: InvoiceCreate = {
      patient_id: Number(form.patient_id),
      issue_date: form.issue_date,
      status: form.status,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };
    if (form.due_date) data.due_date = form.due_date;
    if (form.notes) data.notes = form.notes;
    onSubmit(data);
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          <label className={labelClass}>Fecha de emisión *</label>
          <input type="date" required value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fecha de vencimiento</label>
          <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Estado</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })} className={inputClass}>
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
          </select>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + ' mb-0'}>Ítems *</label>
          <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> Agregar ítem
          </button>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Descripción</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 w-20">Cantidad</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-32">Precio unit.</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-32">Subtotal</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <input
                      required
                      value={item.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                      placeholder="Descripción del servicio"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min="1" required
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min="0" required
                      value={item.unit_price}
                      onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right focus:ring-1 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </td>
                  <td className="px-2 py-2">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Total:</td>
                <td className="px-3 py-2 text-right text-sm font-bold text-indigo-700">{formatCurrency(subtotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div>
        <label className={labelClass}>Notas</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Guardando...</> : <><FileText className="w-4 h-4" /> Crear factura</>}
        </button>
      </div>
    </form>
  );
}

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Parameters<typeof getInvoices>[0] = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      const [invs, pats] = await Promise.all([
        getInvoices(params),
        getPatients(undefined, 0, 200),
      ]);
      setInvoices(invs);
      setPatients(pats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: InvoiceCreate) {
    setFormLoading(true);
    setFormError('');
    try {
      const created = await createInvoice(data);
      setInvoices((prev) => [created, ...prev]);
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear factura');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleMarkPaid(invoice: Invoice) {
    if (!confirm('¿Marcar esta factura como pagada?')) return;
    try {
      const updated = await updateInvoice(invoice.id, { status: 'paid' });
      setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  const totalInvoiced = invoices.reduce((s, inv) => s + inv.total, 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, inv) => s + inv.total, 0);
  const totalPending = invoices.filter((i) => ['sent', 'overdue', 'draft'].includes(i.status)).reduce((s, inv) => s + inv.total, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} factura{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva factura
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Facturado</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
            <p className="text-xs font-medium text-green-600 mb-1">Total Pagado</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-100">
            <p className="text-xs font-medium text-yellow-600 mb-1">Total Pendiente</p>
            <p className="text-2xl font-bold text-yellow-700">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-600"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviada</option>
          <option value="paid">Pagada</option>
          <option value="overdue">Vencida</option>
          <option value="cancelled">Cancelada</option>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">N° Factura</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Vencimiento</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">No hay facturas</td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const patient = patients.find((p) => p.id === inv.patient_id);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-indigo-700 font-medium">{inv.invoice_number}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {patient?.full_name || inv.patient?.full_name || `#${inv.patient_id}`}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{formatDate(inv.issue_date)}</td>
                      <td className="px-5 py-3.5 text-gray-600">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[inv.status] || inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => handleMarkPaid(inv)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Pagada
                            </button>
                          )}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Factura" maxWidth="2xl">
        <InvoiceForm onSubmit={handleCreate} loading={formLoading} error={formError} patients={patients} />
      </Modal>
    </div>
  );
}
