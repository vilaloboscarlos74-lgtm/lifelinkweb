import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { suppliesAPI, requestsAPI, getMediaUrl } from '../services/api';
import {
  MapPin, User, Star, Clock, Eye, Heart, Send, ArrowLeft,
  AlertTriangle, Package, Tag, ChevronLeft, ChevronRight,
  Share2, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MY_REQUEST_STATUS = {
  pendiente:  { label: 'Solicitud enviada — esperando respuesta', color: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-400' },
  aceptada:   { label: '¡Solicitud aceptada! Ya puedes chatear',  color: 'bg-success-50 border-success-200 text-success-800', dot: 'bg-success-500' },
  rechazada:  { label: 'Tu solicitud fue rechazada',              color: 'bg-red-50 border-red-200 text-red-800', dot: 'bg-red-400' },
  cancelada:  { label: 'Cancelaste tu solicitud',                 color: 'bg-gray-50 border-gray-200 text-gray-600', dot: 'bg-gray-400' },
  completada: { label: 'Entrega completada',                      color: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-400' },
};

const CONDITION_LABELS = {
  nuevo: { label: 'Nuevo', cls: 'bg-success-100 text-success-700' },
  seminuevo: { label: 'Seminuevo', cls: 'bg-blue-100 text-blue-700' },
  usado_buen_estado: { label: 'Buen estado', cls: 'bg-amber-100 text-amber-700' },
  usado: { label: 'Usado', cls: 'bg-gray-100 text-gray-600' },
};
const TYPE_LABELS = {
  donacion: { label: 'Donación gratuita', cls: 'badge-donation' },
  venta: { label: 'Venta', cls: 'badge-sale' },
  intercambio: { label: 'Intercambio', cls: 'badge-exchange' },
};
const CATEGORY_LABELS = {
  ortopedico: '🦴 Ortopédico', rehabilitacion: '💪 Rehabilitación',
  diagnostico: '🔬 Diagnóstico', protesis: '🦿 Prótesis',
  mobiliario: '🛏️ Mobiliario', consumibles: '💉 Consumibles',
  sangre: '🩸 Sangre', otro: '📦 Otro',
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}

export default function SupplyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [supply, setSupply] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [myRequest, setMyRequest] = useState(null);

  useEffect(() => {
    suppliesAPI.get(id)
      .then((r) => setSupply(r.data))
      .catch(() => navigate('/supplies'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      suppliesAPI.getFavorites(),
      requestsAPI.getMyForSupply(id),
    ]).then(([favRes, reqRes]) => {
      if (favRes.status === 'fulfilled') {
        const favs = favRes.value.data || [];
        setIsFavorite(favs.some((s) => s.id === parseInt(id)));
      }
      if (reqRes.status === 'fulfilled') setMyRequest(reqRes.value.data || null);
    });
  }, [id, user]);

  const handleContact = async () => {
    if (!user) return navigate('/login');
    if (!message.trim()) return toast.error('Escribe un mensaje para el proveedor');
    setSending(true);
    try {
      const res = await requestsAPI.create({ receiver_id: supply.owner.id, supply_id: supply.id, message: message.trim() });
      toast.success('¡Solicitud enviada! El proveedor recibirá tu mensaje.');
      setMessage('');
      setMyRequest(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al enviar solicitud');
    } finally {
      setSending(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) return navigate('/login');
    setFavLoading(true);
    try {
      const r = await suppliesAPI.toggleFavorite(supply.id);
      setIsFavorite(r.data.is_favorite);
      toast.success(r.data.is_favorite ? 'Guardado en favoritos' : 'Eliminado de favoritos');
    } catch {
      toast.error('Error al actualizar favoritos');
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: supply.title, url }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles');
      } catch {
        toast.error('No se pudo copiar el enlace');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
            <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (!supply) return null;

  const images = supply.images || [];
  const prevImg = () => setCurrentImg((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setCurrentImg((i) => (i + 1) % images.length);
  const type = TYPE_LABELS[supply.supply_type] || { label: supply.supply_type, cls: 'badge' };
  const condition = CONDITION_LABELS[supply.condition];
  const isOwner = user?.id === supply.owner?.id;
  const activeRequest = myRequest && !['rechazada', 'cancelada'].includes(myRequest.status);
  const canContact = user && !isOwner && supply.status === 'disponible' && !activeRequest;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Volver a la búsqueda
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Images + Description ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Image gallery */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-hidden">
            <div className="relative aspect-[4/3] bg-gray-50 group">
              {images.length > 0 ? (
                <>
                  <img
                    src={getMediaUrl(images[currentImg]?.image_url)}
                    alt={supply.title}
                    className="w-full h-full object-contain"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImg}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-xl shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextImg}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-xl shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImg(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/60'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <Package size={64} />
                  <p className="text-sm mt-3">Sin imágenes</p>
                </div>
              )}

              {/* Overlays */}
              {supply.is_urgent && (
                <span className="absolute top-4 left-4 badge-urgent flex items-center gap-1 shadow-sm">
                  <AlertTriangle size={12} /> Urgente
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      i === currentImg ? 'border-primary-500 shadow-sm' : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={getMediaUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Tag size={16} className="text-primary-600" />
              Descripción
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{supply.description}</p>

            {/* Specs grid */}
            <div className="mt-6 border-t border-gray-50 dark:border-gray-700 pt-4">
              <InfoRow label="Categoría" value={CATEGORY_LABELS[supply.category]} />
              <InfoRow label="Condición" value={condition?.label} />
              <InfoRow label="Marca" value={supply.brand} />
              <InfoRow label="Modelo" value={supply.model} />
              <InfoRow label="Cantidad" value={supply.quantity > 1 ? supply.quantity : null} />
              <InfoRow label="Ubicación" value={supply.city ? `${supply.city}${supply.state ? `, ${supply.state}` : ''}` : null} />
            </div>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Price & title card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-6">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={type.cls}>{type.label}</span>
              {condition && (
                <span className={`badge ${condition.cls}`}>{condition.label}</span>
              )}
            </div>

            <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-3">{supply.title}</h1>

            {supply.supply_type === 'venta' && supply.price ? (
              <div className="mb-4">
                <p className="text-3xl font-black text-primary-700">
                  ${supply.price.toLocaleString('es-MX')}
                  <span className="text-sm font-normal text-gray-400 ml-1">MXN</span>
                </p>
              </div>
            ) : supply.supply_type === 'donacion' ? (
              <p className="text-xl font-black text-medical-600 mb-4">¡Gratis!</p>
            ) : null}

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400 pt-3 border-t border-gray-50 dark:border-gray-700">
              {supply.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-primary-500" />
                  {supply.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={11} /> {supply.views_count} vistas
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(supply.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleFavorite}
                disabled={favLoading}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isFavorite
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500'
                }`}
              >
                <Heart size={15} className={isFavorite ? 'fill-rose-500 text-rose-500' : ''} />
                {isFavorite ? 'Guardado' : 'Guardar'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 transition-all"
              >
                <Share2 size={15} />
                Compartir
              </button>
            </div>
          </div>

          {/* Owner card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-5">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Publicado por</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {supply.owner?.avatar_url ? (
                  <img src={getMediaUrl(supply.owner.avatar_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-primary-700">
                    {supply.owner?.full_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{supply.owner?.full_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">@{supply.owner?.username}</p>
                {supply.owner?.rating_avg > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} fill="#f59e0b" className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-600">
                      {supply.owner?.rating_avg?.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mi solicitud — estado actual */}
          {myRequest && !isOwner && (() => {
            const cfg = MY_REQUEST_STATUS[myRequest.status] || MY_REQUEST_STATUS.pendiente;
            return (
              <div className={`rounded-2xl border p-4 ${cfg.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                  <p className="text-sm font-bold">{cfg.label}</p>
                </div>
                {myRequest.status === 'aceptada' && (
                  <Link
                    to={`/messages/${myRequest.id}`}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-all"
                  >
                    <MessageCircle size={15} /> Ir al chat
                  </Link>
                )}
                {myRequest.status === 'pendiente' && (
                  <p className="text-xs opacity-70 mt-1">El proveedor revisará tu solicitud pronto.</p>
                )}
                {['rechazada', 'cancelada'].includes(myRequest.status) && (
                  <p className="text-xs opacity-70 mt-1">Puedes enviar una nueva solicitud si el insumo sigue disponible.</p>
                )}
                <Link to="/requests" className="block mt-2 text-xs font-semibold underline opacity-70 hover:opacity-100">
                  Ver todas mis solicitudes
                </Link>
              </div>
            );
          })()}

          {/* Contact card */}
          {canContact && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-5">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                Contactar al proveedor
              </h3>
              <div className="relative mb-3">
                <textarea
                  className="input-field resize-none text-sm"
                  placeholder={`Hola, me interesa tu ${supply.supply_type === 'donacion' ? 'donación' : 'oferta'} de "${supply.title}"...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                {message.length > 400 && (
                  <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-400">
                    {message.length}/500
                  </span>
                )}
              </div>
              <button
                onClick={handleContact}
                disabled={sending || !message.trim()}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send size={16} /> Enviar Solicitud</>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                El proveedor recibirá una notificación con tu solicitud
              </p>
            </div>
          )}

          {/* Owner's own supply */}
          {isOwner && (
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800/50 p-5">
              <p className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-2 flex items-center gap-1.5">
                <Package size={14} /> Esta es tu publicación
              </p>
              <div className="flex gap-2">
                <Link
                  to={`/my-supplies`}
                  className="flex-1 btn-secondary text-xs text-center"
                >
                  Mis publicaciones
                </Link>
              </div>
            </div>
          )}

          {/* Not logged in */}
          {!user && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-5 text-center">
              <MessageCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">¿Te interesa este insumo?</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Inicia sesión para contactar al proveedor</p>
              <Link to="/login" className="btn-primary w-full block text-center">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-secondary w-full block text-center mt-2">
                Crear cuenta gratis
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
