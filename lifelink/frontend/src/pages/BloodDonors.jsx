import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, suppliesAPI, getMediaUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Droplets, Search, MapPin, Star, Shield, User,
  AlertCircle, ChevronDown, ClipboardList, Plus, X,
  Clock, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const BLOOD_COMPATIBILITY = {
  'O-':  { donates_to: ['O-','O+','A-','A+','B-','B+','AB-','AB+'], label: 'Donante universal' },
  'O+':  { donates_to: ['O+','A+','B+','AB+'], label: 'Donante común' },
  'A-':  { donates_to: ['A-','A+','AB-','AB+'], label: null },
  'A+':  { donates_to: ['A+','AB+'], label: null },
  'B-':  { donates_to: ['B-','B+','AB-','AB+'], label: null },
  'B+':  { donates_to: ['B+','AB+'], label: null },
  'AB-': { donates_to: ['AB-','AB+'], label: null },
  'AB+': { donates_to: ['AB+'], label: 'Receptor universal' },
};

const BLOOD_COLORS = {
  'O+':'from-red-500 to-rose-600', 'O-':'from-red-700 to-rose-800',
  'A+':'from-orange-500 to-red-500', 'A-':'from-orange-700 to-red-700',
  'B+':'from-purple-500 to-violet-600', 'B-':'from-purple-700 to-violet-800',
  'AB+':'from-blue-500 to-indigo-600', 'AB-':'from-blue-700 to-indigo-800',
};

