import { Link } from 'react-router-dom';
import { MapPin, Eye, Clock, AlertTriangle, Heart, Tag } from 'lucide-react';

const TYPE_LABELS = {
  donacion: { label: 'Donación', cls: 'badge-donation' },
  venta: { label: 'Venta', cls: 'badge-sale' },
  intercambio: { label: 'Intercambio', cls: 'badge-exchange' },
};

const CATEGORY_ICONS = {
  ortopedico: '🦴', rehabilitacion: '💪', diagnostico: '🔬', protesis: '🦿',
  mobiliario: '🛏️', consumibles: '💉', sangre: '🩸', otro: '📦',
};

const CATEGORY_BG = {
  ortopedico: 'bg-amber-50', rehabilitacion: 'bg-blue-50', diagnostico: 'bg-purple-50',
  protesis: 'bg-slate-50', mobiliario: 'bg-teal-50', consumibles: 'bg-rose-50',
  sangre: 'bg-red-50', otro: 'bg-indigo-50',
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
  const catBg = CATEGORY_BG[supply.category] || 'bg-gray-50';

  return (
    <Link
      to={`/supplies/${supply.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in"
    >
      {/* Image / placeholder */}
      <div className={`relative aspect-[4/3] overflow-hidden ${!primaryImage ? catBg : 'bg-gray-100'}`}>
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={supply.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-60">{CATEGORY_ICONS[supply.category] || '📦'}</span>
          </div>
        )}

        {/* Overlay gradient for readability */}
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

        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onFavorite(supply.id); }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <Heart size={15} className="text-gray-500 hover:text-rose-500 transition-colors" />
          </button>
        )}

        {/* Views count overlay (bottom right on image) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
          <Eye size={10} /> {supply.views_count}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary-700 transition-colors">
          {supply.title}
        </h3>

        {/* Price / type label */}
        {supply.supply_type === 'venta' && supply.price ? (
          <p className="text-lg font-black text-primary-700 mb-1">
            ${supply.price.toLocaleString('es-MX')}
            <span className="text-xs font-normal text-gray-400 ml-1">{supply.currency}</span>
          </p>
        ) : supply.supply_type === 'donacion' ? (
          <div className="flex items-center gap-1 mb-1">
            <Tag size={12} className="text-medical-600" />
            <p className="text-sm font-bold text-medical-600">Donación gratuita</p>
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-1">
            <Tag size={12} className="text-brand-600" />
            <p className="text-sm font-bold text-brand-600">Intercambio</p>
          </div>
        )}

        {/* Location + time */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto pt-3 border-t border-gray-50">
          {supply.city && (
            <span className="flex items-center gap-1 font-medium text-gray-500">
              <MapPin size={11} className="text-primary-500" /> {supply.city}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={11} /> {timeAgo(supply.created_at)}
          </span>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 mt-2.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center text-[10px] font-bold text-primary-700 overflow-hidden flex-shrink-0">
            {supply.owner?.avatar_url ? (
              <img src={supply.owner.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              supply.owner?.full_name?.[0]?.toUpperCase()
            )}
          </div>
          <span className="text-xs text-gray-500 truncate">{supply.owner?.full_name}</span>
        </div>
      </div>
    </Link>
  );
}
