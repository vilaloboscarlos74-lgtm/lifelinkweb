import { useState, useEffect } from 'react';
import { bloodAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Droplets, CheckCircle, XCircle, AlertTriangle, Save,
  Plus, Calendar, MapPin, ClipboardList, ChevronDown, ChevronUp,
  User, Heart, ShieldAlert, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

// El backend usa los valores directos del enum: "O+", "A-", etc.
// No necesitamos mapping adicional.

const BLOOD_COLORS = {
  'O+': 'from-red-500 to-rose-600', 'O-': 'from-red-700 to-rose-800',
  'A+': 'from-orange-500 to-red-500', 'A-': 'from-orange-700 to-red-700',
  'B+': 'from-purple-500 to-violet-600', 'B-': 'from-purple-700 to-violet-800',
  'AB+': 'from-blue-500 to-indigo-600', 'AB-': 'from-blue-700 to-indigo-800',
};

const PERMANENT = [
  { key: 'has_hiv',              label: 'VIH / SIDA' },
  { key: 'has_hepatitis_b',      label: 'Hepatitis B' },
  { key: 'has_hepatitis_c',      label: 'Hepatitis C' },
  { key: 'has_sifilis',          label: 'Sífilis' },
  { key: 'has_chagas',           label: 'Enfermedad de Chagas' },
  { key: 'has_cancer',           label: 'Cáncer' },
  { key: 'has_diabetes_insulin', label: 'Diabetes insulinodependiente' },
  { key: 'has_epilepsy',         label: 'Epilepsia activa' },
];

const TEMPORARY = [
  { key: 'had_recent_tattoo',   label: 'Tatuaje en últimos 12 meses' },
  { key: 'had_recent_piercing', label: 'Piercing en últimos 12 meses' },
  { key: 'is_pregnant',         label: 'Embarazo actual' },
  { key: 'had_recent_surgery',  label: 'Cirugía reciente' },
  { key: 'is_breastfeeding',    label: 'Lactancia materna' },
];

const EMPTY_FORM = {
  weight_kg: '',
  birth_date: '',
  notes: '',
  ...Object.fromEntries(PERMANENT.map(c => [c.key, false])),
  ...Object.fromEntries(TEMPORARY.map(c => [c.key, false])),
};

function CheckboxRow({ items, form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map(({ key, label }) => (
        <label key={key}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
            ${form[key]
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
          <input type="checkbox" checked={form[key] || false}
            onChange={e => onChange(key, e.target.checked)}
            className="w-4 h-4 accent-red-500 shrink-0" />
          <span className={`text-sm ${form[key] ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
            {label}
          </span>
        </label>
      ))}
    </div>
  );
}

export default function BloodRecord() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [bloodType, setBloodType] = useState('');
  const [isBloodDonor, setIsBloodDonor] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [donations, setDonations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hasRecord, setHasRecord] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationDate, setDonationDate] = useState('');
  const [donationLocation, setDonationLocation] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Cargar datos del perfil
    if (user) {
      // blood_type viene como "O+", "A-", etc. desde el backend
      if (user.blood_type) setBloodType(user.blood_type);
      setIsBloodDonor(user.is_blood_donor || false);
    }

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
  }, [user]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.weight_kg || parseFloat(form.weight_kg) < 30) {
      toast.error('Ingresa tu peso (mínimo 30 kg)'); return;
    }
    if (!form.birth_date) {
      toast.error('Ingresa tu fecha de nacimiento'); return;
    }
    if (isBloodDonor && !bloodType) {
      toast.error('Selecciona tu tipo de sangre para registrarte como donante activo'); return;
    }
    if (!consentGiven && !hasRecord) {
      toast.error('Debes aceptar el aviso de privacidad antes de guardar'); return;
    }
    if (isBloodDonor && eligibility && !eligibility.eligible) {
      toast.error('No puedes activarte como donante: no cumples los requisitos de elegibilidad');
      return;
    }
    setSaving(true);
    try {
      // Guardar expediente médico
      await bloodAPI.saveRecord({
        ...form,
        weight_kg: parseFloat(form.weight_kg),
        birth_date: form.birth_date || null,
        notes: form.notes || null,
      });

      // Actualizar tipo de sangre y estado de donante en el perfil
      const profileUpdate = { is_blood_donor: isBloodDonor };
      if (bloodType) profileUpdate.blood_type = bloodType; // enviar "O+", "A-", etc.
      const res = await usersAPI.updateProfile(profileUpdate);
      updateUser(res.data);

      toast.success('Expediente guardado correctamente');
      setHasRecord(true);

      bloodAPI.getEligibility()
        .then(r => setEligibility(r.data))
        .catch(() => {});
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
      bloodAPI.getEligibility().then(r => setEligibility(r.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'No puedes registrar esta donación');
    } finally {
      setRegistering(false);
    }
  };

  const btGradient = BLOOD_COLORS[bloodType] || 'from-red-500 to-rose-600';

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
          <ClipboardList size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Expediente de Donante</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">NOM-253-SSA1-2012 · Registro médico para donación de sangre</p>
        </div>
      </div>

      {/* Banner elegibilidad */}
      {eligibility && (
        <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
          eligibility.eligible
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          {eligibility.eligible
            ? <CheckCircle size={22} className="text-green-600 dark:text-green-400 shrink-0" />
            : <XCircle size={22} className="text-red-600 dark:text-red-400 shrink-0" />
          }
          <div className="flex-1">
            <p className={`font-bold text-sm ${eligibility.eligible ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              {eligibility.eligible ? '✅ Apto para donar sangre en este momento' : '❌ No apto para donar actualmente'}
            </p>
            {eligibility.reasons.length > 0 && (
              <ul className="mt-2 space-y-1">
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

      {/* Formulario principal */}
      <form onSubmit={save} className="space-y-5">

        {/* Sección 1: Tipo de sangre y donante */}
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Droplets size={18} className="text-red-500" /> Información de donante
          </h2>

          {/* Tipo de sangre */}
          <div>
            <label className="label-field">Tipo de sangre <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BLOOD_TYPES.map(bt => (
                <button key={bt} type="button"
                  onClick={() => setBloodType(prev => prev === bt ? '' : bt)}
                  className={`py-2.5 rounded-xl font-black text-sm transition-all duration-200 border-2
                    ${bloodType === bt
                      ? `bg-gradient-to-br ${BLOOD_COLORS[bt]} text-white border-transparent shadow-md scale-105`
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-300'
                    }`}>
                  {bt}
                </button>
              ))}
            </div>
            {bloodType && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded-full bg-gradient-to-br ${btGradient}`} />
                Tipo seleccionado: <strong className="text-gray-700 dark:text-gray-200">{bloodType}</strong>
              </p>
            )}
          </div>

          {/* ¿Eres donante activo? */}
          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${isBloodDonor
                ? eligibility && !eligibility.eligible
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-red-200'}`}>
              <input type="checkbox" checked={isBloodDonor}
                onChange={e => {
                  if (e.target.checked && eligibility && !eligibility.eligible) {
                    toast.error('No puedes activarte como donante: completa el expediente y verifica que cumples los requisitos');
                    return;
                  }
                  if (e.target.checked && !bloodType) {
                    toast.error('Primero selecciona tu tipo de sangre');
                    return;
                  }
                  setIsBloodDonor(e.target.checked);
                }}
                className="w-5 h-5 accent-red-500 shrink-0" />
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isBloodDonor ? 'text-red-800 dark:text-red-300' : 'text-gray-800 dark:text-gray-200'}`}>
                  🩸 Registrarme como donante activo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Apareceré en el directorio de donantes para personas que necesiten sangre
                </p>
              </div>
            </label>
            {isBloodDonor && eligibility && !eligibility.eligible && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Atención:</strong> actualmente no cumples los requisitos de elegibilidad. Guarda el expediente y actualiza tus datos cuando puedas donar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sección 2: Datos físicos */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <User size={18} className="text-primary-500" /> Datos físicos <span className="text-xs font-normal text-gray-400">(obligatorios)</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">
                Peso (kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">kg</span>
                <input
                  type="number"
                  min="30" max="250" step="1"
                  value={form.weight_kg}
                  onChange={e => set('weight_kg', e.target.value)}
                  placeholder="65"
                  className="input-field pl-9 text-sm"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Mínimo requerido: 50 kg</p>
            </div>
            <div>
              <label className="label-field">
                Fecha de nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.birth_date}
                onChange={e => set('birth_date', e.target.value)}
                max={new Date().toISOString().substring(0, 10)}
                className="input-field text-sm"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">Edad requerida: 18–65 años</p>
            </div>
          </div>
        </div>

        {/* Sección 3: Exclusiones permanentes */}
        <div className="card p-6 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
            <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-800 dark:text-red-300">Exclusiones permanentes</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Marca las condiciones que tienes. Con cualquiera de estas NO puedes donar.</p>
            </div>
          </div>
          <CheckboxRow items={PERMANENT} form={form} onChange={set} />
        </div>

        {/* Sección 4: Exclusiones temporales */}
        <div className="card p-6 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-amber-800 dark:text-amber-300">Exclusiones temporales</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Situaciones actuales que te impiden donar temporalmente.</p>
            </div>
          </div>
          <CheckboxRow items={TEMPORARY} form={form} onChange={set} />
        </div>

        {/* Notas */}
        <div className="card p-6">
          <label className="label-field">Notas adicionales (opcional)</label>
          <textarea rows={2} value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Medicamentos actuales, alergias, condiciones especiales..."
            className="input-field text-sm resize-none" />
        </div>

        {/* Aviso legal y consentimiento */}
        <div className="card p-5 border-2 border-blue-100 dark:border-blue-900/40 space-y-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Info size={16} className="shrink-0" />
            <h3 className="font-bold text-sm">Aviso de Privacidad y Consentimiento</h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Los datos que proporcionas en este expediente son de carácter <strong>médico y sensible</strong>.
            Su recopilación y tratamiento se realiza conforme a la{' '}
            <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>{' '}
            y a la norma oficial <strong>NOM-253-SSA1-2012</strong> sobre disposición de sangre humana para usos terapéuticos.
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-none">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500 shrink-0">•</span>
              Solo tú puedes ver tus datos médicos (condiciones, peso, fecha de nacimiento).
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500 shrink-0">•</span>
              El público solo ve tu tipo de sangre y conteo de donaciones si eres donante activo.
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500 shrink-0">•</span>
              El tipo de sangre es autodeclarado y debe confirmarse con análisis de laboratorio antes de donar.
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-500 shrink-0">•</span>
              Puedes ejercer tus derechos ARCO (Acceso, Rectificación, Cancelación, Oposición) en cualquier momento eliminando tu cuenta.
            </li>
          </ul>
          {!hasRecord && (
            <label className="flex items-start gap-3 cursor-pointer mt-1">
              <input type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)}
                className="w-4 h-4 accent-blue-600 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                Declaro que la información es verídica y otorgo mi <strong>consentimiento explícito</strong> para el tratamiento de mis datos personales sensibles conforme al aviso de privacidad descrito.
              </span>
            </label>
          )}
        </div>

        {/* Botón guardar */}
        <button type="submit" disabled={saving || (!hasRecord && !consentGiven)}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60">
          <Save size={18} />
          {saving ? 'Guardando...' : hasRecord ? 'Actualizar expediente' : 'Guardar expediente'}
        </button>
      </form>

      {/* Registrar donación */}
      {hasRecord && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Heart size={18} className="text-red-500" />
              Mis donaciones
              {donations.length > 0 && (
                <span className="ml-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                  {donations.length}
                </span>
              )}
            </h2>
            <button onClick={() => setShowDonationForm(v => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              {showDonationForm ? <ChevronUp size={15} /> : <Plus size={15} />}
              {showDonationForm ? 'Cancelar' : 'Registrar donación'}
            </button>
          </div>

          {showDonationForm && (
            <div className="space-y-3 mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Fecha <span className="text-red-500">*</span></label>
                  <input type="date" value={donationDate}
                    onChange={e => setDonationDate(e.target.value)}
                    max={new Date().toISOString().substring(0, 10)}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="label-field">Lugar</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={donationLocation}
                      onChange={e => setDonationLocation(e.target.value)}
                      placeholder="Hospital, banco de sangre..."
                      className="input-field pl-8 text-sm" />
                  </div>
                </div>
              </div>
              <button onClick={registerDonation} disabled={registering}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60">
                <Droplets size={15} />
                {registering ? 'Registrando...' : 'Confirmar donación'}
              </button>
            </div>
          )}

          {donations.length > 0 ? (
            <div>
              <button onClick={() => setShowHistory(v => !v)}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3 transition-colors">
                <Calendar size={14} />
                {showHistory ? 'Ocultar' : 'Ver'} historial
                {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showHistory && (
                <div className="space-y-2">
                  {donations.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0 text-xs font-black text-red-600 dark:text-red-400">
                        #{donations.length - i}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {new Date(d.donation_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {d.location && <p className="text-xs text-gray-400 truncate">{d.location}</p>}
                      </div>
                      <Droplets size={14} className="text-red-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !showDonationForm && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
              No hay donaciones registradas aún
            </p>
          )}
        </div>
      )}
    </div>
  );
}