// ── Tarjeta de donante ─────────────────────────────────────────────────────
function DonorCard({ donor }) {
  const gradient = BLOOD_COLORS[donor.blood_type] || 'from-red-500 to-rose-600';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden">
            {donor.avatar_url
              ? <img src={getMediaUrl(donor.avatar_url)} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-black text-lg">{donor.full_name?.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{donor.full_name}</p>
            <p className="text-white/75 text-xs">@{donor.username}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{donor.blood_type}</div>
          {BLOOD_COMPATIBILITY[donor.blood_type]?.label && (
            <span className="text-[10px] text-white/80 font-semibold">{BLOOD_COMPATIBILITY[donor.blood_type].label}</span>
          )}
        </div>
      </div>
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
        <div className="flex items-center gap-2 flex-wrap">
          {donor.is_verified && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-success-700 bg-success-50 dark:bg-success-900/20 dark:text-success-400 px-2 py-0.5 rounded-full border border-success-200 dark:border-success-800">
              <Shield size={9} /> Verificado
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
            <Droplets size={9} /> Donante activo
          </span>
        </div>
        <Link to={`/users/${donor.id}`}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 hover:text-primary-700 transition-all">
          <User size={14} /> Ver perfil
        </Link>
      </div>
    </div>
  );
}

// ── Tarjeta de solicitud urgente ────────────────────────────────────────────
function BloodRequestCard({ item }) {
  const gradient = BLOOD_COLORS[item._bloodType] || 'from-red-500 to-rose-600';
  const daysAgo = Math.floor((Date.now() - new Date(item.created_at)) / 86400000);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${item.is_urgent ? 'border-red-300 dark:border-red-700' : 'border-gray-100 dark:border-gray-700'} shadow-card overflow-hidden`}>
      <div className={`bg-gradient-to-r ${gradient} px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className="text-white font-black text-2xl">{item._bloodType || '?'}</p>
          <p className="text-white/80 text-xs">Sangre solicitada</p>
        </div>
        {item.is_urgent && (
          <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
            ⚡ Urgente
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          {item.city && (
            <span className="flex items-center gap-1"><MapPin size={11} />{item.city}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {daysAgo === 0 ? 'Hoy' : daysAgo === 1 ? 'Ayer' : `Hace ${daysAgo} días`}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {item.owner?.avatar_url
              ? <img src={getMediaUrl(item.owner.avatar_url)} alt="" className="w-full h-full object-cover" />
              : <span className="text-gray-500 text-[10px] font-bold">{item.owner?.full_name?.charAt(0)}</span>
            }
          </div>
          <Link to={`/users/${item.owner?.id}`} className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
            {item.owner?.full_name}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function BloodDonors() {
  const { user } = useAuth();
  const [tab, setTab] = useState('donors');

  // Tab donadores
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [city, setCity] = useState('');
  const [showCompatibility, setShowCompatibility] = useState(false);

  // Tab solicitudes
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reqForm, setReqForm] = useState({ bloodType: '', city: '', description: '', is_urgent: false });
  const [submitting, setSubmitting] = useState(false);

  // Cargar donadores al montar
  useEffect(() => { searchDonors(); }, []); // eslint-disable-line

  // Cargar solicitudes cuando cambia a esa pestaña
  useEffect(() => {
    if (tab === 'requests') fetchRequests();
  }, [tab]); // eslint-disable-line

  const searchDonors = async () => {
    setLoadingDonors(true);
    try {
      const params = {};
      if (bloodType) params.blood_type = bloodType;
      if (city.trim()) params.city = city.trim();
      const r = await usersAPI.searchBloodDonors(params);
      setDonors(r.data || []);
    } catch { setDonors([]); }
    finally { setLoadingDonors(false); }
  };

  const fetchRequests = async () => {
    setLoadingReqs(true);
    try {
      const r = await suppliesAPI.list({ category: 'sangre', supply_type: 'solicitud', limit: 30 });
      const items = (r.data?.items || []).map(item => ({
        ...item,
        _bloodType: item.title.match(/\b(O[+-]|A[+-]|B[+-]|AB[+-])\b/i)?.[0]?.toUpperCase() || '',
      }));
      setRequests(items);
    } catch { setRequests([]); }
    finally { setLoadingReqs(false); }
  };

  const submitRequest = async () => {
    if (!reqForm.bloodType) { toast.error('Selecciona el tipo de sangre que necesitas'); return; }
    setSubmitting(true);
    try {
      await suppliesAPI.create({
        title: `Solicito sangre ${reqForm.bloodType}`,
        description: reqForm.description || `Necesito donante de sangre tipo ${reqForm.bloodType} con urgencia.`,
        supply_type: 'solicitud',
        category: 'sangre',
        condition: 'nuevo',
        city: reqForm.city || undefined,
        is_urgent: reqForm.is_urgent,
      });
      toast.success('Solicitud publicada');
      setShowForm(false);
      setReqForm({ bloodType: '', city: '', description: '', is_urgent: false });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al publicar');
    } finally { setSubmitting(false); }
  };

  const compatibleTypes = bloodType ? BLOOD_COMPATIBILITY[bloodType]?.donates_to || [] : [];

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-md">
            <Droplets size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Centro de Sangre</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Donantes, solicitudes urgentes y tu expediente</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">En caso de emergencia</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              Contacta también al banco de sangre de tu hospital o llama al <strong>800 290 0024</strong> (CENATRA).
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'donors',    icon: <Droplets size={15} />,      label: 'Donadores' },
          { key: 'requests',  icon: <AlertCircle size={15} />,   label: 'Solicitudes urgentes' },
          { key: 'record',    icon: <ClipboardList size={15} />, label: 'Mi expediente' },
        ].map(({ key, icon, label }) => (
          key === 'record'
            ? <Link key={key} to="/mi-expediente"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                {icon} {label}
              </Link>
            : <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                  ${tab === key ? 'bg-red-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {icon} {label}
              </button>
        ))}
      </div>

      {/* ── Tab: Donadores ── */}
      {tab === 'donors' && (
        <div>
          {/* Guía compatibilidad */}
          <div className="mb-5">
            <button onClick={() => setShowCompatibility(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              <ChevronDown size={16} className={`transition-transform ${showCompatibility ? 'rotate-180' : ''}`} />
              {showCompatibility ? 'Ocultar' : 'Ver'} guía de compatibilidad sanguínea
            </button>
            {showCompatibility && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BLOOD_TYPES.map(bt => (
                  <div key={bt} className={`bg-gradient-to-br ${BLOOD_COLORS[bt]} rounded-xl p-3 text-white`}>
                    <p className="text-xl font-black">{bt}</p>
                    {BLOOD_COMPATIBILITY[bt].label && <p className="text-[10px] text-white/80 mb-1">{BLOOD_COMPATIBILITY[bt].label}</p>}
                    <p className="text-[10px] text-white/70">Dona a: {BLOOD_COMPATIBILITY[bt].donates_to.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Búsqueda */}
          <form onSubmit={e => { e.preventDefault(); searchDonors(); }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Tipo de sangre</label>
                <select value={bloodType} onChange={e => setBloodType(e.target.value)} className="input-field text-sm">
                  <option value="">Todos los tipos</option>
                  {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
                {bloodType && compatibleTypes.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">Puede donar a: {compatibleTypes.join(', ')}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Ciudad</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    placeholder="Ej: Guadalajara" className="input-field pl-9 text-sm" />
                </div>
              </div>
              <div className="sm:self-end">
                <button type="submit" disabled={loadingDonors} className="btn-primary flex items-center gap-2 w-full sm:w-auto whitespace-nowrap">
                  <Search size={15} /> {loadingDonors ? 'Buscando...' : 'Buscar donantes'}
                </button>
              </div>
            </div>
          </form>

          {/* CTA expediente */}
          {user && !user.is_blood_donor && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Droplets size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">¿Eres donante de sangre?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Regístrate y aparece en esta lista para ayudar a quien te necesite.</p>
                </div>
              </div>
              <Link to="/mi-expediente" className="btn-danger flex-shrink-0 text-xs">Llenar expediente</Link>
            </div>
          )}

          {/* Resultados */}
          {loadingDonors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div className="h-24 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg w-2/3" />
                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : donors.length === 0 ? (
            <div className="text-center py-16">
              <Droplets size={40} className="text-red-200 dark:text-red-700 mx-auto mb-4" />
              <p className="font-bold text-gray-600 dark:text-gray-400">No encontramos donantes con ese criterio</p>
              <p className="text-sm text-gray-400 mt-1">Intenta sin filtrar por ciudad o con otro tipo de sangre.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                <strong className="text-gray-800 dark:text-gray-200">{donors.length}</strong> donante{donors.length !== 1 ? 's' : ''} registrado{donors.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {donors.map(d => <DonorCard key={d.id} donor={d} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Solicitudes urgentes ── */}
      {tab === 'requests' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personas que necesitan donantes de sangre ahora mismo
            </p>
            {user && (
              <button onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1.5 btn-danger text-sm">
                {showForm ? <X size={15} /> : <Plus size={15} />}
                {showForm ? 'Cancelar' : 'Necesito sangre'}
              </button>
            )}
          </div>

          {/* Formulario nueva solicitud */}
          {showForm && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-6 space-y-4">
              <h3 className="font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
                <Droplets size={16} /> Publicar solicitud de sangre
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Tipo de sangre que necesitas *</label>
                  <select value={reqForm.bloodType}
                    onChange={e => setReqForm(f => ({ ...f, bloodType: e.target.value }))}
                    className="input-field text-sm">
                    <option value="">Seleccionar...</option>
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Ciudad</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={reqForm.city}
                      onChange={e => setReqForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Tu ciudad" className="input-field pl-8 text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="label-field">Información adicional (opcional)</label>
                <textarea rows={2} value={reqForm.description}
                  onChange={e => setReqForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Hospital, urgencia médica, datos de contacto adicionales..."
                  className="input-field text-sm resize-none" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={reqForm.is_urgent}
                  onChange={e => setReqForm(f => ({ ...f, is_urgent: e.target.checked }))}
                  className="w-4 h-4 accent-red-500" />
                <span className="text-sm font-semibold text-red-800 dark:text-red-300">⚡ Es urgente (destacar en la lista)</span>
              </label>

              <button onClick={submitRequest} disabled={submitting}
                className="btn-danger flex items-center gap-2">
                <CheckCircle size={16} />
                {submitting ? 'Publicando...' : 'Publicar solicitud'}
              </button>
            </div>
          )}

          {/* Lista de solicitudes */}
          {loadingReqs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={40} className="text-green-300 dark:text-green-700 mx-auto mb-4" />
              <p className="font-bold text-gray-600 dark:text-gray-400">No hay solicitudes urgentes en este momento</p>
              {user && <p className="text-sm text-gray-400 mt-1">Si necesitas sangre, usa el botón "Necesito sangre" de arriba.</p>}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                <strong className="text-gray-800 dark:text-gray-200">{requests.length}</strong> solicitud{requests.length !== 1 ? 'es' : ''} activa{requests.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map(item => <BloodRequestCard key={item.id} item={item} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
