import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Package, MessageCircle, Droplets, ToggleLeft, ToggleRight, Shield, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Mini gráfica de barras verticales ────────────────────────────────────────
function BarChart({ data, colorClass = 'bg-primary-500' }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{d.count}</span>
          <div
            className={`w-full rounded-t-md ${colorClass} transition-all duration-500`}
            style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
          />
          <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight whitespace-nowrap overflow-hidden w-full text-ellipsis">
            {d.month || d.type || d.category}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Gráfica de barras horizontales ───────────────────────────────────────────
function HBarChart({ data, colorClass = 'bg-medical-500' }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const COLORS = [
    'bg-primary-500', 'bg-medical-500', 'bg-accent-500',
    'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500', 'bg-cyan-500',
  ];
  return (
    <div className="flex flex-col gap-2 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 w-28 shrink-0 text-right truncate capitalize">
            {d.type || d.category}
          </span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${COLORS[i % COLORS.length]} transition-all duration-500`}
              style={{ width: `${Math.max((d.count / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      setLoading(true);
      adminAPI.getUsers({ limit: 50 })
        .then(r => setUsers(r.data.items || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const toggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUserActive(id);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
      toast.success(res.data.detail);
    } catch { toast.error('Error'); }
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const charts = stats?.charts || {};
  const monthly = charts.monthly_registrations || [];
  const byType = charts.supplies_by_type || [];
  const byCategory = charts.supplies_by_category || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Panel de Administración</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['stats', 'Estadísticas'], ['users', 'Usuarios']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${tab === key
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Estadísticas ── */}
      {tab === 'stats' && stats && (
        <div className="space-y-6">

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users,         label: 'Usuarios totales',    value: stats.users?.total,         sub: `${stats.users?.active ?? 0} activos`,       color: 'text-primary-600 bg-primary-100' },
              { icon: Package,       label: 'Insumos publicados',   value: stats.supplies?.total,      sub: `${stats.supplies?.available ?? 0} disponibles`, color: 'text-medical-600 bg-medical-100' },
              { icon: MessageCircle, label: 'Solicitudes',          value: stats.requests?.total,      sub: `${stats.requests?.pending ?? 0} pendientes`, color: 'text-amber-600 bg-amber-100' },
              { icon: Droplets,      label: 'Donantes de sangre',   value: stats.users?.blood_donors,  sub: `${stats.requests?.completed ?? 0} completadas`, color: 'text-accent-600 bg-accent-100' },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} className="card p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? 0}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Registros mensuales */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-primary-600" />
                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Registros mensuales</h2>
              </div>
              {monthly.length > 0
                ? <BarChart data={monthly} colorClass="bg-primary-500" />
                : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
              }
            </div>

            {/* Insumos por tipo */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-medical-600" />
                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Insumos por tipo</h2>
              </div>
              {byType.length > 0
                ? <HBarChart data={byType} />
                : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
              }
            </div>

            {/* Insumos por categoría */}
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-amber-600" />
                <h2 className="font-semibold text-gray-800 dark:text-gray-200">Insumos por categoría (top 8)</h2>
              </div>
              {byCategory.length > 0
                ? <HBarChart data={byCategory} colorClass="bg-amber-500" />
                : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
              }
            </div>

          </div>
        </div>
      )}

      {/* ── Tabla de usuarios ── */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{u.full_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">@{u.username}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'donante' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleUser(u.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={u.is_active ? 'Desactivar' : 'Activar'}>
                          {u.is_active
                            ? <ToggleRight size={20} className="text-green-600" />
                            : <ToggleLeft size={20} className="text-gray-400" />
                          }
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No hay usuarios</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
