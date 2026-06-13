import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { suppliesAPI, getMediaUrl } from '../services/api';
import {
  Plus, Package, Eye, Trash2, ExternalLink,
  AlertTriangle, CheckCircle, Clock, Archive, XCircle,
  ChevronDown, RotateCcw, BarChart2, X, Image as ImageIcon,
  CalendarClock, CheckSquare, Square, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  disponible: { label: 'Disponible', icon: CheckCircle, cls: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400 border-success-200 dark:border-success-800' },
  reservado:  { label: 'Reservado',  icon: Clock,       cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  entregado:  { label: 'Entregado',  icon: Archive,     cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  cancelado:  { label: 'Cancelado',  icon: XCircle,     cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' },
};

const STATUS_ACTIONS = {
  disponible: [
    { to: 'reservado', label: 'Marcar como reservado', icon: Clock,    color: 'text-amber-700 dark:text-amber-400',   hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    { to: 'entregado', label: 'Marcar como entregado', icon: Archive,  color: 'text-blue-700 dark:text-blue-400',     hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
    { to: 'cancelado', label: 'Cancelar publicación',  icon: XCircle,  color: 'text-red-600 dark:text-red-400',       hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
  ],
  reservado: [
    { to: 'disponible', label: 'Volver a disponible',   icon: RotateCcw, color: 'text-success-700 dark:text-success-400', hoverBg: 'hover:bg-success-50 dark:hover:bg-success-900/20' },
    { to: 'entregado',  label: 'Marcar como entregado', icon: Archive,   color: 'text-blue-700 dark:text-blue-400',       hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
    { to: 'cancelado',  label: 'Cancelar publicación',  icon: XCircle,   color: 'text-red-600 dark:text-red-400',          hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
  ],
  entregado: [
    { to: 'disponible', label: 'Volver a disponible',   icon: RotateCcw, color: 'text-success-700 dark:text-success-400', hoverBg: 'hover:bg-success-50 dark:hover:bg-success-900/20' },
    { to: 'reservado',  label: 'Marcar como reservado', icon: Clock,     color: 'text-amber-700 dark:text-amber-400',     hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    { to: 'cancelado',  label: 'Cancelar publicación',  icon: XCircle,   color: 'text-red-600 dark:text-red-400',          hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
  ],
  cancelado: [
    { to: 'disponible', label: 'Volver a disponible',   icon: RotateCcw, color: 'text-success-700 dark:text-success-400', hoverBg: 'hover:bg-success-50 dark:hover:bg-success-900/20' },
    { to: 'reservado',  label: 'Marcar como reservado', icon: Clock,     color: 'text-amber-700 dark:text-amber-400',     hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20' },
    { to: 'entregado',  label: 'Marcar como entregado', icon: Archive,   color: 'text-blue-700 dark:text-blue-400',       hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
  ],
};

const TYPE_ICONS = { donacion: '🎁', venta: '💰', intercambio: '🔄', solicitud: '🔍' };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}

/* ── Stats Modal ─────────────────────────────────────────────────────────── */
function StatsModal({ supply, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    suppliesAPI.getStats(supply.id)
      .then((r) => setStats(r.data))
      .catch(() => toast.error('Error al cargar estadísticas'))
      .finally(() => setLoading(false));
  }, [supply.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100">Estadísticas</h3>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">{supply.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Vistas',      value: stats.views,               color: 'text-primary-600',  bg: 'bg-primary-50 dark:bg-primary-900/20' },
              { label: 'Solicitudes', value: stats.total_requests,       color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Aceptadas',   value: stats.accepted_requests,    color: 'text-success-600',  bg: 'bg-success-50 dark:bg-success-900/20' },
              { label: 'Completadas', value: stats.completed_requests,   color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Guardados',   value: stats.favorited_by,         color: 'text-rose-600',     bg: 'bg-rose-50 dark:bg-rose-900/20' },
              { label: 'Conversión',  value: `${stats.conversion_rate}%`, color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-3`}>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Image Manager Modal ─────────────────────────────────────────────────── */
function ImageManagerModal({ supply, onClose, onImagesChanged }) {
  const [images, setImages] = useState(supply.images || []);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (img) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    setDeleting(img.id);
    try {
      await suppliesAPI.deleteImage(supply.id, img.id);
      const updated = images.filter((i) => i.id !== img.id);
      setImages(updated);
      onImagesChanged(supply.id, updated);
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar la imagen');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100">Gestionar imágenes</h3>
            <p className="text-xs text-gray-400">{images.length}/5 imágenes</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-10">
            <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Sin imágenes — ve a editar la publicación para agregar</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={getMediaUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                {img.is_primary && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-600/80 text-white text-[9px] font-bold text-center py-0.5">
                    Principal
                  </div>
                )}
                <button
                  onClick={() => handleDelete(img)}
                  disabled={deleting === img.id}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all disabled:opacity-60"
                >
                  {deleting === img.id
                    ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    : <X size={11} />
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Para agregar imágenes, usa el botón "Editar" en la publicación
        </p>
      </div>
    </div>
  );
}

/* ── Status Dropdown ─────────────────────────────────────────────────────── */
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
            <button key={to} onClick={() => handleChange(to)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors ${color} ${hoverBg}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Supply Card ─────────────────────────────────────────────────────────── */
function SupplyManageCard({ supply, onDelete, onStatusChange, onImagesChanged, selected, onSelect }) {
  const [deleting, setDeleting] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const primaryImage = supply.images?.find((i) => i.is_primary) || supply.images?.[0];

  const expDays = daysUntil(supply.expires_at);
  const isExpiringSoon = expDays !== null && expDays <= 7 && expDays >= 0;
  const isExpired = expDays !== null && expDays < 0;

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return;
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
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group flex flex-col ${
        selected ? 'border-primary-400 ring-2 ring-primary-200' : 'border-gray-100 dark:border-gray-700'
      }`}>
        {/* Image */}
        <div className="relative aspect-[16/9] bg-gray-50 dark:bg-gray-700/40 overflow-hidden flex-shrink-0">
          <div className="absolute top-2 left-2 z-10">
            <button onClick={() => onSelect(supply.id)} className="w-6 h-6 rounded-lg bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-sm">
              {selected ? <CheckSquare size={14} className="text-primary-600" /> : <Square size={14} className="text-gray-400" />}
            </button>
          </div>

          {primaryImage ? (
            <img src={getMediaUrl(primaryImage.image_url)} alt={supply.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600"><Package size={40} /></div>
          )}

          <div className="absolute top-2 right-2 text-lg">{TYPE_ICONS[supply.supply_type]}</div>

          {supply.is_urgent && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-accent-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} /> Urgente
            </div>
          )}

          <div className="absolute top-8 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
            <Eye size={10} /> {supply.views_count}
          </div>

          {/* Expiry warning */}
          {isExpired && (
            <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Vencido</span>
            </div>
          )}
          {isExpiringSoon && !isExpired && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <CalendarClock size={10} /> {expDays}d
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1 leading-snug">{supply.title}</h3>

          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
            {supply.supply_type === 'venta' && supply.price && (
              <span className="font-semibold text-primary-600 dark:text-primary-400">${supply.price.toLocaleString('es-MX')}</span>
            )}
            {supply.supply_type === 'donacion' && <span className="font-semibold text-medical-600">Donación</span>}
            {supply.supply_type === 'intercambio' && <span className="font-semibold text-brand-600">Intercambio</span>}
            <span className="ml-auto">{new Date(supply.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
          </div>

          {/* Expiry date label */}
          {supply.expires_at && (
            <p className={`text-[10px] font-semibold mb-2 flex items-center gap-1 ${
              isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-gray-400'
            }`}>
              <CalendarClock size={10} />
              {isExpired ? 'Vencido ' : 'Vence: '}
              {new Date(supply.expires_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-1.5 mt-auto">
            <Link
              to={`/supplies/${supply.id}`}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all flex-shrink-0"
            >
              <ExternalLink size={13} />
            </Link>

            <button
              onClick={() => setShowImages(true)}
              title="Gestionar imágenes"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all flex-shrink-0"
            >
              <ImageIcon size={13} />
            </button>

            <button
              onClick={() => setShowStats(true)}
              title="Ver estadísticas"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-success-300 hover:bg-success-50 hover:text-success-700 transition-all flex-shrink-0"
            >
              <BarChart2 size={13} />
            </button>

            <StatusDropdown supply={supply} onStatusChange={onStatusChange} />

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 dark:border-red-900/50 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {deleting ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {showStats && <StatsModal supply={supply} onClose={() => setShowStats(false)} />}
      {showImages && <ImageManagerModal supply={supply} onClose={() => setShowImages(false)} onImagesChanged={onImagesChanged} />}
    </>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function MySupplies() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    suppliesAPI.getMy()
      .then((r) => setSupplies(r.data || []))
      .catch(() => toast.error('Error al cargar tus publicaciones'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    setSupplies((prev) => prev.filter((s) => s.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await suppliesAPI.update(id, { status: newStatus });
      setSupplies((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
      toast.success(`Estado: ${STATUS_CONFIG[newStatus]?.label}`);
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  const handleImagesChanged = (supplyId, newImages) => {
    setSupplies((prev) => prev.map((s) => s.id === supplyId ? { ...s, images: newImages } : s));
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const bulkSetStatus = async (newStatus) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => suppliesAPI.update(id, { status: newStatus })));
      setSupplies((prev) => prev.map((s) => selected.has(s.id) ? { ...s, status: newStatus } : s));
      setSelected(new Set());
      toast.success(`${selected.size} publicaciones actualizadas`);
    } catch {
      toast.error('Error en acción masiva');
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`¿Eliminar ${selected.size} publicaciones? Esta acción no se puede deshacer.`)) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => suppliesAPI.delete(id)));
      setSupplies((prev) => prev.filter((s) => !selected.has(s.id)));
      setSelected(new Set());
      toast.success(`${selected.size} publicaciones eliminadas`);
    } catch {
      toast.error('Error al eliminar publicaciones');
    } finally {
      setBulkLoading(false);
    }
  };

  const stats = {
    total: supplies.length,
    disponible: supplies.filter((s) => s.status === 'disponible').length,
    reservado: supplies.filter((s) => s.status === 'reservado').length,
    entregado: supplies.filter((s) => s.status === 'entregado').length,
    cancelado: supplies.filter((s) => s.status === 'cancelado').length,
    views: supplies.reduce((acc, s) => acc + (s.views_count || 0), 0),
    expiring: supplies.filter((s) => { const d = daysUntil(s.expires_at); return d !== null && d <= 7 && d >= 0; }).length,
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

      {/* Expiry warning banner */}
      {stats.expiring > 0 && (
        <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl flex items-center gap-3">
          <CalendarClock size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {stats.expiring} publicación{stats.expiring !== 1 ? 'es' : ''} vence{stats.expiring === 1 ? '' : 'n'} en los próximos 7 días.
          </p>
        </div>
      )}

      {supplies.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Disponibles', value: stats.disponible, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20', border: 'border-success-100 dark:border-success-800/50' },
              { label: 'Reservados',  value: stats.reservado,  color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-900/20',    border: 'border-amber-100 dark:border-amber-800/50' },
              { label: 'Entregados',  value: stats.entregado,  color: 'text-blue-600 dark:text-blue-400',      bg: 'bg-blue-50 dark:bg-blue-900/20',      border: 'border-blue-100 dark:border-blue-800/50' },
              { label: 'Total vistas', value: stats.views.toLocaleString(), color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-100 dark:border-primary-800/50', icon: Eye },
            ].map(({ label, value, color, bg, border, icon: Icon }) => (
              <div key={label} className={`${bg} rounded-2xl border ${border} p-4`}>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  {Icon && <Icon size={11} className={color} />}
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { value: 'all',        label: `Todas (${stats.total})` },
              { value: 'disponible', label: `Disponibles (${stats.disponible})` },
              { value: 'reservado',  label: `Reservadas (${stats.reservado})` },
              { value: 'entregado',  label: `Entregadas (${stats.entregado})` },
              { value: 'cancelado',  label: `Canceladas (${stats.cancelado})` },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setFilterStatus(value); setSelected(new Set()); }}
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

          {/* Select all + bulk actions bar */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {selected.size === filtered.length && filtered.length > 0
                  ? <CheckSquare size={15} className="text-primary-600" />
                  : <Square size={15} />
                }
                {selected.size === 0 ? 'Seleccionar todo' : `${selected.size} seleccionados`}
              </button>

              {selected.size > 0 && (
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <span className="text-xs text-gray-400 hidden sm:block">Acción masiva:</span>
                  <button
                    onClick={() => bulkSetStatus('entregado')}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <Archive size={12} /> Entregados
                  </button>
                  <button
                    onClick={() => bulkSetStatus('cancelado')}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={12} /> Cancelar
                  </button>
                  <button
                    onClick={bulkDelete}
                    disabled={bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Package size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            {filterStatus === 'all' ? 'Aún no has publicado nada' : `Sin publicaciones ${STATUS_CONFIG[filterStatus]?.label?.toLowerCase()}s`}
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
              onImagesChanged={handleImagesChanged}
              selected={selected.has(s.id)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
