'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  getPatients,
  createPatient,
  deletePatient,
} from '@/lib/api';
import type { Patient, PatientCreate } from '@/lib/types';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search, Plus, Edit2, Trash2, Eye, AlertCircle, UserPlus } from 'lucide-react';

const LIMIT = 20;

function PatientForm({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (data: PatientCreate) => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState<PatientCreate>({
    full_name: '',
    email: '',
    phone: '',
    rut_dni: '',
    birth_date: '',
    gender: '',
    address: '',
    insurance: '',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean: PatientCreate = { full_name: form.full_name };
    if (form.email) clean.email = form.email;
    if (form.phone) clean.phone = form.phone;
    if (form.rut_dni) clean.rut_dni = form.rut_dni;
    if (form.birth_date) clean.birth_date = form.birth_date;
    if (form.gender) clean.gender = form.gender;
    if (form.address) clean.address = form.address;
    if (form.insurance) clean.insurance = form.insurance;
    if (form.emergency_contact) clean.emergency_contact = form.emergency_contact;
    if (form.emergency_phone) clean.emergency_phone = form.emergency_phone;
    if (form.notes) clean.notes = form.notes;
    onSubmit(clean);
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Nombre completo *</label>
          <input name="full_name" required value={form.full_name} onChange={handleChange} className={inputClass} placeholder="María González López" />
        </div>
        <div>
          <label className={labelClass}>RUT / DNI</label>
          <input name="rut_dni" value={form.rut_dni} onChange={handleChange} className={inputClass} placeholder="12.345.678-9" />
        </div>
        <div>
          <label className={labelClass}>Fecha de nacimiento</label>
          <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="email@ejemplo.com" />
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+56 9 1234 5678" />
        </div>
        <div>
          <label className={labelClass}>Género</label>
          <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
            <option value="">Seleccionar...</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
            <option value="prefer_not_to_say">Prefiero no decir</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Seguro médico</label>
          <input name="insurance" value={form.insurance} onChange={handleChange} className={inputClass} placeholder="FONASA / ISAPRE" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Dirección</label>
          <input name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Av. Ejemplo 123, Santiago" />
        </div>
        <div>
          <label className={labelClass}>Contacto de emergencia</label>
          <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange} className={inputClass} placeholder="Nombre del contacto" />
        </div>
        <div>
          <label className={labelClass}>Teléfono emergencia</label>
          <input name="emergency_phone" value={form.emergency_phone} onChange={handleChange} className={inputClass} placeholder="+56 9 1234 5678" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Notas</label>
          <textarea name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} placeholder="Observaciones adicionales..." />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Guardando...</> : <><UserPlus className="w-4 h-4" /> Crear paciente</>}
        </button>
      </div>
    </form>
  );
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchPatients = useCallback(async (searchVal: string, skipVal: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getPatients(searchVal || undefined, skipVal, LIMIT);
      if (skipVal === 0) {
        setPatients(data);
      } else {
        setPatients((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === LIMIT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSkip(0);
      fetchPatients(search, 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchPatients]);

  async function handleCreate(data: PatientCreate) {
    setFormLoading(true);
    setFormError('');
    try {
      const newPatient = await createPatient(data);
      setPatients((prev) => [newPatient, ...prev]);
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear paciente');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) return;
    setDeleteId(id);
    try {
      await deletePatient(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar paciente');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm mt-1">{patients.length} paciente{patients.length !== 1 ? 's' : ''} encontrado{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo paciente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email, RUT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">RUT / DNI</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Seguro</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && patients.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-36 rounded" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-40 rounded" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-28 rounded" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-20 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    {search ? 'No se encontraron pacientes para esa búsqueda' : 'No hay pacientes registrados'}
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-700 text-xs font-semibold">{patient.full_name.charAt(0)}</span>
                        </div>
                        {patient.full_name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{patient.email || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{patient.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{patient.rut_dni || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{patient.insurance || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/pacientes/${patient.id}`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/pacientes/${patient.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          disabled={deleteId === patient.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {hasMore && !loading && patients.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => {
                const newSkip = skip + LIMIT;
                setSkip(newSkip);
                fetchPatients(search, newSkip);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Cargar más pacientes
            </button>
          </div>
        )}
        {loading && patients.length > 0 && (
          <div className="py-3 flex justify-center border-t border-gray-100">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Paciente" maxWidth="2xl">
        <PatientForm onSubmit={handleCreate} loading={formLoading} error={formError} />
      </Modal>
    </div>
  );
}
