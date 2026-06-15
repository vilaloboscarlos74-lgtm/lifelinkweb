import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { suppliesAPI, authAPI, statsAPI, getMediaUrl } from '../services/api';
import { MEETING_POINTS } from '../data/meetingPoints';
import {
  Search, ArrowRight, Heart, Shield, Users, Droplets,
  MapPin, Package, HandHeart, CheckCircle, ChevronRight,
  Zap, Eye, Clock, AlertTriangle, Train, X, Mail,
  Bone, Dumbbell, Stethoscope, Accessibility, BedDouble, Syringe,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SupplyMap = lazy(() => import('../components/SupplyMap'));
const MeetingPointsMap = lazy(() => import('../components/MeetingPointsMap'));

/* ─── Data ─────────────────────────────────────────── */
const COLLECTIONS = [
  { key: 'ortopedico',    Icon: Bone,         label: 'Ortopédico',     glow: 'cat-glow-amber',  iconCls: 'icon-glow-amber',  glowIcon: 'glow-icon-amber',  border: 'hover:border-amber-500/40' },
  { key: 'rehabilitacion',Icon: Dumbbell,     label: 'Rehabilitación', glow: 'cat-glow-blue',   iconCls: 'icon-glow-blue',   glowIcon: 'glow-icon-blue',   border: 'hover:border-sky-500/40' },
  { key: 'diagnostico',   Icon: Stethoscope,  label: 'Diagnóstico',    glow: 'cat-glow-purple', iconCls: 'icon-glow-purple', glowIcon: 'glow-icon-purple', border: 'hover:border-purple-500/40' },
  { key: 'protesis',      Icon: Accessibility,label: 'Prótesis',       glow: 'cat-glow-slate',  iconCls: 'icon-glow-slate',  glowIcon: 'glow-icon-rose',   border: 'hover:border-slate-400/40' },
  { key: 'mobiliario',    Icon: BedDouble,    label: 'Mobiliario',     glow: 'cat-glow-teal',   iconCls: 'icon-glow-teal',   glowIcon: 'glow-icon-teal',   border: 'hover:border-teal-500/40' },
  { key: 'consumibles',   Icon: Syringe,      label: 'Consumibles',    glow: 'cat-glow-rose',   iconCls: 'icon-glow-rose',   glowIcon: 'glow-icon-rose',   border: 'hover:border-rose-500/40' },
  { key: 'sangre',        Icon: Droplets,     label: 'Sangre',         glow: 'cat-glow-red',    iconCls: 'icon-glow-red',    glowIcon: 'glow-icon-red',    border: 'hover:border-red-500/40' },
  { key: 'otro',          Icon: Package,      label: 'Otros',          glow: 'cat-glow-indigo', iconCls: 'icon-glow-blue',   glowIcon: 'glow-icon-blue',   border: 'hover:border-indigo-500/40' },
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
      className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {img ? (
          <img src={getMediaUrl(img.image_url)} alt={supply.title}
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
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 truncate">{supply.owner?.full_name}</p>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug mb-2 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors flex-1">
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
        <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-2.5 pt-2.5 border-t border-gray-50 dark:border-gray-700">
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

/* ─── Animated counter hook ─────────────────────────── */
function useCounter(target, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function StatCard({ value, label, icon: Icon, color }) {
  const animated = useCounter(value);
  return (
    <div className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl p-4 text-center">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-2xl font-black text-white">
        {value > 0 ? animated.toLocaleString('es-MX') : '—'}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recent, setRecent] = useState([]);
  const [urgent, setUrgent] = useState([]);
  const [allForMap, setAllForMap] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [showMeetingMap, setShowMeetingMap] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendEmailCooldown, setResendEmailCooldown] = useState(0);

  useEffect(() => {
    if (resendEmailCooldown <= 0) return;
    const t = setTimeout(() => setResendEmailCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendEmailCooldown]);

  useEffect(() => {
    const fetchData = async () => {
      const [recentRes, urgentRes, mapRes, statsRes] = await Promise.allSettled([
        suppliesAPI.list({ limit: 10, sort_by: 'created_at', order: 'desc' }),
        suppliesAPI.list({ limit: 4, is_urgent: true }),
        suppliesAPI.list({ limit: 100, sort_by: 'created_at', order: 'desc' }),
        statsAPI.getPublic(),
      ]);
      if (recentRes.status === 'fulfilled') setRecent(recentRes.value.data.items || []);
      if (urgentRes.status === 'fulfilled') setUrgent(urgentRes.value.data.items || []);
      if (mapRes.status === 'fulfilled') setAllForMap(mapRes.value.data.items || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/supplies?query=${encodeURIComponent(searchQuery.trim())}`);
    else navigate('/supplies');
  };

  const handleResendEmail = async () => {
    if (resendingEmail || resendEmailCooldown > 0) return;
    setResendingEmail(true);
    try {
      await authAPI.resendVerification(user.email);
      toast.success('Enlace de verificación enviado. Revisa tu correo.');
      setResendEmailCooldown(60);
    } catch (err) {
      const detail = err?.response?.data?.detail || '';
      if (detail.includes('configurado') || detail.includes('email')) {
        toast.error('El servidor de correo no está configurado aún. Contacta al administrador.');
      } else {
        toast('Si el correo está registrado, recibirás el enlace.', { icon: '📧' });
      }
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="-mx-4 sm:-mx-6 bg-gray-50 dark:bg-gray-900 min-h-screen">

      {/* ── BANNER: VERIFICAR EMAIL ── */}
      {user && !user.email_verified && !emailBannerDismissed && (
        <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail size={15} className="flex-shrink-0" />
            <span>Verifica tu correo electrónico para acceder a todas las funciones.</span>
            <button
              onClick={handleResendEmail}
              disabled={resendingEmail || resendEmailCooldown > 0}
              className="underline font-bold hover:no-underline disabled:opacity-60 disabled:no-underline ml-1"
            >
              {resendingEmail
                ? 'Enviando...'
                : resendEmailCooldown > 0
                  ? `Reenviar en ${resendEmailCooldown}s`
                  : 'Reenviar enlace'}
            </button>
          </div>
          <button onClick={() => setEmailBannerDismissed(true)} className="flex-shrink-0 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

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
              {/* Stats row — glassmorphism */}
              <div className="glass rounded-2xl px-5 py-4 flex items-center justify-around gap-2 shadow-inner-glow">
                {[
                  { value: stats?.users || 0,              label: 'Usuarios',   icon: Users,  cls: 'icon-glow-blue' },
                  { value: stats?.donations || 0,          label: 'Donaciones', icon: Heart,  cls: 'icon-glow-rose' },
                  { value: stats?.completed_requests || 0, label: 'Entregas',   icon: Shield, cls: 'icon-glow-teal' },
                ].map(({ value, label, icon: Icon, cls }, i) => {
                  const animated = value; // StatCard handles animation
                  return (
                    <div key={label} className={`flex flex-col items-center gap-1.5 ${i !== 2 ? 'border-r border-white/10 pr-4 mr-1' : ''}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls}`}>
                        <Icon size={16} />
                      </div>
                      <p className="text-2xl font-black text-white tabular-nums">
                        {value > 0 ? value.toLocaleString('es-MX') : '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Category quick links */}
              <div className="grid grid-cols-4 gap-2">
                {COLLECTIONS.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.key}
                    to={`/supplies?category=${cat.key}`}
                    className="bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl p-3 text-center transition-all duration-200 hover:-translate-y-1 group"
                  >
                    <div className="flex justify-center mb-1.5">
                      <cat.Icon
                        size={20}
                        strokeWidth={1.75}
                        className="text-white/75 group-hover:text-white group-hover:scale-110 transition-all duration-200"
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-300 group-hover:text-white leading-tight transition-colors duration-200">{cat.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP COLECCIONES ── */}
      <section className="bg-slate-950 border-b border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white tracking-wide uppercase">Top Colecciones</h2>
            <Link to="/supplies" className="text-sky-400 font-semibold text-sm flex items-center gap-1 hover:text-sky-300 transition-colors">
              Ver todos <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {COLLECTIONS.map((cat) => (
              <Link
                key={cat.key}
                to={`/supplies?category=${cat.key}`}
                className={`group cat-card ${cat.glow} ${cat.border} flex flex-col items-center gap-3 p-3 sm:p-4`}
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:brightness-125 ${cat.iconCls}`}>
                  <cat.Icon
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    strokeWidth={1.8}
                  />
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-400 group-hover:text-white leading-tight text-center transition-colors duration-200">
                  {cat.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── URGENT SUPPLIES ── */}
      {(urgent.length > 0 || loading) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-3 h-3 bg-accent-500 rounded-full animate-pulse shrink-0" />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Solicitudes Urgentes</h2>
              <span className="text-xs bg-accent-500 text-white font-bold px-2.5 py-1 rounded-full">
                ⚡ Atención inmediata
              </span>
            </div>
            <Link to="/supplies?is_urgent=true" className="text-accent-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
                    <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                    </div>
                  </div>
                ))
              : urgent.map((s) => <ProductCard key={s.id} supply={s} />)
            }
          </div>
        </section>
      )}

      {/* ── BENTO CATEGORIES ── */}
      <section className="bg-slate-950 border-y border-white/5 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-black text-white tracking-wide uppercase mb-8">Explorar por tipo</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

            {/* Hero card — Donaciones */}
            <Link to="/supplies?supply_type=donacion"
              className="col-span-2 row-span-2 cat-card cat-glow-teal hover:border-teal-500/40 group min-h-[240px] flex flex-col justify-end p-7 relative overflow-hidden">
              <div className="absolute top-5 right-5 w-20 h-20 rounded-2xl icon-glow-teal flex items-center justify-center opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                <HandHeart size={40} strokeWidth={1.4} />
              </div>
              <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)' }} />
              <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wide">Para quienes más lo necesitan</p>
              <p className="text-white text-3xl font-black leading-tight mb-3">Donaciones<br />Gratuitas</p>
              <span className="inline-flex items-center gap-1.5 text-teal-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                Explorar <ArrowRight size={14} />
              </span>
            </Link>

            {/* Venta */}
            <Link to="/supplies?supply_type=venta"
              className="cat-card cat-glow-blue hover:border-sky-500/40 group min-h-[112px] flex flex-col justify-between p-5">
              <div className="w-10 h-10 rounded-xl icon-glow-blue flex items-center justify-center">
                <CheckCircle size={20} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-white font-black text-lg">Ventas</p>
                <p className="text-sky-400 text-xs font-medium flex items-center gap-1">Ver oferta <ArrowRight size={11} /></p>
              </div>
            </Link>

            {/* Intercambio */}
            <Link to="/supplies?supply_type=intercambio"
              className="cat-card cat-glow-amber hover:border-amber-500/40 group min-h-[112px] flex flex-col justify-between p-5">
              <div className="w-10 h-10 rounded-xl icon-glow-amber flex items-center justify-center transition-all">
                <ArrowRight size={20} strokeWidth={1.8} className="rotate-45" />
              </div>
              <div>
                <p className="text-white font-black text-lg">Intercambios</p>
                <p className="text-amber-400 text-xs font-medium flex items-center gap-1">Ver oferta <ArrowRight size={11} /></p>
              </div>
            </Link>

            {/* Sangre */}
            <Link to="/donors"
              className="cat-card cat-glow-red hover:border-red-500/40 group min-h-[112px] flex flex-col justify-between p-5">
              <div className="w-10 h-10 rounded-xl icon-glow-red flex items-center justify-center transition-all">
                <Droplets size={20} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-white font-black text-lg">Banco de Sangre</p>
                <p className="text-red-400 text-xs font-medium flex items-center gap-1">Ver donantes <ArrowRight size={11} /></p>
              </div>
            </Link>

            {/* Nuevo */}
            <Link to="/supplies?condition=nuevo"
              className="cat-card cat-glow-purple hover:border-purple-500/40 group min-h-[112px] flex flex-col justify-between p-5">
              <div className="w-10 h-10 rounded-xl icon-glow-purple flex items-center justify-center transition-all">
                <Zap size={20} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-white font-black text-lg">Estado Nuevo</p>
                <p className="text-purple-400 text-xs font-medium flex items-center gap-1">Ver colección <ArrowRight size={11} /></p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS DESTACADOS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-wide uppercase">Publicaciones Recientes</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Últimos insumos disponibles en la plataforma</p>
          </div>
          <Link to="/supplies" className="text-primary-600 font-semibold text-sm flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recent.map((s) => <ProductCard key={s.id} supply={s} />)}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl py-20 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Aún no hay publicaciones</h3>
            <p className="text-gray-400 dark:text-gray-500 mb-6">Sé la primera persona en compartir un insumo médico</p>
            {user && (
              <Link to="/publish" className="btn-primary inline-flex items-center gap-2">
                Publicar ahora <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-primary-600 font-bold text-xs bg-primary-50 dark:bg-primary-900/30 px-4 py-1.5 rounded-full mb-3 uppercase tracking-wide">
              <Zap size={13} /> Simple y rápido
            </span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">¿Cómo funciona?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '01', icon: Package,     title: 'Publica o busca',           desc: 'Comparte un insumo que ya no uses o encuentra lo que necesitas.',       color: 'bg-primary-600' },
              { step: '02', icon: HandHeart,   title: 'Conecta y coordina',        desc: 'Manda un mensaje, acuerda la entrega y coordina con el proveedor.',     color: 'bg-medical-600' },
              { step: '03', icon: CheckCircle, title: '¡Listo! Ayudas y recibes',  desc: 'Completa el intercambio. Cada acción suma a la comunidad de salud.',    color: 'bg-success-600' },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-7 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <span className="absolute top-4 right-5 text-7xl font-black text-gray-100 dark:text-gray-700 group-hover:text-primary-50 dark:group-hover:text-primary-900/30 transition-colors leading-none">{step}</span>
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5 shadow-md relative z-10`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-2 relative z-10">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed relative z-10">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAPA UNIFICADO ── */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 py-14 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-medical-400/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/8 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-2 text-medical-300 font-semibold text-xs bg-medical-900/50 border border-medical-700/50 px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                <MapPin size={11} /> Mapa interactivo
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Encuentra lo que necesitas <span className="text-medical-300">cerca de ti</span>
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-lg">
                Insumos disponibles en todo México y puntos de encuentro seguros para coordinar entregas en CDMX y Edomex.
              </p>
            </div>

            {/* Tabs para cambiar el mapa */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { setShowMap(true); setShowMeetingMap(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${showMap && !showMeetingMap
                    ? 'bg-medical-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'}`}
              >
                <Package size={14} /> Insumos
              </button>
              <button
                onClick={() => { setShowMeetingMap(true); setShowMap(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${showMeetingMap && !showMap
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'}`}
              >
                <Train size={14} /> Puntos seguros
              </button>
            </div>
          </div>

          {/* Stats mini */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { value: MEETING_POINTS.filter(p => p.type === 'metro_cdmx').length,   label: 'Metro CDMX',   emoji: '🚇', color: 'border-blue-500/30 bg-blue-500/10' },
              { value: MEETING_POINTS.filter(p => p.type === 'metro_edomex').length, label: 'EDOMEX',       emoji: '🚈', color: 'border-purple-500/30 bg-purple-500/10' },
              { value: MEETING_POINTS.filter(p => p.type === 'hospital').length,     label: 'Hospitales',   emoji: '🏥', color: 'border-red-500/30 bg-red-500/10' },
              { value: allForMap.length,                                              label: 'Insumos activos', emoji: '📦', color: 'border-medical-500/30 bg-medical-500/10' },
            ].map(({ value, label, emoji, color }) => (
              <div key={label} className={`rounded-xl p-3 text-center border ${color}`}>
                <p className="text-xl">{emoji}</p>
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Mapa */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {!showMap && !showMeetingMap ? (
              <div className="h-[420px] bg-white/5 flex flex-col items-center justify-center gap-4 cursor-pointer group"
                onClick={() => setShowMap(true)}>
                <div className="text-7xl group-hover:scale-110 transition-transform duration-300">🗺️</div>
                <p className="text-white font-bold text-lg">Haz clic para cargar el mapa</p>
                <p className="text-slate-400 text-sm">Selecciona "Insumos" o "Puntos seguros" arriba</p>
              </div>
            ) : showMap ? (
              <Suspense fallback={<div className="h-[420px] bg-white/5 flex items-center justify-center text-white/50">Cargando mapa de insumos...</div>}>
                <SupplyMap supplies={allForMap} height="420px" />
              </Suspense>
            ) : (
              <Suspense fallback={<div className="h-[420px] bg-white/5 flex items-center justify-center text-white/50">Cargando puntos de encuentro...</div>}>
                <MeetingPointsMap height="420px" showLegend />
              </Suspense>
            )}
          </div>

          {/* Links adicionales */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Link to="/supplies"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
              Ver todos los insumos <ArrowRight size={13} />
            </Link>
            <Link to="/puntos-encuentro"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
              Ver todos los puntos <ArrowRight size={13} />
            </Link>
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
