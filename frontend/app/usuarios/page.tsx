'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, Pencil, UserX, UserCheck, Shield, Stethoscope, UserCog } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Administrador', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  { value: 'therapist', label: 'Terapeuta', icon: Stethoscope, color: 'bg-blue-100 text-blue-700' },
  { value: 'receptionist', label: 'Recepcionista', icon: UserCog, color: 'bg-green-100 text-green-700' },
];

function roleConfig(role: string) {
  return ROLES.find((r) => r.value === role) || ROLES[1];
}

interface UserForm {
  email: string;
  full_name: string;
  role: string;
  specialty: string;
  phone: string;
  password: string;
}

const emptyForm: UserForm = { email: '', full_name: '', role: 'therapist', specialty: '', phone: '', password: '' };

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<User[]>('/api/users/');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ email: u.email, full_name: u.full_name, role: u.role, specialty: (u as any).specialty || '', phone: (u as any).phone || '', password: '' });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.email.trim()) { setError('Nombre y email son obligatorios'); return; }
    if (!editing && !form.password) { setError('La contraseña es obligatoria para nuevos usuarios'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const body: Record<string, string> = { full_name: form.full_name, role: form.role };
        if (form.specialty) body.specialty = form.specialty;
        if (form.phone) body.phone = form.phone;
        const updated = await apiFetch<User>(`/api/users/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await apiFetch<User>('/api/users/', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, full_name: form.full_name, role: form.role, specialty: form.specialty || undefined, phone: form.phone || undefined, password: form.password }),
        });
        setUsers((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: User) {
    try {
      const updated = await apiFetch<User>(`/api/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ is_active: !u.is_active }) });
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {/* ignore */}
  }

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none';
  const lbl = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Administra el equipo del centro</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {ROLES.map(({ value, label, icon: Icon, color }) => {
          const count = users.filter((u) => u.role === value && u.is_active).length;
          return (
            <div key={value} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{label}{count !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Especialidad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const rc = roleConfig(u.role);
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-700 text-xs font-bold">{u.full_name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${rc.color}`}>
                        <rc.icon className="w-3 h-3" />
                        {rc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{(u as any).specialty || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(u)} className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={u.is_active ? 'Desactivar' : 'Activar'}>
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
              <div>
                <label className={lbl}>Nombre completo *</label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inp} placeholder="Dra. Ana García" />
              </div>
              <div>
                <label className={lbl}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} className={`${inp} ${editing ? 'bg-gray-50 text-gray-400' : ''}`} placeholder="ana@centro.com" />
              </div>
              <div>
                <label className={lbl}>Rol *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inp}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {form.role === 'therapist' && (
                <div>
                  <label className={lbl}>Especialidad</label>
                  <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className={inp} placeholder="Psicología Clínica" />
                </div>
              )}
              <div>
                <label className={lbl}>Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} placeholder="+56 9 xxxx xxxx" />
              </div>
              {!editing && (
                <div>
                  <label className={lbl}>Contraseña *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inp} placeholder="Mínimo 8 caracteres" />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
