import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, getMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Droplets, Search, MapPin, Star, Shield, User,
  Phone, AlertCircle, ChevronDown,
} from 'lucide-react';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const BLOOD_COMPATIBILITY = {
  'O-': { donates_to: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], label: 'Donante universal' },
  'O+': { donates_to: ['O+', 'A+', 'B+', 'AB+'], label: 'Donante común' },
  'A-': { donates_to: ['A-', 'A+', 'AB-', 'AB+'], label: null },
  'A+': { donates_to: ['A+', 'AB+'], label: null },
  'B-': { donates_to: ['B-', 'B+', 'AB-', 'AB+'], label: null },
  'B+': { donates_to: ['B+', 'AB+'], label: null },
  'AB-': { donates_to: ['AB-', 'AB+'], label: null },
  'AB+': { donates_to: ['AB+'], label: 'Receptor universal' },
};

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

function DonorCard({ donor }) {
  const gradient = BLOOD_COLORS[donor.blood_type] || 'from-red-500 to-rose-600';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      {/* Blood type header */}
      <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
            {donor.avatar_url ? (
              <img src={getMediaUrl(donor.avatar_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-lg">
                {donor.full_name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{donor.full_name}</p>
            <p className="text-white/75 text-xs">@{donor.username}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{donor.blood_type}</div>
          {BLOOD_COMPATIBILITY[donor.blood_type]?.label && (
            <span className="text-[10px] text-white/80 font-semibold">
              {BLOOD_COMPATIBILITY[donor.blood_type].label}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {donor.city && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <MapPin size={12} className="text-primary-500" />
            {donor.city}{donor.state ? `, ${donor.state}` : ''}
          </div>
        )}

        {donor.rating_avg > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star size={13} fill="#f59e0b" className="text-amber-400" />
            <span className="text-xs font-bold text-amber-600">{donor.rating_avg.toFixed(1)}</span>
            <span className="text-xs text-gray-400">de calificación</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {donor.is_verified && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-success-700 bg-success-50 dark:bg-success-900/20 dark:text-success-400 px-2 py-0.5 rounded-full border border-success-200 dark:border-success-800">
              <Shield size={9} /> Verificado
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
            <Droplets size={9} /> Donante activo
          </span>
        </div>

        <Link
          to={`/users/${donor.id}`}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-700 dark:hover:text-primary-400 transition-all"
        >
          <User size={14} /> Ver perfil
        </Link>
      </div>
    </div>
  );
}

export default function BloodDonors() {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [city, setCity] = useState('');
  const [showCompatibility, setShowCompatibility] = useState(false);

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (bloodType) params.blood_type = bloodType;
      if (city.trim()) params.city = city.trim();
      const r = await usersAPI.searchBloodDonors(params);
      setDonors(r.data || []);
    } catch {
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault();
    search();
  };

  const compatibleTypes = bloodType ? BLOOD_COMPATIBILITY[bloodType]?.donates_to || [] : [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-md">
            <Droplets size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Donantes de Sangre</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Encuentra donantes por tipo de sangre y ciudad</p>
          </div>
        </div>

        {/* Urgency notice */}
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">En caso de emergencia</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              Si necesitas sangre urgente, contacta también al banco de sangre de tu hospital local o llama al <strong>800 290 0024</strong> (CENATRA).
            </p>
          </div>
        </div>
      </div>

      {/* Compatibility guide */}
      <div className="mb-6">
        <button
          onClick={() => setShowCompatibility(!showCompatibility)}
          className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ChevronDown size={16} className={`transition-transform ${showCompatibility ? 'rotate-180' : ''}`} />
          {showCompatibility ? 'Ocultar' : 'Ver'} guía de compatibilidad sanguínea
        </button>

        {showCompatibility && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
            {BLOOD_TYPES.map((bt) => {
              const compat = BLOOD_COMPATIBILITY[bt];
              const gradient = BLOOD_COLORS[bt];
              return (
                <div key={bt} className={`bg-gradient-to-br ${gradient} rounded-xl p-3 text-white`}>
                  <p className="text-xl font-black">{bt}</p>
                  {compat.label && <p className="text-[10px] text-white/80 mb-1">{compat.label}</p>}
                  <p className="text-[10px] text-white/70">Dona a: {compat.donates_to.join(', ')}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Tipo de sangre
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Todos los tipos</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
            {bloodType && compatibleTypes.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-1">
                Puede donar a: {compatibleTypes.join(', ')}
              </p>
            )}
          </div>

          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
              Ciudad
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Guadalajara"
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>

          <div className="sm:self-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
            >
              <Search size={15} />
              {loading ? 'Buscando...' : 'Buscar donantes'}
            </button>
          </div>
        </div>
      </form>

      {/* CTA — become a donor */}
      {user && !user.is_blood_donor && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Droplets size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">¿Eres donante de sangre?</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Regístrate y aparece en esta lista para ayudar a quien te necesite.</p>
            </div>
          </div>
          <Link to="/mi-expediente" className="btn-danger flex-shrink-0 text-xs">
            Llenar expediente
          </Link>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg w-2/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/2" />
                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : searched && donors.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Droplets size={32} className="text-red-300 dark:text-red-600" />
          </div>
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg mb-1">Sin resultados</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mx-auto">
            No encontramos donantes con ese criterio. Intenta sin filtrar por ciudad o con un tipo de sangre diferente.
          </p>
        </div>
      ) : donors.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <strong className="text-gray-800 dark:text-gray-200">{donors.length}</strong> donante{donors.length !== 1 ? 's' : ''} registrado{donors.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {donors.map((donor) => (
              <DonorCard key={donor.id} donor={donor} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
