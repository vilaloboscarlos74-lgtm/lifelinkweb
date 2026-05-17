import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Train, Building2, Info, ArrowRight, Filter } from 'lucide-react';
import { MEETING_POINTS, TYPE_CONFIG } from '../data/meetingPoints';

const MeetingPointsMap = lazy(() => import('../components/MeetingPointsMap'));

const FILTERS = [
  { key: 'all',          label: 'Todos',          icon: MapPin },
  { key: 'metro_cdmx',   label: 'Metro CDMX',     icon: Train },
  { key: 'metro_edomex', label: 'Metro EDOMEX',   icon: Train },
  { key: 'hospital',     label: 'Hospitales',     icon: Building2 },
];

export default function MeetingPoints() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const visible = filter === 'all'
    ? MEETING_POINTS
    : MEETING_POINTS.filter(p => p.type === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 border border-primary-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
          <MapPin size={13} /> Cobertura: CDMX + Estado de México
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">
          Puntos de Encuentro e Intercambio
        </h1>
        <p className="text-gray-500 text-base max-w-2xl leading-relaxed">
          Lugares seguros y accesibles para intercambiar, donar o recibir insumos médicos.
          Seleccionados cerca de hospitales públicos y estaciones de metro con alta afluencia.
        </p>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>¿Cómo funciona?</strong> Coordina con el otro usuario por el chat interno
          de LifeLink y acuerden uno de estos puntos de encuentro para realizar la entrega.
          Siempre ve acompañado y elige horarios con mucha gente.
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${
              filter === key
                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            <Icon size={14} />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {key === 'all'
                ? MEETING_POINTS.length
                : MEETING_POINTS.filter(p => p.type === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Layout principal */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Lista de puntos */}
        <div className="lg:col-span-2 space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {visible.map(point => {
            const cfg = TYPE_CONFIG[point.type];
            const isSelected = selected?.id === point.id;
            return (
              <button
                key={point.id}
                onClick={() => setSelected(isSelected ? null : point)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-400 bg-primary-50 shadow-md'
                    : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: cfg.bg }}
                  >
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-tight mb-0.5 truncate">
                      {point.name}
                    </p>
                    {point.lines && (
                      <p className="text-xs text-primary-600 font-semibold mb-1">
                        Líneas: {point.lines}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 truncate">{point.address}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {point.tags?.slice(0, 3).map(t => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                    style={{ background: cfg.color }}
                  />
                </div>

                {/* Detalle expandido */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-primary-200 text-xs text-gray-600 leading-relaxed">
                    {point.notes}
                    <div className="flex gap-2 mt-2">
                      {point.accessible && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                          ♿ Accesible
                        </span>
                      )}
                      {point.public === true && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          Hospital Público
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mapa */}
        <div className="lg:col-span-3">
          <div className="sticky top-4">
            <Suspense fallback={
              <div className="h-[620px] bg-gray-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Cargando mapa...</p>
                </div>
              </div>
            }>
              <MeetingPointsMap height="620px" filter={filter} showLegend />
            </Suspense>
          </div>
        </div>
      </div>

      {/* CTA inferior */}
      <div className="mt-10 bg-gradient-to-r from-primary-700 to-medical-700 rounded-3xl p-8 text-white text-center">
        <h2 className="text-2xl font-black mb-2">¿Tienes un insumo disponible?</h2>
        <p className="text-primary-200 mb-6 max-w-md mx-auto text-sm leading-relaxed">
          Publica tu insumo en LifeLink y coordina la entrega en uno de estos puntos seguros.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/publish"
            className="bg-white text-primary-700 font-black px-6 py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            Publicar insumo <ArrowRight size={15} />
          </Link>
          <Link
            to="/supplies"
            className="bg-white/15 border border-white/30 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/25 transition-all text-sm"
          >
            Buscar insumos
          </Link>
        </div>
      </div>
    </div>
  );
}
