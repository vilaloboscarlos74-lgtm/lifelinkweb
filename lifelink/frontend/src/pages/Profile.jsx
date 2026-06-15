import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { usersAPI, reviewsAPI, getMediaUrl } from '../services/api';
import BadgeList from '../components/BadgeList';
import {
  Save, Camera, User, MapPin, Droplets,
  Sun, Moon, Monitor, CheckCircle2, AlertCircle, Star, MessageSquare,
  Lock, Download, Trash2, Eye, EyeOff, ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MEXICO_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila de Zaragoza',
  'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Estado de México', 'Michoacán de Ocampo', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz de Ignacio de la Llave', 'Yucatán', 'Zacatecas',
];

const BIO_MAX = 500;

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Claro',
    icon: Sun,
    preview: (
      <div className="w-full rounded-lg overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
        <div className="h-4 bg-white border-b border-gray-100 flex items-center px-2 gap-1">
          <div className="w-2 h-2 rounded-full bg-primary-500" />
          <div className="w-8 h-1.5 rounded-full bg-gray-200" />
          <div className="ml-auto w-3 h-1.5 rounded-full bg-gray-200" />
        </div>
        <div className="bg-[#f3f8fc] p-2 space-y-1.5 h-full">
          <div className="h-3 bg-white rounded border border-gray-100 w-full" />
          <div className="h-3 bg-white rounded border border-gray-100 w-4/5" />
          <div className="flex gap-1">
            <div className="h-4 bg-primary-100 rounded flex-1" />
            <div className="h-4 bg-primary-500 rounded w-8" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'dark',
    label: 'Oscuro',
    icon: Moon,
    preview: (
      <div className="w-full rounded-lg overflow-hidden border border-gray-700" style={{ aspectRatio: '16/9' }}>
        <div className="h-4 bg-gray-900 border-b border-gray-700 flex items-center px-2 gap-1">
          <div className="w-2 h-2 rounded-full bg-primary-400" />
          <div className="w-8 h-1.5 rounded-full bg-gray-700" />
          <div className="ml-auto w-3 h-1.5 rounded-full bg-gray-700" />
        </div>
        <div className="bg-[#0a0f1e] p-2 space-y-1.5 h-full">
          <div className="h-3 bg-gray-800 rounded border border-gray-700 w-full" />
          <div className="h-3 bg-gray-800 rounded border border-gray-700 w-4/5" />
          <div className="flex gap-1">
            <div className="h-4 bg-gray-700 rounded flex-1" />
            <div className="h-4 bg-primary-600 rounded w-8" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: Monitor,
    preview: (
      <div className="w-full rounded-lg overflow-hidden border border-gray-300" style={{ aspectRatio: '16/9', display: 'flex' }}>
        <div className="flex-1 flex flex-col">
          <div className="h-4 bg-white border-b border-gray-100 border-r border-r-gray-300 flex items-center px-1 gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          </div>
          <div className="bg-[#f3f8fc] flex-1 p-1.5 space-y-1 border-r border-gray-300">
            <div className="h-2.5 bg-white rounded border border-gray-100" />
            <div className="h-2.5 bg-white rounded border border-gray-100 w-3/4" />
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-4 bg-gray-900 border-b border-gray-700 flex items-center px-1 gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
          </div>
          <div className="bg-[#0a0f1e] flex-1 p-1.5 space-y-1">
            <div className="h-2.5 bg-gray-800 rounded border border-gray-700" />
            <div className="h-2.5 bg-gray-800 rounded border border-gray-700 w-3/4" />
          </div>
        </div>
      </div>
    ),
  },
];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveOk, setSaveOk] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Change password
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Delete account
  const [delForm, setDelForm] = useState({ password: '', confirmation: '' });
  const [delLoading, setDelLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    city: user?.city || '',
    state: user?.state || '',
    blood_type: user?.blood_type || '',
    is_blood_donor: user?.is_blood_donor || false,
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      bio: user.bio || '',
      city: user.city || '',
      state: user.state || '',
      blood_type: user.blood_type || '',
      is_blood_donor: user.is_blood_donor || false,
    });
    setReviewsLoading(true);
    reviewsAPI.getForUser(user.id)
      .then((r) => setReviews(r.data || []))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [user?.id]);

  const set = (f) => (e) =>
    setForm((prev) => ({ ...prev, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleBloodDonorChange = (e) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      is_blood_donor: checked,
      blood_type: checked ? prev.blood_type : '',
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    setPwLoading(true);
    try {
      await usersAPI.changePassword({ current_password: pwForm.current, new_password: pwForm.next });
      toast.success('Contraseña actualizada correctamente');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cambiar contraseña');
    } finally {
      setPwLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await usersAPI.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifelink_datos_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Datos exportados correctamente');
    } catch {
      toast.error('Error al exportar datos');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (delForm.confirmation !== 'ELIMINAR MI CUENTA') {
      toast.error('Escribe exactamente: ELIMINAR MI CUENTA');
      return;
    }
    setDelLoading(true);
    try {
      await usersAPI.deleteAccount({ password: delForm.password, confirmation: delForm.confirmation });
      toast.success('Tu cuenta ha sido eliminada');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al eliminar cuenta');
    } finally {
      setDelLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveError('');
    setSaveOk(false);
    try {
      const payload = {
        full_name: form.full_name,
        is_blood_donor: form.is_blood_donor,
        phone: form.phone || '',
        bio: form.bio || '',
        city: form.city || '',
        state: form.state || '',
        blood_type: form.blood_type || '',
      };

      const res = await usersAPI.updateProfile(payload);
      updateUser(res.data);
      setSaveOk(true);
      toast.success('Perfil actualizado');
      setTimeout(() => setSaveOk(false), 4000);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || JSON.stringify(d)).join(' · ')
          : `Error ${err?.response?.status || 'de red'}: no se pudo guardar`;
      setSaveError(msg);
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const res = await usersAPI.uploadAvatar(file);
      updateUser(res.data);
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir foto');
    } finally {
      setAvatarLoading(false);
    }
  };

  const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-6';
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';
  const headingCls = 'font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Mi Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Actualiza tu información personal</p>
      </div>

      {/* Avatar */}
      <div className={`${cardCls} mb-5 flex items-center gap-5`}>
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img src={getMediaUrl(user.avatar_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-primary-700">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label className={`absolute -bottom-1 -right-1 p-1.5 bg-primary-600 rounded-lg cursor-pointer hover:bg-primary-700 transition-colors shadow-sm ${avatarLoading ? 'pointer-events-none opacity-70' : ''}`}>
            {avatarLoading
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Camera size={14} className="text-white" />
            }
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={avatarLoading} />
          </label>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 dark:text-gray-100">{user?.full_name}</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{user?.email}</p>
          {user?.id && (
            <div className="mt-2">
              <BadgeList userId={user.id} />
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Personal info */}
        <div className={cardCls}>
          <h3 className={`${headingCls} mb-4`}>
            <User size={15} className="text-primary-600" /> Información personal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input type="text" className="input-field" value={form.full_name} onChange={set('full_name')} required minLength={2} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input type="tel" className="input-field" value={form.phone} onChange={set('phone')} placeholder="+52 55 1234 5678" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls.replace('mb-1.5', '')}>Biografía</label>
              <span className={`text-xs ${form.bio.length > BIO_MAX * 0.9 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                {form.bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.bio}
              onChange={set('bio')}
              maxLength={BIO_MAX}
              placeholder="Cuéntanos sobre ti, tu experiencia con insumos médicos..."
            />
          </div>
        </div>

        {/* Location */}
        <div className={cardCls}>
          <h3 className={`${headingCls} mb-4`}>
            <MapPin size={15} className="text-primary-600" /> Ubicación
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ciudad</label>
              <input type="text" className="input-field" value={form.city} onChange={set('city')} placeholder="Ej. Guadalajara" />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select className="input-field" value={form.state} onChange={set('state')}>
                <option value="">Seleccionar estado</option>
                {MEXICO_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Blood donation */}
        <div className={cardCls}>
          <h3 className={`${headingCls} mb-4`}>
            <Droplets size={15} className="text-accent-500" /> Donación de sangre
          </h3>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors -mx-1">
            <input
              type="checkbox"
              checked={form.is_blood_donor}
              onChange={handleBloodDonorChange}
              className="w-4 h-4 accent-accent-500"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Estoy dispuesto/a a donar sangre</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Aparecerás en el directorio de donantes</p>
            </div>
          </label>
          {form.is_blood_donor && (
            <div className="mt-3">
              <label className={labelCls}>Tipo de sangre</label>
              <select className="input-field" value={form.blood_type} onChange={set('blood_type')}>
                <option value="">Seleccionar tipo</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Error banner */}
        {saveError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl animate-fade-in">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">No se pudo guardar el perfil</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{saveError}</p>
            </div>
          </div>
        )}

        {/* Success banner */}
        {saveOk && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl animate-fade-in">
            <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Perfil actualizado correctamente</p>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={16} /> Guardar Cambios</>
          }
        </button>
      </form>

      {/* ── Reseñas recibidas ── */}
      <div className={`${cardCls} mt-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={headingCls}>
            <Star size={15} className="text-amber-400" /> Reseñas recibidas
          </h3>
          {user?.rating_avg > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <Star size={14} fill="#f59e0b" className="text-amber-400" />
              <span className="text-sm font-black text-amber-700 dark:text-amber-400">{user.rating_avg.toFixed(1)}</span>
              <span className="text-xs text-amber-600 dark:text-amber-500">/ 5</span>
            </div>
          )}
        </div>

        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Aún no tienes reseñas</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Completa solicitudes para que otros usuarios te califiquen</p>
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
                        <Star key={s} size={11} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{r.comment}</p>}
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Aspecto ── */}
      <div className={`${cardCls} mt-5`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={headingCls}>
            <Monitor size={15} className="text-primary-600" /> Aspecto
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            Local
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
          Elige cómo quieres ver la app. Se guarda solo en este dispositivo.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ id, label, icon: Icon, preview }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`group flex flex-col gap-2.5 p-3 rounded-2xl border-2 transition-all duration-200 text-left ${
                  active
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md shadow-primary-100 dark:shadow-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }`}
              >
                {preview}
                <div className="flex items-center gap-1.5 px-0.5">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {active && <div className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                  <span className={`text-xs font-semibold ${
                    active
                      ? 'text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {label}
                  </span>
                  <Icon size={10} className={`ml-auto ${active ? 'text-primary-500 dark:text-primary-400' : 'text-gray-300 dark:text-gray-600'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Cambiar contraseña ── */}
      <div className={`${cardCls} mt-5`}>
        <h3 className={`${headingCls} mb-4`}>
          <Lock size={15} className="text-primary-600" /> Cambiar contraseña
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            { key: 'current', label: 'Contraseña actual', placeholder: '••••••••' },
            { key: 'next',    label: 'Nueva contraseña',  placeholder: 'Mínimo 8 caracteres' },
            { key: 'confirm', label: 'Confirmar nueva contraseña', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder={placeholder}
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                  required
                />
                {key === 'current' && (
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5">
            {pwLoading
              ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
              : <><Lock size={14} /> Actualizar contraseña</>
            }
          </button>
        </form>
      </div>

      {/* ── Exportar datos (ARCO) ── */}
      <div className={`${cardCls} mt-5`}>
        <h3 className={`${headingCls} mb-1`}>
          <Download size={15} className="text-primary-600" /> Exportar mis datos
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Descarga toda tu información: perfil, publicaciones, solicitudes y reseñas en formato JSON. Derecho de acceso ARCO (LFPDPPP).
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary flex items-center gap-2 w-full justify-center py-2.5"
        >
          {exporting
            ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
            : <><Download size={14} /> Descargar mis datos</>
          }
        </button>
      </div>

      {/* ── Eliminar cuenta (ARCO — derecho de cancelación) ── */}
      <div className={`mt-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-card p-6`}>
        <h3 className="font-bold text-red-800 dark:text-red-400 text-sm flex items-center gap-2 mb-1">
          <ShieldAlert size={15} /> Eliminar mi cuenta
        </h3>
        <p className="text-xs text-red-700 dark:text-red-500 mb-4 leading-relaxed">
          Esta acción es irreversible. Tu perfil será anonimizado — tus publicaciones y solicitudes quedarán como "usuario eliminado". Derecho de cancelación ARCO (LFPDPPP).
        </p>
        <form onSubmit={handleDeleteAccount} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5">Contraseña actual</label>
            <input
              type="password"
              className="input-field border-red-200 dark:border-red-900 focus:ring-red-300"
              placeholder="Confirma tu contraseña"
              value={delForm.password}
              onChange={(e) => setDelForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-red-700 dark:text-red-400 mb-1.5">
              Escribe <span className="font-black">ELIMINAR MI CUENTA</span> para confirmar
            </label>
            <input
              type="text"
              className="input-field border-red-200 dark:border-red-900 focus:ring-red-300 font-mono"
              placeholder="ELIMINAR MI CUENTA"
              value={delForm.confirmation}
              onChange={(e) => setDelForm((p) => ({ ...p, confirmation: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            disabled={delLoading || delForm.confirmation !== 'ELIMINAR MI CUENTA'}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {delLoading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Trash2 size={15} /> Eliminar mi cuenta permanentemente</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
