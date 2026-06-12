import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, getMediaUrl } from '../services/api';
import {
  Users, Package, MessageCircle, Droplets, ToggleLeft, ToggleRight,
  Shield, BarChart2, Trash2, Search, ChevronLeft, ChevronRight,
  Ban, CheckCircle, RefreshCw, Eye, AlertTriangle, Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Gráfica barras verticales ────────────────────────────────────────────────
function BarChart({ data, colorClass = 'bg-primary-500' }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{d.count}</span>
          <div className={`w-full rounded-t-md ${colorClass} transition-all duration-500`}
            style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }} />
          <span className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight whitespace-nowrap overflow-hidden w-full text-ellipsis">
            {d.month || d.type || d.category}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Gráfica barras horizontales ──────────────────────────────────────────────
function HBarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const COLORS = ['bg-primary-500','bg-medical-500','bg-accent-500','bg-amber-500','bg-purple-500','bg-emerald-500','bg-pink-500','bg-cyan-500'];
  return (
    <div className="flex flex-col gap-2 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 w-28 shrink-0 text-right truncate capitalize">
            {d.type || d.category}
          </span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div className={`h-full rounded-full ${COLORS[i % COLORS.length]} transition-all duration-500`}
              style={{ width: `${Math.max((d.count / max) * 100, 4)}%` }} />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-6 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Badge de estado ──────────────────────────────────────────────────────────
const STATUS_STYLES = {
  disponible: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  reservado:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  entregado:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  cancelado:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const TYPE_STYLES = {
  donacion:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  venta:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  intercambio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  solicitud:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const ROLE_STYLES = {
  admin:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  donante:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  solicitante: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function Badge({ label, style }) {
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style}`}>{label}</span>;
}

// ── Paginación ───────────────────────────────────────────────────────────────
function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Página {page} de {pages}
      </span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Modal confirmación ────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          <AlertTriangle size={22} className={danger ? 'text-red-600' : 'text-amber-600'} />
        </div>
        <p className="text-center text-gray-800 dark:text-gray-200 font-medium text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab Estadísticas ─────────────────────────────────────────────────────────
function StatsTab({ stats }) {
  if (!stats) return <p className="text-center text-gray-400 py-10">Sin datos</p>;
  const charts = stats.charts || {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,         label: 'Usuarios totales',  value: stats.users?.total,        sub: `${stats.users?.active ?? 0} activos`,           color: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30' },
          { icon: Package,       label: 'Insumos publicados', value: stats.supplies?.total,     sub: `${stats.supplies?.available ?? 0} disponibles`, color: 'text-medical-600 bg-medical-100 dark:bg-medical-900/30' },
          { icon: MessageCircle, label: 'Solicitudes',        value: stats.requests?.total,     sub: `${stats.requests?.pending ?? 0} pendientes`,    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { icon: Droplets,      label: 'Donantes de sangre', value: stats.users?.blood_donors, sub: `${stats.requests?.completed ?? 0} completadas`, color: 'text-accent-600 bg-accent-100 dark:bg-accent-900/30' },
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Registros mensuales</h2>
          </div>
          {(charts.monthly_registrations?.length > 0)
            ? <BarChart data={charts.monthly_registrations} colorClass="bg-primary-500" />
            : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>}
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-medical-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Insumos por tipo</h2>
          </div>
          {(charts.supplies_by_type?.length > 0)
            ? <HBarChart data={charts.supplies_by_type} />
            : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>}
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-amber-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Insumos por categoría (top 8)</h2>
          </div>
          {(charts.supplies_by_category?.length > 0)
            ? <HBarChart data={charts.supplies_by_category} />
            : <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>}
        </div>
      </div>
    </div>
  );
}

// ── Tab Publicaciones ────────────────────────────────────────────────────────
function SuppliesTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirm, setConfirm] = useState(null); // { type: 'delete'|'status', id, extra }

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search.trim()) params.query = search.trim();
      if (filterType) params.supply_type = filterType;
      if (filterStatus) params.status = filterStatus;
      const r = await adminAPI.getSupplies(params);
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
      setPage(r.data.page || 1);
      setPages(r.data.pages || 1);
    } catch { toast.error('Error al cargar publicaciones'); }
    finally { setLoading(false); }
  }, [search, filterType, filterStatus]);

  useEffect(() => { fetch(1); }, [fetch]);

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteSupply(id);
      setItems(prev => prev.filter(s => s.id !== id));
      setTotal(t => t - 1);
      toast.success('Publicación eliminada');
    } catch { toast.error('Error al eliminar'); }
    setConfirm(null);
  };

  const handleStatus = async (id, status) => {
    try {
      await adminAPI.setSupplyStatus(id, status);
      setItems(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast.success(`Estado cambiado a ${status}`);
    } catch { toast.error('Error al cambiar estado'); }
    setConfirm(null);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetch(1)}
            placeholder="Buscar por título o descripción..."
            className="input-field pl-9 text-sm" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="">Todos los tipos</option>
          <option value="donacion">Donación</option>
          <option value="venta">Venta</option>
          <option value="intercambio">Intercambio</option>
          <option value="solicitud">Solicitud</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="reservado">Reservado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button onClick={() => fetch(1)}
          className="btn-primary flex items-center gap-2 shrink-0">
          <Search size={14} /> Buscar
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-gray-200">{total}</strong> publicaciones en total
      </p>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Publicación</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Publicado por</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : items.map(s => (
                    <tr key={s.id} className={`border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 ${s.status === 'cancelado' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{s.title}</p>
                        {s.city && <p className="text-xs text-gray-400">{s.city}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link to={`/users/${s.owner?.id}`} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                          {s.owner?.full_name}
                        </Link>
                        <p className="text-[11px] text-gray-400">@{s.owner?.username}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge label={s.supply_type} style={TYPE_STYLES[s.supply_type] || ''} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={s.status} style={STATUS_STYLES[s.status] || ''} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/supplies/${s.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 transition-colors" title="Ver publicación">
                            <Eye size={15} />
                          </Link>
                          {s.status !== 'cancelado'
                            ? (
                              <button onClick={() => setConfirm({ type: 'status', id: s.id, status: 'cancelado', label: s.title })}
                                className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-600 transition-colors" title="Cancelar publicación">
                                <Ban size={15} />
                              </button>
                            ) : (
                              <button onClick={() => setConfirm({ type: 'status', id: s.id, status: 'disponible', label: s.title })}
                                className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600 transition-colors" title="Restaurar publicación">
                                <RefreshCw size={15} />
                              </button>
                            )
                          }
                          <button onClick={() => setConfirm({ type: 'delete', id: s.id, label: s.title })}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar permanentemente">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No se encontraron publicaciones</p>
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} onChange={p => { setPage(p); fetch(p); }} />

      {/* Modal confirmación */}
      {confirm && (
        <ConfirmModal
          danger={confirm.type === 'delete'}
          message={
            confirm.type === 'delete'
              ? `¿Eliminar permanentemente "${confirm.label}"? Esta acción no se puede deshacer.`
              : confirm.status === 'cancelado'
                ? `¿Cancelar y ocultar "${confirm.label}"? El usuario no podrá ver su publicación.`
                : `¿Restaurar "${confirm.label}" como disponible?`
          }
          onConfirm={() =>
            confirm.type === 'delete'
              ? handleDelete(confirm.id)
              : handleStatus(confirm.id, confirm.status)
          }
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ── Tab Usuarios ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const r = await adminAPI.getUsers(params);
      setUsers(r.data.items || []);
      setTotal(r.data.total || 0);
      setPage(r.data.page || 1);
      setPages(r.data.pages || 1);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(1); }, []);  // eslint-disable-line

  const toggleActive = async (id) => {
    try {
      const res = await adminAPI.toggleUserActive(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
      toast.success(res.data.detail);
    } catch { toast.error('Error'); }
    setConfirm(null);
  };

  const changeRole = async (id, role) => {
    try {
      const res = await adminAPI.changeUserRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: res.data.role } : u));
      toast.success(res.data.detail);
    } catch (err) { toast.error(err.response?.data?.detail || 'Error'); }
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetch(1)}
            placeholder="Buscar usuario..."
            className="input-field pl-9 text-sm" />
        </div>
        <button onClick={() => fetch(1)} className="btn-primary flex items-center gap-2 shrink-0">
          <Search size={14} /> Buscar
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        <strong className="text-gray-800 dark:text-gray-200">{total}</strong> usuarios registrados
      </p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Usuario</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Registro</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                            {u.avatar_url
                              ? <img src={getMediaUrl(u.avatar_url)} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-primary-600">{u.full_name?.charAt(0)}</span>
                            }
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{u.full_name}</p>
                            <p className="text-[11px] text-gray-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' ? (
                          <select value={u.role}
                            onChange={e => changeRole(u.id, e.target.value)}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer">
                            <option value="solicitante">Solicitante</option>
                            <option value="donante">Donante</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <Badge label="admin" style={ROLE_STYLES.admin} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={u.is_active ? 'Activo' : 'Inactivo'}
                          style={u.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                        />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/users/${u.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-600 transition-colors" title="Ver perfil">
                            <Eye size={15} />
                          </Link>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => setConfirm({ id: u.id, name: u.full_name, active: u.is_active })}
                              className={`p-2 rounded-lg transition-colors ${u.is_active
                                ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600'
                                : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600'}`}
                              title={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}>
                              {u.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-gray-400" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && users.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No se encontraron usuarios</p>
          )}
        </div>
      </div>

      <Pagination page={page} pages={pages} onChange={p => { setPage(p); fetch(p); }} />

      {confirm && (
        <ConfirmModal
          danger={confirm.active}
          message={confirm.active
            ? `¿Desactivar a "${confirm.name}"? No podrá iniciar sesión hasta que lo reactives.`
            : `¿Reactivar a "${confirm.name}"?`}
          onConfirm={() => toggleActive(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TABS = [
    { key: 'stats',     label: 'Estadísticas',  icon: BarChart2 },
    { key: 'supplies',  label: 'Publicaciones',  icon: Package },
    { key: 'users',     label: 'Usuarios',       icon: Users },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-md">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Panel de Administración</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestión completa de la plataforma</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${tab === key
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading && tab === 'stats'
        ? <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        : tab === 'stats'   ? <StatsTab stats={stats} />
        : tab === 'supplies' ? <SuppliesTab />
        : <UsersTab />
      }
    </div>
  );
}
