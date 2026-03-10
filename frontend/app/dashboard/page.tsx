'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDashboard } from '@/lib/api';
import type { DashboardStats, Appointment } from '@/lib/types';
import { Users, Calendar, TrendingUp, Clock, RefreshCw, AlertCircle } from 'lucide-react';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {loading ? (
        <div className="skeleton h-8 w-24 rounded" />
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
}

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const stats = await getDashboard();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Pacientes"
          value={data?.total_patients ?? 0}
          icon={Users}
          color="bg-indigo-100 text-indigo-600"
          loading={loading}
        />
        <StatCard
          label="Citas Hoy"
          value={data?.todays_appointments ?? 0}
          icon={Calendar}
          color="bg-blue-100 text-blue-600"
          loading={loading}
        />
        <StatCard
          label="Citas Esta Semana"
          value={data?.week_appointments ?? 0}
          icon={Clock}
          color="bg-cyan-100 text-cyan-600"
          loading={loading}
        />
        <StatCard
          label="Ingresos del Mes"
          value={loading ? '...' : formatCurrency(data?.monthly_income ?? 0)}
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Próximas Citas</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 space-y-2">
                  <div className="skeleton h-4 w-48 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
              ))
            ) : data?.upcoming_appointments && data.upcoming_appointments.length > 0 ? (
              data.upcoming_appointments.slice(0, 5).map((apt: Appointment) => (
                <div key={apt.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {apt.patient?.full_name || `Paciente #${apt.patient_id}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(apt.start_time)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[apt.status] || apt.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No hay citas próximas
              </div>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pacientes Recientes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
              ))
            ) : data?.recent_patients && data.recent_patients.length > 0 ? (
              data.recent_patients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-700 text-xs font-semibold">
                      {patient.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient.full_name}</p>
                    <p className="text-xs text-gray-500">{patient.email || 'Sin email'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No hay pacientes recientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      {data && (
        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 text-sm">
            <span className="font-semibold">{data.pending_invoices}</span> factura{data.pending_invoices !== 1 ? 's' : ''} pendiente{data.pending_invoices !== 1 ? 's' : ''} de cobro.{' '}
            <a href="/facturacion" className="underline font-medium hover:text-yellow-900">Ver facturación</a>
          </p>
        </div>
      )}
    </div>
  );
}
