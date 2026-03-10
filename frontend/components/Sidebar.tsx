'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Brain,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Receipt,
  TrendingDown,
  LogOut,
  ChevronRight,
  User,
  ClipboardCheck,
  UserCog,
  BarChart3,
} from 'lucide-react';
import { getMe, removeToken } from '@/lib/api';
import type { User as UserType } from '@/lib/types';

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',          icon: LayoutDashboard },
  { href: '/pacientes',      label: 'Pacientes',          icon: Users },
  { href: '/citas',          label: 'Citas',              icon: Calendar },
  { href: '/sesiones',       label: 'Sesiones Clínicas',  icon: ClipboardList },
  { href: '/planes-diarios', label: 'Planes Diarios',     icon: ClipboardCheck },
  { href: '/facturacion',    label: 'Facturación',        icon: Receipt },
  { href: '/gastos',         label: 'Gastos',             icon: TrendingDown },
];

const adminItems = [
  { href: '/usuarios',  label: 'Usuarios',  icon: UserCog },
  { href: '/informes',  label: 'Informes',  icon: BarChart3 },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  therapist: 'Terapeuta',
  receptionist: 'Recepcionista',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => { getMe().then(setUser).catch(() => null); }, []);

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
          ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
      </Link>
    );
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white">PsiControl</span>
            <p className="text-xs text-gray-400 leading-tight">Centro de Psicología</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => <NavLink key={item.href} {...item} />)}

        {user?.role === 'admin' && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administración</p>
            </div>
            {adminItems.map((item) => <NavLink key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
