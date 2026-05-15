import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { suppliesAPI } from '../services/api';
import {
  Plus, Package, Eye, Trash2, ExternalLink,
  AlertTriangle, CheckCircle, Clock, Archive, XCircle,
  ChevronDown, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  disponible: {
    label: 'Disponible',
    icon: CheckCircle,
    cls: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400 border-success-200 dark:border-success-800',
  },
  reservado: {
    label: 'Reservado',
    icon: Clock,
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  entregado: {
    label: 'Entregado',
    icon: Archive,
    cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
};

// All possible transitions from each status
const STATUS_ACTIONS = {
  disponible: [
    { to: 'reservado', label: 'Marcar como reservado', icon: Clock,        color: 'text-amber-700 dark:text-amber-400',   hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    { to: 'entregado', label: 'Marcar como entregado', icon: Archive,      color: 'text-blue-700 dark:text-blue-400',     hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
    { to: 'cancelado', label: 'Cancelar publicación',  icon: XCircle,      color: 'text-red-600 dark:text-red-400',       hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
  ],
  reservado: [
    { to: 'disponible', label: 'Volver a disponible',  icon: RotateCcw,    color: 'text-success-700 dark:text-success-400', hoverBg: 'hover:bg-success-50 dark:hover:bg-success-900/20' },
    { to: 'entregado',  label: 'Marcar como entregado',icon: Archive,      color: 'text-blue-700 dark:text-blue-400',      hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
    { to: 'cancelado',  label: 'Cancelar publicación', icon: XCircle,      color: 'text-red-600 dark:text-red-400',         hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
  ],
  entregado: [
    { to: 'disponible', label: 'Volver a disponible',  icon: RotateCcw,    color: 'text-success-700 dark:text-success-400', hoverBg: 'hover:bg-success-50 dark:hover:bg-success-900/20' },
    { to: 'reservado',  label: 'Marcar como reservado',icon: Clock,        color: 'text-amber-700 dark:text-amber-400',     hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    { to: 'cancelado',  label: 'Cancelar publicación', icon: XCircle,      color: 'text-red-600 dark:text-red-400',         hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
  ],
  cancelado: [
    { to: 'disponible', label: 'Volver a disponible',  icon: RotateCcw,    color: 'text-success-700 dark:text-success-400', hoverBg: 'hover:bg-success-50 dark:hover:bg-success-900/20' },
    { to: 'reservado',  label: 'Marcar como reservado',icon: Clock,        color: 'text-amber-700 dark:text-amber-400',     hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    { to: 'entregado',  label: 'Marcar como entregado',icon: Archive,      color: 'text-blue-700 dark:text-blue-400',       hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
  ],
};

const TYPE_ICONS = { donacion: '🎁', venta: '💰', intercambio: '🔄' };

function StatusDropdown({ supply, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const status = STATUS_CONFIG[supply.status] || STATUS_CONFIG.disponible;
  const StatusIcon = status.icon;
  const actions = STATUS_ACTIONS[supply.status] || [];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = async (newStatus) => {
    setOpen(false);
    setLoading(true);
    try {
      await onStatusChange(supply.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-60 ${status.cls}`}
      >
        {loading
          ? <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          : <StatusIcon size={12} />
        }
        {status.label}
        <ChevronDown size={11} className={`ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && actions.length > 0 && (
        <div className="absolute bottom-full mb-1.5 left-0 right-0 z-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden animate-scale-in">
          {actions.map(({ to, label, icon: Icon, color, hoverBg }) => (
            <button
              key={to}
              onClick={() => handleChange(to)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors ${color} ${hoverBg}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SupplyManageCard({ supply, onDelete, onStatusChange }) {
  const [deleting, setDeleting] = useState(false);
  const primaryImage = supply.images?.find((i) => i.is_primary) || supply.images?.[0];

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await suppliesAPI.delete(supply.id);
      toast.success('Publicación eliminada');
      onDelete(supply.id);
    } catch {
      toast.error('Error al eliminar la publicación');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group flex flex-col">
      {/* Image */}
      <div className="relative aspect-[16/9] bg-gray-50 dark:bg-gray-700/40 overflow-hidden flex-shrink-0">
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={supply.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <Package size={40} />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 right-3 text-lg">
          {TYPE_ICONS[supply.supply_type]}
        </div>

        {/* Urgent overlay */}
        {supply.is_urgent && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-accent-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <AlertTriangle size={10} /> Urgente
          </div>
        )}

        {/* Views pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
          <Eye size={10} /> {supply.views_count}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1 leading-snug">{supply.title}</h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-4">
          {supply.supply_type === 'venta' && supply.price && (
            <span className="font-semibold text-primary-600 dark:text-primary-400">${supply.price.toLocaleString('es-MX')}</span>
          )}
          {supply.supply_type === 'donacion' && (
            <span className="font-semibold text-medical-600 dark:text-medical-400">Donación</span>
          )}
          {supply.supply_type === 'intercambio' && (
            <span className="font-semibold text-brand-600 dark:text-brand-400">Intercambio</span>
          )}
          <span className="ml-auto">{new Date(supply.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/supplies/${supply.id}`}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 transition-all"
          >
            <ExternalLink size={13} />
          </Link>

          <StatusDropdown supply={supply} onStatusChange={onStatusChange} />

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 dark:border-red-900/50 text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {deleting
              ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              : <Trash2 size={14} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MySupplies() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    suppliesAPI.getMy()
      .then((r) => setSupplies(r.data || []))
      .catch(() => toast.error('Error al cargar tus publicaciones'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setSupplies((prev) => prev.filter((s) => s.id !== id));

  const handleStatusChange = async (id, newStatus) => {
    try {
      await suppliesAPI.update(id, { status: newStatus });
      setSupplies((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
      toast.success(`Estado actualizado: ${STATUS_CONFIG[newStatus]?.label}`);
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  const stats = {
    total: supplies.length,
    disponible: supplies.filter((s) => s.status === 'disponible').length,
    reservado: supplies.filter((s) => s.status === 'reservado').length,
    entregado: supplies.filter((s) => s.status === 'entregado').length,
    cancelado: supplies.filter((s) => s.status === 'cancelado').length,
    views: supplies.reduce((acc, s) => acc + (s.views_count || 0), 0),
  };

  const filtered = filterStatus === 'all' ? supplies : supplies.filter((s) => s.status === filterStatus);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded-lg mb-2" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/2" />
                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Mis Publicaciones</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {stats.total} publicación{stats.total !== 1 ? 'es' : ''} en total
          </p>
        </div>
        <Link to="/publish" className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus size={16} /> Publicar
        </Link>
      </div>

      {supplies.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Disponibles', value: stats.disponible, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20', border: 'border-success-100 dark:border-success-800/50' },
              { label: 'Reservados',  value: stats.reservado,  color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/20',    border: 'border-amber-100 dark:border-amber-800/50' },
              { label: 'Entregados',  value: stats.entregado,  color: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-50 dark:bg-blue-900/20',      border: 'border-blue-100 dark:border-blue-800/50' },
              { label: 'Total vistas',value: stats.views,      color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-100 dark:border-primary-800/50', icon: Eye },
            ].map(({ label, value, color, bg, border, icon: Icon }) => (
              <div key={label} className={`${bg} rounded-2xl border ${border} p-4`}>
                <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  {Icon && <Icon size={11} className={color} />}
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {[
              { value: 'all',        label: `Todas (${stats.total})` },
              { value: 'disponible', label: `Disponibles (${stats.disponible})` },
              { value: 'reservado',  label: `Reservadas (${stats.reservado})` },
              { value: 'entregado',  label: `Entregadas (${stats.entregado})` },
              { value: 'cancelado',  label: `Canceladas (${stats.cancelado})` },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Package size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            {filterStatus === 'all' ? 'Aún no has publicado nada' : `Sin publicaciones ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()}s`}
          </h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Comparte insumos médicos y ayuda a la comunidad</p>
          {filterStatus === 'all' && (
            <Link to="/publish" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Crear primera publicación
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <SupplyManageCard
              key={s.id}
              supply={s}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
