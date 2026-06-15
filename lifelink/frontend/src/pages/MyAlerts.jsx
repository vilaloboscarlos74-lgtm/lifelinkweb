import { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import { ALCALDIAS_CDMX, MUNICIPIOS_EDOMEX } from '../constants/ubicaciones';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Search, MapPin, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: '', label: 'Cualquier categoría' },
  { value: 'ortopedico', label: '🦴 Ortopédico' },
  { value: 'rehabilitacion', label: '💪 Rehabilitación' },
  { value: 'diagnostico', label: '🔬 Diagnóstico' },
  { value: 'protesis', label: '🦿 Prótesis' },
  { value: 'mobiliario', label: '🛏️ Mobiliario' },
  { value: 'consumibles', label: '💉 Consumibles' },
  { value: 'otro', label: '📦 Otro' },
];

const TYPES = [
  { value: '', label: 'Cualquier tipo' },
  { value: 'donacion', label: '🎁 Donación' },
  { value: 'venta', label: '💰 Venta' },
  { value: 'intercambio', label: '🔄 Intercambio' },
  { value: 'solicitud', label: '🔍 Solicitud' },
];

const EMPTY = { label: '', query: '', category: '', supply_type: '', city: '' };

export default function MyAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    alertsAPI.list()
      .then(r => setAlerts(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.label.trim()) return toast.error('Dale un nombre a la alerta');
    if (!form.query && !form.category && !form.city)
      return toast.error('Define al menos un criterio: palabra clave, categoría o ciudad');

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        query: form.query.trim() || null,
        category: form.category || null,
        supply_type: form.supply_type || null,
        city: form.city.trim() || null,
      };
      const res = await alertsAPI.create(payload);
      setAlerts(prev => [...prev, res.data]);
      setForm(EMPTY);
      setShowForm(false);
      toast.success('Alerta creada');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear alerta');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id) => {
    try {
      const res = await alertsAPI.toggle(id);
      setAlerts(prev => prev.map(a => a.id === id ? res.data : a));
    } catch { toast.error('Error'); }
  };

  const remove = async (id) => {
    try {
      await alertsAPI.delete(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alerta eliminada');
    } catch { toast.error('Error'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-medical-500 rounded-2xl flex items-center justify-center shadow-md">
            <Bell size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Mis Alertas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Te avisamos cuando aparezca lo que buscas</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 btn-primary text-sm"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Nueva alerta'}
        </button>
      </div>

      {/* Formulario nueva alerta */}
      {showForm && (
        <div className="card p-5 space-y-4 border-2 border-primary-200 dark:border-primary-800">
          <h2 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Bell size={16} className="text-primary-600" /> Crear alerta de búsqueda
          </h2>

          <div>
            <label className="label-field">Nombre de la alerta *</label>
            <input type="text" value={form.label}
              onChange={e => set('label', e.target.value)}
              placeholder="Ej: Muletas en CDMX"
              className="input-field text-sm" />
            <p className="text-xs text-gray-400 mt-1">Un nombre para identificarla fácilmente</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field flex items-center gap-1"><Search size={12} /> Palabra clave</label>
              <input type="text" value={form.query}
                onChange={e => set('query', e.target.value)}
                placeholder="Ej: silla de ruedas"
                className="input-field text-sm" />
            </div>
            <div>
              <label className="label-field flex items-center gap-1"><MapPin size={12} /> Alcaldía / Municipio</label>
              <select
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Cualquier zona</option>
                <optgroup label="── Ciudad de México ──">
                  {ALCALDIAS_CDMX.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </optgroup>
                <optgroup label="── Estado de México ──">
                  {MUNICIPIOS_EDOMEX.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="label-field flex items-center gap-1"><Tag size={12} /> Categoría</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field text-sm">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Tipo de publicación</label>
              <select value={form.supply_type} onChange={e => set('supply_type', e.target.value)} className="input-field text-sm">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 w-full justify-center">
            <Bell size={15} />
            {saving ? 'Guardando...' : 'Crear alerta'}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl text-sm text-primary-800 dark:text-primary-300">
        <strong>¿Cómo funcionan?</strong> Cada vez que alguien publique un insumo que coincida con tu alerta, recibirás una notificación en la plataforma. Máximo 10 alertas activas.
      </div>

      {/* Lista de alertas */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="font-bold text-gray-500 dark:text-gray-400">No tienes alertas configuradas</p>
          <p className="text-sm text-gray-400 mt-1">Crea una para recibir avisos cuando aparezca lo que buscas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id}
              className={`card p-4 flex items-start gap-4 transition-all ${!alert.is_active ? 'opacity-50' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.is_active ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Bell size={18} className={alert.is_active ? 'text-primary-600' : 'text-gray-400'} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{alert.label}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {alert.query && (
                    <span className="text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Search size={9} /> {alert.query}
                    </span>
                  )}
                  {alert.category && (
                    <span className="text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full capitalize">
                      {alert.category}
                    </span>
                  )}
                  {alert.supply_type && (
                    <span className="text-[11px] bg-medical-50 dark:bg-medical-900/30 text-medical-600 dark:text-medical-400 px-2 py-0.5 rounded-full capitalize">
                      {alert.supply_type}
                    </span>
                  )}
                  {alert.city && (
                    <span className="text-[11px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MapPin size={9} /> {alert.city}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(alert.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={alert.is_active ? 'Desactivar' : 'Activar'}>
                  {alert.is_active
                    ? <ToggleRight size={20} className="text-primary-600" />
                    : <ToggleLeft size={20} className="text-gray-400" />}
                </button>
                <button onClick={() => remove(alert.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
