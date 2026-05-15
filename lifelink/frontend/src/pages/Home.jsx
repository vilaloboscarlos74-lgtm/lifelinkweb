import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { suppliesAPI } from '../services/api';
import {
  Search, ArrowRight, Heart, Shield, Users, Droplets,
  MapPin, Package, HandHeart, CheckCircle, ChevronRight,
  Zap, Eye, Clock, AlertTriangle, Tag,
} from 'lucide-react';

const SupplyMap = lazy(() => import('../components/SupplyMap'));

/* ─── Data ─────────────────────────────────────────── */
const COLLECTIONS = [
  { key: 'ortopedico',    icon: '🦴', label: 'Ortopédico',     bg: 'from-amber-400 to-orange-500' },
  { key: 'rehabilitacion',icon: '💪', label: 'Rehabilitación',  bg: 'from-blue-400 to-sky-500' },
  { key: 'diagnostico',   icon: '🔬', label: 'Diagnóstico',    bg: 'from-violet-400 to-purple-500' },
  { key: 'protesis',      icon: '🦿', label: 'Prótesis',       bg: 'from-slate-400 to-gray-600' },
  { key: 'mobiliario',    icon: '🛏️', label: 'Mobiliario',    bg: 'from-teal-400 to-emerald-500' },
  { key: 'consumibles',   icon: '💉', label: 'Consumibles',    bg: 'from-rose-400 to-pink-500' },
  { key: 'sangre',        icon: '🩸', label: 'Sangre',         bg: 'from-red-500 to-rose-600' },
  { key: 'otro',          icon: '📦', label: 'Otros',          bg: 'from-indigo-400 to-blue-500' },
];

