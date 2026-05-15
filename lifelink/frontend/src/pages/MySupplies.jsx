import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { suppliesAPI } from '../services/api';
import {
  Plus, Package, Eye, Trash2, ExternalLink, Edit2,
  AlertTriangle, CheckCircle, Clock, Archive,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  disponible: { label: 'Disponible',  icon: CheckCircle, cls: 'bg-success-100 text-success-700 border-success-200' },
  reservado:  { label: 'Reservado',   icon: Clock,       cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  completado: { label: 'Completado',  icon: Archive,     cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const TYPE_ICONS = { donacion: '🎁', venta: '💰', intercambio: '🔄' };

function SupplyManageCard({ supply, onDelete, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const status = STATUS_CONFIG[supply.status] || STATUS_CONFIG.disponible;
  const StatusIcon = status.icon;
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-[16/9] bg-gray-50 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={supply.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={40} />
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${status.cls}`}>
          <StatusIcon size={11} />
          {status.label}
        </div>

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
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-3 leading-snug">{supply.title}</h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1"><Eye size={12} /> {supply.views_count} vistas</span>
          <span className="text-gray-200">·</span>
          {supply.supply_type === 'venta' && supply.price && (
            <span className="font-semibold text-primary-600">${supply.price.toLocaleString('es-MX')}</span>
          )}
          {supply.supply_type === 'donacion' && (
            <span className="font-semibold text-medical-600">Donación</span>
          )}
          <span className="ml-auto">{new Date(supply.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/supplies/${supply.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all"
          >
            <ExternalLink size={13} /> Ver
          </Link>

          {supply.status === 'disponible' && (
            <button
              onClick={() => onStatusChange(supply.id, 'reservado')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-all"
            >
              <Clock size={13} /> Reservar
            </button>
          )}

          {supply.status === 'reservado' && (
            <button
              onClick={() => onStatusChange(supply.id, 'completado')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-success-200 text-xs font-semibold text-success-700 hover:bg-success-50 transition-all"
            >
              <CheckCircle size={13} /> Completar
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-50"
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => setSupplies((prev) => prev.filter((s) => s.id !== id));

  const handleStatusChange = async (id, newStatus) => {
    try {
      await suppliesAPI.update(id, { status: newStatus });
      setSupplies((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
      toast.success(`Publicación marcada como ${STATUS_CONFIG[newStatus]?.label.toLowerCase()}`);
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  // Stats
  const stats = {
    total: supplies.length,
    disponible: supplies.filter((s) => s.status === 'disponible').length,
    reservado: supplies.filter((s) => s.status === 'reservado').length,
    completado: supplies.filter((s) => s.status === 'completado').length,
    views: supplies.reduce((acc, s) => acc + (s.views_count || 0), 0),
  };

  const filtered = filterStatus === 'all' ? supplies : supplies.filter((s) => s.status === filterStatus);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
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
          <h1 className="text-2xl font-black text-gray-900">Mis Publicaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">
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
              { label: 'Disponibles',  value: stats.disponible, color: 'text-success-600', bg: 'bg-success-50',  border: 'border-success-100' },
              { label: 'Reservados',   value: stats.reservado,  color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100' },
              { label: 'Completados',  value: stats.completado, color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-100' },
              { label: 'Total vistas', value: stats.views,      color: 'text-primary-600', bg: 'bg-primary-50',  border: 'border-primary-100', icon: Eye },
            ].map(({ label, value, color, bg, border, icon: Icon }) => (
              <div key={label} className={`${bg} rounded-2xl border ${border} p-4`}>
                <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1">
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
              { value: 'completado', label: `Completadas (${stats.completado})` },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Grid */}
      {filtered.length === 0 && !loading ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Package size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            {filterStatus === 'all' ? 'Aún no has publicado nada' : `Sin publicaciones ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()}s`}
          </h3>
          <p className="text-gray-400 text-sm mb-6">Comparte insumos médicos y ayuda a la comunidad</p>
          <Link to="/publish" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Crear primera publicación
          </Link>
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
