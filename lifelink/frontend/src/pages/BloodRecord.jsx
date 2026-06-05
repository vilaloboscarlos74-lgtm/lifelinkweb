import { useState, useEffect } from 'react';
import { bloodAPI } from '../services/api';
import {
  Droplets, CheckCircle, XCircle, AlertTriangle, Save,
  Plus, Calendar, MapPin, ClipboardList, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PERMANENT = [
  { key: 'has_hiv',            label: 'VIH / SIDA' },
  { key: 'has_hepatitis_b',    label: 'Hepatitis B' },
  { key: 'has_hepatitis_c',    label: 'Hepatitis C' },
  { key: 'has_sifilis',        label: 'Sífilis' },
  { key: 'has_chagas',         label: 'Enfermedad de Chagas' },
  { key: 'has_cancer',         label: 'Cáncer' },
  { key: 'has_diabetes_insulin', label: 'Diabetes insulinodependiente' },
  { key: 'has_epilepsy',       label: 'Epilepsia activa' },
];

const TEMPORARY = [
  { key: 'had_recent_tattoo',    label: 'Tatuaje en los últimos 12 meses' },
  { key: 'had_recent_piercing',  label: 'Piercing en los últimos 12 meses' },
  { key: 'is_pregnant',          label: 'Embarazo actual' },
  { key: 'had_recent_surgery',   label: 'Cirugía reciente' },
  { key: 'is_breastfeeding',     label: 'Lactancia materna' },
];

const EMPTY_FORM = {
  weight_kg: '',
  birth_date: '',
  notes: '',
  ...Object.fromEntries(PERMANENT.map(c => [c.key, false])),
  ...Object.fromEntries(TEMPORARY.map(c => [c.key, false])),
};

function CheckboxGroup({ items, form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
          <input
            type="checkbox"
            checked={form[key] || false}
            onChange={e => onChange(key, e.target.checked)}
            className="w-4 h-4 rounded accent-red-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        </label>
      ))}
    </div>
  );
}

export default function BloodRecord() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [eligibility, setEligibility] = useState(null);
  const [donations, setDonations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingElig, setLoadingElig] = useState(false);
  const [hasRecord, setHasRecord] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationDate, setDonationDate] = useState('');
  const [donationLocation, setDonationLocation] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    bloodAPI.getRecord()
      .then(r => {
        const d = r.data;
        setHasRecord(true);
        setForm({
          weight_kg: d.weight_kg ?? '',
          birth_date: d.birth_date ? d.birth_date.substring(0, 10) : '',
          notes: d.notes ?? '',
          ...Object.fromEntries(PERMANENT.map(c => [c.key, d[c.key] ?? false])),
          ...Object.fromEntries(TEMPORARY.map(c => [c.key, d[c.key] ?? false])),
        });
      })
      .catch(() => {});

    bloodAPI.getEligibility()
      .then(r => setEligibility(r.data))
      .catch(() => {});

    bloodAPI.getDonations()
      .then(r => setDonations(r.data || []))
      .catch(() => {});
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        birth_date: form.birth_date || null,
        notes: form.notes || null,
      };
      await bloodAPI.saveRecord(payload);
      toast.success('Expediente guardado');
      setHasRecord(true);

      setLoadingElig(true);
      bloodAPI.getEligibility()
        .then(r => setEligibility(r.data))
        .catch(() => {})
        .finally(() => setLoadingElig(false));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const registerDonation = async () => {
    if (!donationDate) { toast.error('Selecciona la fecha de donación'); return; }
    setRegistering(true);
    try {
      const res = await bloodAPI.registerDonation({
        donation_date: new Date(donationDate).toISOString(),
        location: donationLocation || null,
      });
      setDonations(prev => [res.data, ...prev]);
      toast.success('Donación registrada');
      setShowDonationForm(false);
      setDonationDate('');
      setDonationLocation('');

      bloodAPI.getEligibility()
        .then(r => setEligibility(r.data))
        .catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'No puedes registrar esta donación');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-md">
          <ClipboardList size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Expediente de Donante</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Información médica para donación de sangre (NOM-253-SSA1-2012)</p>
        </div>
      </div>

      {/* Elegibilidad */}
      {eligibility && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
          eligibility.eligible
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          {eligibility.eligible
            ? <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            : <XCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-bold text-sm ${eligibility.eligible ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              {eligibility.eligible ? 'Apto para donar sangre' : 'No apto para donar en este momento'}
            </p>
            {eligibility.reasons.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {eligibility.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
                    <AlertTriangle size={11} className="shrink-0 mt-0.5" /> {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={save} className="card p-6 space-y-6">
        <h2 className="font-bold text-gray-800 dark:text-gray-200">Datos físicos</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Peso (kg)</label>
            <input
              type="number" min="0" step="0.1"
              value={form.weight_kg}
              onChange={e => set('weight_kg', e.target.value)}
              placeholder="Ej: 65"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="label-field">Fecha de nacimiento</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <XCircle size={15} className="text-red-500" />
            Exclusiones permanentes — marcar si las tienes
          </h3>
          <CheckboxGroup items={PERMANENT} form={form} onChange={set} />
        </div>

        <div>
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" />
            Exclusiones temporales — marcar si aplica ahora
          </h3>
          <CheckboxGroup items={TEMPORARY} form={form} onChange={set} />
        </div>

        <div>
          <label className="label-field">Notas adicionales (opcional)</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Medicamentos actuales, alergias, observaciones..."
            className="input-field text-sm resize-none"
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={16} />
          {saving ? 'Guardando...' : hasRecord ? 'Actualizar expediente' : 'Guardar expediente'}
        </button>
      </form>

      {/* Registrar donación */}
      {hasRecord && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Droplets size={18} className="text-red-500" />
              Registrar una donación
            </h2>
            <button
              onClick={() => setShowDonationForm(v => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              {showDonationForm ? <ChevronUp size={16} /> : <Plus size={16} />}
              {showDonationForm ? 'Cancelar' : 'Nueva donación'}
            </button>
          </div>

          {showDonationForm && (
            <div className="space-y-3 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Fecha de donación *</label>
                  <input
                    type="date"
                    value={donationDate}
                    onChange={e => setDonationDate(e.target.value)}
                    max={new Date().toISOString().substring(0, 10)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="label-field">Lugar (opcional)</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={donationLocation}
                      onChange={e => setDonationLocation(e.target.value)}
                      placeholder="Hospital, banco de sangre..."
                      className="input-field pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={registerDonation}
                disabled={registering}
                className="btn-danger flex items-center gap-2 text-sm"
              >
                <Droplets size={15} />
                {registering ? 'Registrando...' : 'Confirmar donación'}
              </button>
            </div>
          )}

          {/* Historial */}
          {donations.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3"
              >
                <Calendar size={14} />
                {showHistory ? 'Ocultar' : 'Ver'} historial ({donations.length} donación{donations.length !== 1 ? 'es' : ''})
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showHistory && (
                <div className="space-y-2">
                  {donations.map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <Droplets size={14} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {new Date(d.donation_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {d.location && (
                          <p className="text-xs text-gray-400 truncate">{d.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {donations.length === 0 && !showDonationForm && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
              No hay donaciones registradas aún
            </p>
          )}
        </div>
      )}
    </div>
  );
}