const TYPE_CONFIG = {
  donacion:    { label: 'Gratis',       cls: 'bg-emerald-500 text-white' },
  venta:       { label: 'Venta',        cls: 'bg-primary-600 text-white' },
  intercambio: { label: 'Intercambio',  cls: 'bg-amber-500 text-white' },
};
const CONDITION_CONFIG = {
  nuevo:             { label: 'Nuevo',       cls: 'bg-success-500 text-white' },
  seminuevo:         { label: 'Seminuevo',   cls: 'bg-blue-500 text-white' },
  usado_buen_estado: { label: 'Buen estado', cls: 'bg-amber-500 text-white' },
  usado:             { label: 'Usado',       cls: 'bg-gray-500 text-white' },
};

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d`;
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

/* ─── Product card ──────────────────────────────────── */
function ProductCard({ supply }) {
  const img = supply.images?.find((i) => i.is_primary) || supply.images?.[0];
  const type = TYPE_CONFIG[supply.supply_type];
  const cond = CONDITION_CONFIG[supply.condition];

  return (
    <Link
      to={`/supplies/${supply.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {img ? (
          <img src={img.image_url} alt={supply.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
            {supply.category === 'ortopedico' ? '🦴' : supply.category === 'mobiliario' ? '🛏️' : '📦'}
          </div>
        )}

        {/* Condition badge — top left (like discount badge) */}
        {cond && (
          <span className={`absolute top-3 left-3 text-[11px] font-black px-2.5 py-1 rounded-full ${cond.cls} shadow-sm`}>
            {cond.label}
          </span>
        )}

        {/* Urgent badge */}
        {supply.is_urgent && (
          <span className="absolute top-3 right-3 text-[10px] font-black bg-accent-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <AlertTriangle size={9} /> Urgente
          </span>
        )}

        {/* Views */}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
          <Eye size={9} /> {supply.views_count}
        </span>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1 truncate">{supply.owner?.full_name}</p>
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-primary-700 transition-colors flex-1">
          {supply.title}
        </h3>

        {/* Price row */}
        {supply.supply_type === 'venta' && supply.price ? (
          <p className="text-lg font-black text-primary-700">
            ${supply.price.toLocaleString('es-MX')}
            <span className="text-xs font-normal text-gray-400 ml-1">MXN</span>
          </p>
        ) : (
          <p className={`text-sm font-black ${supply.supply_type === 'donacion' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {type?.label}
          </p>
        )}

        {/* City + time */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2.5 pt-2.5 border-t border-gray-50">
          {supply.city ? (
            <span className="flex items-center gap-1"><MapPin size={10} className="text-primary-400" />{supply.city}</span>
          ) : <span />}
          <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(supply.created_at)}</span>
        </div>

        {/* CTA */}
        <div className="mt-3 w-full py-2 rounded-xl bg-primary-600 group-hover:bg-primary-700 text-white text-xs font-bold text-center transition-colors">
          Ver detalles
        </div>
      </div>
    </Link>
  );
}

/* ─── Main ──────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recent, setRecent] = useState([]);
  const [urgent, setUrgent] = useState([]);
  const [allForMap, setAllForMap] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, urgentRes, mapRes] = await Promise.all([
          suppliesAPI.list({ limit: 10, sort_by: 'created_at', order: 'desc' }),
          suppliesAPI.list({ limit: 4, is_urgent: true }),
          suppliesAPI.list({ limit: 100, sort_by: 'created_at', order: 'desc' }),
        ]);
        setRecent(recentRes.data.items || []);
        setUrgent(urgentRes.data.items || []);
        setAllForMap(mapRes.data.items || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/supplies?query=${encodeURIComponent(searchQuery.trim())}`);
    else navigate('/supplies');
  };

  return (
    <div className="-mx-4 sm:-mx-6 bg-gray-50 min-h-screen">

      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="bg-primary-900 text-primary-200 text-center py-2 text-xs font-medium tracking-wide">
        Plataforma solidaria de insumos médicos en México &nbsp;·&nbsp; Dona, vende o intercambia con tu comunidad
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1b35] via-[#0d2147] to-[#0a1628]">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-medical-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 text-primary-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 bg-medical-400 rounded-full animate-pulse" />
                Red Solidaria · México 2026
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-white leading-[1.05] mb-5">
                Llegó tu mejor<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-300 via-cyan-300 to-primary-300">
                  momento para
                </span><br />
                <span className="text-white">cuidar</span>
              </h1>

              <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
                Encuentra, dona o comparte insumos médicos con personas que los necesitan.
                Sillas de ruedas, camas, prótesis y más — directo de tu comunidad.
              </p>

              {/* Search */}
              <div className="flex gap-2 max-w-xl mb-6">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Silla de ruedas, oxígeno, prótesis..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-medical-400/50 focus:bg-white/15 transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg whitespace-nowrap"
                >
                  Buscar
                </button>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-2">
                {['Silla de ruedas', 'Cama hospitalaria', 'Oxígeno', 'Muletas', 'Sangre O+'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/supplies?query=${encodeURIComponent(tag)}`)}
                    className="px-3 py-1 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 text-xs transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right — stat cards + category grid */}
            <div className="hidden lg:flex flex-col gap-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '500+', label: 'Usuarios', icon: Users },
                  { value: '150+', label: 'Donaciones', icon: Heart },
                  { value: '320+', label: 'Entregas', icon: Shield },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Category quick links */}
              <div className="grid grid-cols-4 gap-2">
                {COLLECTIONS.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.key}
                    to={`/supplies?category=${cat.key}`}
                    className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl p-3 text-center transition-all duration-200 hover:-translate-y-0.5 group"
                  >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{cat.icon}</div>
                    <p className="text-[10px] font-semibold text-slate-300 leading-tight">{cat.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP COLECCIONES (MedicalStore-style circles) ── */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-900 tracking-wide uppercase">Top Colecciones</h2>
            <Link to="/supplies" className="text-primary-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              Ver todos <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {COLLECTIONS.map((cat) => (
              <Link
                key={cat.key}
                to={`/supplies?category=${cat.key}`}
                className="group flex flex-col items-center gap-2.5"
              >
                <div className={`w-full aspect-square rounded-full bg-gradient-to-br ${cat.bg} flex items-center justify-center border-2 border-white shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 overflow-hidden`}>
                  <span className="text-3xl sm:text-4xl">{cat.icon}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-800 leading-tight">{cat.label}</p>
                  <p className="text-[10px] text-primary-600 hover:underline mt-0.5">Ver oferta</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── URGENT SUPPLIES ── */}
      {(urgent.length > 0 || loading) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-accent-500 rounded-full animate-pulse" />
              <h2 className="text-xl font-black text-gray-900">Solicitudes Urgentes</h2>
              <span className="text-xs bg-accent-100 text-accent-700 font-bold px-2.5 py-0.5 rounded-full border border-accent-200">
                Atención inmediata
              </span>
            </div>
            <Link to="/supplies?is_urgent=true" className="text-accent-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                    <div className="aspect-[4/3] bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-8 bg-gray-100 rounded-xl" />
                    </div>
                  </div>
                ))
              : urgent.map((s) => <ProductCard key={s.id} supply={s} />)
            }
          </div>
        </section>
      )}

      {/* ── BENTO CATEGORIES (MedicalStore grid style) ── */}
      <section className="bg-white border-y border-gray-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-black text-gray-900 tracking-wide uppercase mb-8">Explorar por tipo</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Large card */}
            <Link
              to="/supplies?supply_type=donacion"
              className="col-span-2 row-span-2 relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl overflow-hidden min-h-[240px] group hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">🎁</div>
                <p className="text-white/70 text-sm font-medium">Para quienes más lo necesitan</p>
                <p className="text-white text-2xl font-black leading-tight mt-1">Donaciones<br />Gratuitas</p>
                <span className="mt-3 inline-flex items-center gap-1 text-white/90 text-xs font-semibold">
                  Ver donaciones <ArrowRight size={12} />
                </span>
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            </Link>

            {/* Medium card - Venta */}
            <Link
              to="/supplies?supply_type=venta"
              className="relative bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl overflow-hidden min-h-[112px] group hover:shadow-xl transition-all duration-300"
            >
              <div className="p-5 h-full flex flex-col justify-between">
                <span className="text-3xl">💰</span>
                <div>
                  <p className="text-white font-black text-lg">Ventas</p>
                  <p className="text-primary-200 text-xs">Ver oferta →</p>
                </div>
              </div>
            </Link>

            {/* Medium card - Intercambio */}
            <Link
              to="/supplies?supply_type=intercambio"
              className="relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl overflow-hidden min-h-[112px] group hover:shadow-xl transition-all duration-300"
            >
              <div className="p-5 h-full flex flex-col justify-between">
                <span className="text-3xl">🔄</span>
                <div>
                  <p className="text-white font-black text-lg">Intercambios</p>
                  <p className="text-amber-100 text-xs">Ver oferta →</p>
                </div>
              </div>
            </Link>

            {/* Medium card - Sangre */}
            <Link
              to="/supplies?category=sangre"
              className="relative bg-gradient-to-br from-red-500 to-rose-700 rounded-3xl overflow-hidden min-h-[112px] group hover:shadow-xl transition-all duration-300"
            >
              <div className="p-5 h-full flex flex-col justify-between">
                <span className="text-3xl">🩸</span>
                <div>
                  <p className="text-white font-black text-lg">Banco de Sangre</p>
                  <p className="text-red-200 text-xs">Ver donantes →</p>
                </div>
              </div>
            </Link>

            {/* Medium card - Nuevo */}
            <Link
              to="/supplies?condition=nuevo"
              className="relative bg-gradient-to-br from-violet-500 to-purple-700 rounded-3xl overflow-hidden min-h-[112px] group hover:shadow-xl transition-all duration-300"
            >
              <div className="p-5 h-full flex flex-col justify-between">
                <span className="text-3xl">✨</span>
                <div>
                  <p className="text-white font-black text-lg">Estado Nuevo</p>
                  <p className="text-violet-200 text-xs">Ver colección →</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS DESTACADOS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-wide uppercase">Publicaciones Recientes</h2>
            <p className="text-gray-400 text-sm mt-0.5">Últimos insumos disponibles en la plataforma</p>
          </div>
          <Link to="/supplies" className="text-primary-600 font-semibold text-sm flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-5 bg-gray-100 rounded w-1/3" />
                  <div className="h-8 bg-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recent.map((s) => <ProductCard key={s.id} supply={s} />)}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Aún no hay publicaciones</h3>
            <p className="text-gray-400 mb-6">Sé la primera persona en compartir un insumo médico</p>
            {user && (
              <Link to="/publish" className="btn-primary inline-flex items-center gap-2">
                Publicar ahora <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border-y border-gray-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-primary-600 font-bold text-xs bg-primary-50 px-4 py-1.5 rounded-full mb-3 uppercase tracking-wide">
              <Zap size={13} /> Simple y rápido
            </span>
            <h2 className="text-2xl font-black text-gray-900">¿Cómo funciona?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '01', icon: Package,     title: 'Publica o busca',           desc: 'Comparte un insumo que ya no uses o encuentra lo que necesitas.',       color: 'bg-primary-600' },
              { step: '02', icon: HandHeart,   title: 'Conecta y coordina',        desc: 'Manda un mensaje, acuerda la entrega y coordina con el proveedor.',     color: 'bg-medical-600' },
              { step: '03', icon: CheckCircle, title: '¡Listo! Ayudas y recibes',  desc: 'Completa el intercambio. Cada acción suma a la comunidad de salud.',    color: 'bg-success-600' },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="bg-gray-50 rounded-3xl p-7 border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <span className="absolute top-4 right-5 text-7xl font-black text-gray-100 group-hover:text-primary-50 transition-colors leading-none">{step}</span>
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5 shadow-md relative z-10`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2 relative z-10">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed relative z-10">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section className="bg-gradient-to-br from-[#0f1b35] to-[#0a2850] py-14 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-medical-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <span className="inline-flex items-center gap-2 text-medical-300 font-semibold text-xs bg-medical-900/50 border border-medical-700/50 px-4 py-1.5 rounded-full mb-4 uppercase tracking-wide">
                <MapPin size={12} /> Mapa interactivo
              </span>
              <h2 className="text-3xl font-black mb-4 leading-tight">
                Encuentra insumos <span className="text-medical-300">cerca de ti</span>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                Visualiza en el mapa todos los insumos disponibles por ciudad en México. Haz clic en un marcador para ver los productos disponibles.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowMap((v) => !v)}
                  className="bg-medical-500 hover:bg-medical-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg"
                >
                  <MapPin size={15} /> {showMap ? 'Ocultar mapa' : 'Ver mapa'}
                </button>
                <Link to="/supplies" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                  Ver lista completa
                </Link>
              </div>
            </div>

            <div>
              {showMap ? (
                <Suspense fallback={
                  <div className="h-[340px] rounded-2xl bg-white/10 flex items-center justify-center text-white/50 text-sm">Cargando mapa...</div>
                }>
                  <SupplyMap supplies={allForMap} height="340px" />
                </Suspense>
              ) : (
                <div
                  onClick={() => setShowMap(true)}
                  className="h-[340px] rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/15 transition-all duration-300 group"
                >
                  <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">🗺️</div>
                  <p className="text-white font-bold text-lg mb-1">Mapa de Insumos</p>
                  <p className="text-slate-400 text-sm">Haz clic para cargar el mapa interactivo</p>
                  <div className="mt-4 bg-medical-500/80 hover:bg-medical-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <MapPin size={14} /> Abrir mapa
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      {!user && (
        <section className="bg-gradient-to-r from-primary-600 via-primary-700 to-medical-700 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
            <div className="text-5xl mb-5">❤️‍🩹</div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              ¿Listo para ayudar o ser ayudado?
            </h2>
            <p className="text-primary-200 text-base mb-8 max-w-md mx-auto">
              Únete a cientos de personas que ya comparten y reciben apoyo médico en México
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="bg-white text-primary-700 hover:bg-gray-50 px-8 py-3.5 rounded-xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2">
                <Users size={17} /> Crear cuenta gratis
              </Link>
              <Link to="/supplies" className="bg-white/15 hover:bg-white/25 border border-white/30 text-white px-8 py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2">
                <Search size={17} /> Explorar insumos
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a1628] text-gray-500 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-medical-500 rounded-xl flex items-center justify-center shadow">
                <span className="text-white font-black text-sm">L</span>
              </div>
              <div>
                <p className="text-white font-black text-base leading-tight">Life<span className="text-medical-400">Link</span></p>
                <p className="text-gray-600 text-xs">© 2026 · México</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Plataforma solidaria de insumos médicos — Hecha con ❤️ para México
            </p>
            <div className="flex gap-5 text-xs">
              {[
                { to: '/supplies',     label: 'Insumos' },
                { to: '/register',     label: 'Registro' },
                { to: '/supplies?category=sangre', label: 'Banco de Sangre' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
