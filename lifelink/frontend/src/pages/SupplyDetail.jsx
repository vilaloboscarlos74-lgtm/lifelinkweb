import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { suppliesAPI, requestsAPI } from '../services/api';
import {
  MapPin, User, Star, Clock, Eye, Heart, Send, ArrowLeft,
  AlertTriangle, Package, Tag, ChevronLeft, ChevronRight,
  Share2, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

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
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
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

  useEffect(() => {
    suppliesAPI.get(id)
      .then((r) => setSupply(r.data))
      .catch(() => navigate('/supplies'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!user) return;
    suppliesAPI.getFavorites()
      .then((r) => {
        const favs = r.data || [];
        setIsFavorite(favs.some((s) => s.id === parseInt(id)));
      })
      .catch(() => {});
  }, [id, user]);

  const handleContact = async () => {
    if (!user) return navigate('/login');
    if (!message.trim()) return toast.error('Escribe un mensaje para el proveedor');
    setSending(true);
    try {
      await requestsAPI.create({ receiver_id: supply.owner.id, supply_id: supply.id, message: message.trim() });
      toast.success('¡Solicitud enviada! El proveedor recibirá tu mensaje.');
      setMessage('');
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
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const prevImg = () => setCurrentImg((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setCurrentImg((i) => (i + 1) % images.length);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-24 bg-gray-100 rounded-lg mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (!supply) return null;

  const images = supply.images || [];
  const type = TYPE_LABELS[supply.supply_type] || { label: supply.supply_type, cls: 'badge' };
  const condition = CONDITION_LABELS[supply.condition];
  const isOwner = user?.id === supply.owner.id;
  const canContact = user && !isOwner && supply.status === 'disponible';

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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="relative aspect-[4/3] bg-gray-50 group">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImg]?.image_url}
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
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag size={16} className="text-primary-600" />
              Descripción
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{supply.description}</p>

            {/* Specs grid */}
            <div className="mt-6 border-t border-gray-50 pt-4">
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={type.cls}>{type.label}</span>
              {condition && (
                <span className={`badge ${condition.cls}`}>{condition.label}</span>
              )}
            </div>

            <h1 className="text-xl font-black text-gray-900 leading-tight mb-3">{supply.title}</h1>

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
            <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400 pt-3 border-t border-gray-50">
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Publicado por</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {supply.owner.avatar_url ? (
                  <img src={supply.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-primary-700">
                    {supply.owner.full_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{supply.owner.full_name}</p>
                <p className="text-xs text-gray-400">@{supply.owner.username}</p>
                {supply.owner.rating_avg > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} fill="#f59e0b" className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-600">
                      {supply.owner.rating_avg.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact card */}
          {canContact && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
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
            <div className="bg-primary-50 rounded-2xl border border-primary-100 p-5">
              <p className="text-xs font-bold text-primary-700 mb-2 flex items-center gap-1.5">
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 text-center">
              <MessageCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">¿Te interesa este insumo?</p>
              <p className="text-xs text-gray-400 mb-4">Inicia sesión para contactar al proveedor</p>
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
