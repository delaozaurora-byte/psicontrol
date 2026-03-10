'use client';

import { useEffect, useState } from 'react';
import { getDashboard, getAppointments, getPatients, getDailyPlans, getFinancialSummary } from '@/lib/api';
import type { DashboardStats, FinancialSummary } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BarChart3, TrendingUp, Users, Calendar, ClipboardCheck, DollarSign, Download } from 'lucide-react';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function InformesPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [planStats, setPlanStats] = useState({ total: 0, completionPct: 0, patientsWithPlans: 0 });
  const [appointmentStats, setAppointmentStats] = useState({ completed: 0, cancelled: 0, noShow: 0, total: 0 });
  const [patientStats, setPatientStats] = useState({ active: 0, inactive: 0, discharged: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [dash, fin, plans, apts, patients] = await Promise.all([
          getDashboard(),
          getFinancialSummary(year, month),
          getDailyPlans(),
          getAppointments(),
          getPatients(),
        ]);
        setStats(dash);
        setFinancial(fin);

        // Plan stats
        const allItems = plans.flatMap((p) => p.sections.flatMap((s) => s.items));
        const completados = allItems.filter((i) => i.status === 'completado').length;
        setPlanStats({
          total: plans.length,
          completionPct: allItems.length > 0 ? Math.round((completados / allItems.length) * 100) : 0,
          patientsWithPlans: new Set(plans.map((p) => p.patient_id)).size,
        });

        // Appointment stats
        setAppointmentStats({
          total: apts.length,
          completed: apts.filter((a) => a.status === 'completed').length,
          cancelled: apts.filter((a) => a.status === 'cancelled').length,
          noShow: apts.filter((a) => a.status === 'no_show').length,
        });

        // Patient stats
        setPatientStats({
          total: patients.length,
          active: patients.filter((p) => p.is_active).length,
          inactive: patients.filter((p) => !p.is_active).length,
          discharged: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [year, month]);

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informes y Estadísticas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen general del centro</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pacientes activos" value={stats?.active_patients ?? 0} sub={`de ${patientStats.total} totales`} color="text-indigo-600" />
        <StatCard label="Citas este mes" value={appointmentStats.completed} sub={`${appointmentStats.total} programadas`} color="text-green-600" />
        <StatCard label="Ingresos del mes" value={`$${(financial?.total_paid ?? 0).toLocaleString('es-CL')}`} sub="facturado y pagado" color="text-emerald-600" />
        <StatCard label="Cumplimiento planes" value={`${planStats.completionPct}%`} sub={`${planStats.total} planes activos`} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pacientes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-900">Pacientes</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Activos</span>
                <span className="font-semibold text-green-600">{patientStats.active}</span>
              </div>
              <ProgressBar value={patientStats.active} max={patientStats.total} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Inactivos</span>
                <span className="font-semibold text-gray-500">{patientStats.inactive}</span>
              </div>
              <ProgressBar value={patientStats.inactive} max={patientStats.total} color="bg-gray-400" />
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total registrados</span>
              <span className="font-bold text-gray-900">{patientStats.total}</span>
            </div>
          </div>
        </div>

        {/* Citas */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">Citas (historial completo)</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completadas</span>
                <span className="font-semibold text-green-600">{appointmentStats.completed}</span>
              </div>
              <ProgressBar value={appointmentStats.completed} max={appointmentStats.total} color="bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Canceladas</span>
                <span className="font-semibold text-red-500">{appointmentStats.cancelled}</span>
              </div>
              <ProgressBar value={appointmentStats.cancelled} max={appointmentStats.total} color="bg-red-400" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">No asistió</span>
                <span className="font-semibold text-yellow-600">{appointmentStats.noShow}</span>
              </div>
              <ProgressBar value={appointmentStats.noShow} max={appointmentStats.total} color="bg-yellow-400" />
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total registradas</span>
              <span className="font-bold text-gray-900">{appointmentStats.total}</span>
            </div>
          </div>
        </div>

        {/* Financiero */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900">Financiero — {months[month - 1]} {year}</h2>
          </div>
          {financial ? (
            <div className="space-y-2">
              {[
                { label: 'Facturado', value: financial.total_invoiced, color: 'text-gray-700' },
                { label: 'Cobrado', value: financial.total_paid, color: 'text-green-600' },
                { label: 'Pendiente', value: financial.total_pending, color: 'text-yellow-600' },
                { label: 'Gastos', value: financial.total_expenses, color: 'text-red-500' },
                { label: 'Ingreso neto', value: financial.net_income, color: 'text-indigo-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`text-sm font-semibold ${color}`}>${value.toLocaleString('es-CL')}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">Sin datos financieros</p>}
        </div>

        {/* Planes Diarios */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-purple-500" />
            <h2 className="text-base font-semibold text-gray-900">Planes Diarios</h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-indigo-700">{planStats.total}</p>
                <p className="text-xs text-indigo-500 mt-0.5">Planes</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-700">{planStats.patientsWithPlans}</p>
                <p className="text-xs text-blue-500 mt-0.5">Pacientes</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-700">{planStats.completionPct}%</p>
                <p className="text-xs text-green-500 mt-0.5">Cumplimiento</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Tasa de cumplimiento global</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${planStats.completionPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hoy */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h2 className="text-base font-semibold text-gray-900">Resumen de hoy</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{stats?.todays_appointments ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Citas hoy</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{stats?.week_appointments ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Citas esta semana</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{stats?.pending_invoices ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Facturas pendientes</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">${(stats?.monthly_income ?? 0).toLocaleString('es-CL')}</p>
            <p className="text-xs text-gray-500 mt-0.5">Ingresos del mes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
