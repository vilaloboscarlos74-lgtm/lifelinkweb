import { Link } from 'react-router-dom';
import { MapPin, Eye, Clock, AlertTriangle, Heart, Tag } from 'lucide-react';
import { getMediaUrl } from '../services/api';

const TYPE_LABELS = {
  donacion:   { label: 'Donación',    cls: 'badge-donation' },
  venta:      { label: 'Venta',       cls: 'badge-sale' },
  intercambio:{ label: 'Intercambio', cls: 'badge-exchange' },
  solicitud:  { label: 'Solicitud',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full' },
};

const CATEGORY_ICONS = {
  ortopedico: '🦴', rehabilitacion: '💪', diagnostico: '🔬', protesis: '🦿',
  mobiliario: '🛏️', consumibles: '💉', sangre: '🩸', otro: '📦',
};

const CATEGORY_BG = {
  ortopedico: 'bg-amber-50 dark:bg-amber-900/20',
  rehabilitacion: 'bg-blue-50 dark:bg-blue-900/20',
  diagnostico: 'bg-purple-50 dark:bg-purple-900/20',
  protesis: 'bg-slate-50 dark:bg-slate-800/40',
  mobiliario: 'bg-teal-50 dark:bg-teal-900/20',
  consumibles: 'bg-rose-50 dark:bg-rose-900/20',
  sangre: 'bg-red-50 dark:bg-red-900/20',
  otro: 'bg-indigo-50 dark:bg-indigo-900/20',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function SupplyCard({ supply, onFavorite }) {
  const primaryImage = supply.images?.find((i) => i.is_primary) || supply.images?.[0];
  const type = TYPE_LABELS[supply.supply_type] || { label: supply.supply_type, cls: 'badge' };
  const catBg = CATEGORY_BG[supply.category] || 'bg-gray-50 dark:bg-gray-700/40';

  return (
    <Link
      to={`/supplies/${supply.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in"
    >
      {/* Image / placeholder */}
      <div className={`relative aspect-[4/3] overflow-hidden ${!primaryImage ? catBg : 'bg-gray-100 dark:bg-gray-700'}`}>
        {primaryImage ? (
          <img
            src={getMediaUrl(primaryImage.image_url)}
            alt={supply.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-60">{CATEGORY_ICONS[supply.category] || '📦'}</span>
          </div>
        )}

        {primaryImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {supply.is_urgent && (
            <span className="badge-urgent flex items-center gap-1 shadow-sm">
              <AlertTriangle size={10} /> Urgente
            </span>
          )}
          <span className={`${type.cls} shadow-sm`}>{type.label}</span>
        </div>

        {/* Unfavorite button */}
        {onFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onFavorite(supply.id); }}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-900 hover:scale-110 transition-all duration-200"
          >
            <Heart size={15} className="text-rose-500 fill-rose-500" />
          </button>
        )}

        {/* Views count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
          <Eye size={10} /> {supply.views_count}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
          {supply.title}
        </h3>

        {/* Price / type label */}
        {supply.supply_type === 'venta' && supply.price ? (
          <p className="text-lg font-black text-primary-700 dark:text-primary-400 mb-1">
            ${supply.price.toLocaleString('es-MX')}
            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">{supply.currency}</span>
          </p>
        ) : supply.supply_type === 'solicitud' ? (
          <div className="flex items-center gap-1 mb-1">
            <Tag size={12} className="text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {supply.budget_max
                ? `Presupuesto: $${supply.budget_min ? supply.budget_min.toLocaleString('es-MX') + ' – ' : ''}$${supply.budget_max.toLocaleString('es-MX')}`
                : 'Busca este insumo'}
            </p>
          </div>
        ) : supply.supply_type === 'donacion' ? (
          <div className="flex items-center gap-1 mb-1">
            <Tag size={12} className="text-medical-600 dark:text-medical-400" />
            <p className="text-sm font-bold text-medical-600 dark:text-medical-400">Donación</p>
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-1">
            <Tag size={12} className="text-brand-600 dark:text-brand-400" />
            <p className="text-sm font-bold text-brand-600 dark:text-brand-400">Intercambio</p>
          </div>
        )}

        {/* Location + time */}
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-auto pt-3 border-t border-gray-50 dark:border-gray-700">
          {supply.city && (
            <span className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400">
              <MapPin size={11} className="text-primary-500" /> {supply.city}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={11} /> {timeAgo(supply.created_at)}
          </span>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-medical-100 dark:from-primary-900 dark:to-medical-900 flex items-center justify-center text-[10px] font-bold text-primary-700 dark:text-primary-300 overflow-hidden flex-shrink-0">
            {supply.owner?.avatar_url ? (
              <img src={getMediaUrl(supply.owner.avatar_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              supply.owner?.full_name?.[0]?.toUpperCase()
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{supply.owner?.full_name}</span>
        </div>
      </div>
    </Link>
  );
}
