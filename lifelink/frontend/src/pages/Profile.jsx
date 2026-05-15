import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { Save, Camera, User, MapPin, Droplets } from 'lucide-react';
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

const BIO_MAX = 300;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    city: user?.city || '',
    state: user?.state || '',
    blood_type: user?.blood_type || '',
    is_blood_donor: user?.is_blood_donor || false,
  });

  // Reinitialize form when user data loads (e.g. after login fetches full profile)
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
  }, [user?.id]);

  const set = (f) => (e) =>
    setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form };
      // Don't send empty strings — let backend keep existing values
      Object.keys(data).forEach((k) => {
        if (data[k] === '') data[k] = null;
      });
      if (!data.blood_type) delete data.blood_type;
      const res = await usersAPI.updateProfile(data);
      updateUser(res.data);
      toast.success('Perfil actualizado');
    } catch (err) {
      console.error('Profile update error:', err?.response?.data || err);
      toast.error('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await usersAPI.uploadAvatar(file);
      updateUser(res.data);
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir foto');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-0.5">Actualiza tu información personal</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-primary-700">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary-600 rounded-lg cursor-pointer hover:bg-primary-700 transition-colors shadow-sm">
            <Camera size={14} className="text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
        </div>
        <div>
          <p className="font-bold text-gray-900">{user?.full_name}</p>
          <p className="text-sm text-gray-500">@{user?.username}</p>
          <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <User size={15} className="text-primary-600" /> Información personal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre completo</label>
              <input type="text" className="input-field" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Teléfono</label>
              <input type="tel" className="input-field" value={form.phone} onChange={set('phone')} placeholder="+52 55 1234 5678" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Biografía</label>
              <span className={`text-xs ${form.bio.length > BIO_MAX * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <MapPin size={15} className="text-primary-600" /> Ubicación
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Ciudad</label>
              <input type="text" className="input-field" value={form.city} onChange={set('city')} placeholder="Ej. Guadalajara" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Estado</label>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Droplets size={15} className="text-accent-500" /> Donación de sangre
          </h3>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors -mx-1">
            <input
              type="checkbox"
              checked={form.is_blood_donor}
              onChange={set('is_blood_donor')}
              className="w-4 h-4 accent-accent-500"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">Estoy dispuesto/a a donar sangre</p>
              <p className="text-xs text-gray-400">Aparecerás en el directorio de donantes</p>
            </div>
          </label>
          {form.is_blood_donor && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo de sangre</label>
              <select className="input-field" value={form.blood_type} onChange={set('blood_type')}>
                <option value="">Seleccionar tipo</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={16} /> Guardar Cambios</>
          }
        </button>
      </form>
    </div>
  );
}
