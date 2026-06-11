import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersAPI, reviewsAPI, suppliesAPI, getMediaUrl } from '../services/api';
import BadgeList from '../components/BadgeList';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Star, Shield, Droplets, Package,
  ArrowLeft, User, Clock, AlertTriangle, Eye,
} from 'lucide-react';

const BLOOD_COLORS = {
  'O+': 'from-red-500 to-rose-600',
  'O-': 'from-red-700 to-rose-800',
  'A+': 'from-orange-500 to-red-500',
  'A-': 'from-orange-700 to-red-700',
  'B+': 'from-purple-500 to-violet-600',
  'B-': 'from-purple-700 to-violet-800',
  'AB+': 'from-blue-500 to-indigo-600',
  'AB-': 'from-blue-700 to-indigo-800',
};

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return days < 30 ? `${days}d` : new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function UserPublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) { setNotFound(true); setLoading(false); return; }

    Promise.allSettled([
      usersAPI.getPublicProfile(userId),
      reviewsAPI.getForUser(userId),
      suppliesAPI.list({ limit: 6, sort_by: 'created_at', order: 'desc', owner_id: userId }),
    ]).then(([profileRes, reviewsRes, suppliesRes]) => {
      if (profileRes.status === 'rejected') {
        setNotFound(true);
      } else {
        setProfile(profileRes.value.data);
        if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.data || []);
        if (suppliesRes.status === 'fulfilled') setSupplies(suppliesRes.value.data?.items || []);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="h-8 bg-gray-100 rounded-xl w-40" />
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-5">
        <div className="w-24 h-24 bg-gray-100 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-5 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="max-w-3xl mx-auto text-center py-20">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Usuario no encontrado</h2>
      <p className="text-gray-400 text-sm mb-6">Este perfil no existe o no está disponible.</p>
      <Link to="/donors" className="btn-primary inline-flex items-center gap-2">
        <ArrowLeft size={16} /> Volver a donantes
      </Link>
    </div>
  );

  const gradient = profile.blood_type ? (BLOOD_COLORS[profile.blood_type] || 'from-red-500 to-rose-600') : 'from-primary-500 to-medical-500';

  return (
    <div className="max-w-3xl mx-auto">

      {/* Back */}
      <Link to="/donors" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={15} /> Volver a donantes
      </Link>

      {/* Hero card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card overflow-hidden mb-5">
        <div className={`bg-gradient-to-r ${gradient} h-24`} />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white flex-shrink-0">
              {profile.avatar_url ? (
                <img src={getMediaUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-3xl font-black text-white">
                    {profile.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">{profile.full_name}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">@{profile.username}</p>
            </div>
          </div>

          {/* Insignias */}
          <div className="mb-4">
            <BadgeList userId={profile.id} />
          </div>

          {/* Location */}
          {(profile.city || profile.state) && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
              <MapPin size={13} className="text-primary-500" />
              {[profile.city, profile.state].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Scroll to publications — solo si hay sesión y no es uno mismo y hay insumos */}
          {currentUser && currentUser.id !== profile.id && supplies.length > 0 && (
            <a
              href="#user-supplies"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md"
            >
              <Package size={15} /> Ver publicaciones
            </a>
          )}
        </div>
      </div>

      {/* Publicaciones del donante */}
      {supplies.length > 0 && (
        <div id="user-supplies" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-6 mb-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-4">
            <Package size={15} className="text-primary-600" /> Publicaciones recientes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {supplies.map((s) => {
              const img = s.images?.find((i) => i.is_primary) || s.images?.[0];
              return (
                <Link
                  key={s.id}
                  to={`/supplies/${s.id}`}
                  className="group rounded-xl border border-gray-100 overflow-hidden hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                    {img ? (
                      <img src={getMediaUrl(img.image_url)} alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">📦</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{s.title}</p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Eye size={9} /> {s.views_count}</span>
                      {s.is_urgent && <span className="flex items-center gap-0.5 text-accent-500"><AlertTriangle size={9} /> Urgente</span>}
                      <span className="flex items-center gap-0.5"><Clock size={9} /> {timeAgo(s.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Reseñas */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-4">
          <Star size={15} className="text-amber-400" /> Reseñas ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <User size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin reseñas todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {r.reviewer?.avatar_url ? (
                    <img src={getMediaUrl(r.reviewer.avatar_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-primary-700">
                      {r.reviewer?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{r.reviewer?.full_name}</p>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={10} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{r.comment}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
