import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { suppliesAPI } from '../services/api';
import { MEETING_POINTS, TYPE_CONFIG as POINT_TYPE_CONFIG } from '../data/meetingPoints';
import {
  Plus, Upload, X, AlertTriangle, ChevronRight, ChevronLeft,
  Package, Tag, MapPin, ImagePlus, CheckCircle2, DollarSign,
  Search as SearchIcon, Train, ShieldAlert, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingPointsMap = lazy(() => import('../components/MeetingPointsMap'));

/* ─── Restricciones legales por categoría ─────────────────────────────────
 *
 * lockedTypes        : tipos SIEMPRE prohibidos para esta categoría
 * lockedWhenUsed     : tipos prohibidos si la condición es usado/usado_buen_estado
 * usedConditions     : condiciones que activan lockedWhenUsed
 * noticeSangre       : aviso estático en Step 1
 * noticeUsed         : aviso en Step 2 cuando condición es "usado"
 * noticeInfo         : aviso informativo en Step 2 (siempre visible para la categoría)
 * requireDeclaration : clave del checkbox legal obligatorio en Step 4
 * maxQuantity        : límite máximo de cantidad permitida
 * ──────────────────────────────────────────────────────────────────────── */
const LEGAL_RULES = {
  sangre: {
    lockedTypes: ['venta', 'intercambio'],
    noticeSangre: {
      color: 'red',
      icon: '🩸',
      text: 'La sangre no puede venderse ni intercambiarse. En México la comercialización de sangre humana está prohibida por la Ley General de Salud (Art. 460). Solo se permite la donación voluntaria.',
    },
    maxQuantity: 1,
  },
  consumibles: {
    lockedWhenUsed: ['venta', 'intercambio'],
    usedConditions: ['usado', 'usado_buen_estado'],
    noticeUsed: {
      color: 'amber',
      icon: '⚠️',
      text: 'Los consumibles médicos usados no pueden venderse ni intercambiarse. Los artículos de un solo uso (jeringas, agujas, catéteres) son residuos biosanitarios y su redistribución está prohibida aunque sean "casi nuevos".',
    },
    noticeInfo: {
      color: 'blue',
      icon: '🧴',
      text: 'Solo publica consumibles en perfecto estado higiénico. Jeringas, agujas, catéteres, guantes y gasas usadas NO deben publicarse — son residuos biológico-infecciosos (RPBI) regulados por la NOM-087-SEMARNAT.',
    },
    requireDeclaration: 'consumablesSafety',
  },
  medicamentos: {
    // "medicamentos" no es categoría propia — se maneja via checkbox hasMeds
  },
};

/* Devuelve qué tipos de publicación están bloqueados dado categoría + condición */
function getLockedTypes(category, condition) {
  const rules = LEGAL_RULES[category];
  if (!rules) return [];
  if (rules.lockedTypes) return rules.lockedTypes;
  if (rules.lockedWhenUsed && rules.usedConditions?.includes(condition)) {
    return rules.lockedWhenUsed;
  }
  return [];
}

/* ─── Categorías ───────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: 'ortopedico',    icon: '🦴', label: 'Ortopédico',    desc: 'Sillas, muletas, bastones' },
  { value: 'rehabilitacion',icon: '💪', label: 'Rehabilitación',desc: 'Equipo fisioterapia' },
  { value: 'diagnostico',   icon: '🔬', label: 'Diagnóstico',   desc: 'Glucómetros, tensiómetros' },
  { value: 'protesis',      icon: '🦿', label: 'Prótesis',      desc: 'Prótesis y órtesis' },
  { value: 'mobiliario',    icon: '🛏️', label: 'Mobiliario',   desc: 'Camas, sillas, mesas' },
  { value: 'consumibles',   icon: '💉', label: 'Consumibles',   desc: 'Jeringas, gasas, guantes' },
  { value: 'otro',          icon: '📦', label: 'Otro',          desc: 'Otros insumos médicos' },
];

const SUPPLY_TYPES = [
  { value: 'donacion',   icon: '🎁', label: 'Donación',    desc: 'Regalas el insumo sin costo',     color: 'border-medical-400 bg-medical-50 text-medical-700' },
  { value: 'venta',      icon: '💰', label: 'Venta',       desc: 'Lo vendes a precio justo',         color: 'border-primary-400 bg-primary-50 text-primary-700' },
  { value: 'intercambio',icon: '🔄', label: 'Intercambio', desc: 'Lo cambias por otro insumo',       color: 'border-brand-400 bg-brand-50 text-brand-700' },
  { value: 'solicitud',  icon: '🔍', label: 'Solicitud',   desc: 'Buscas este insumo, defines precio máximo', color: 'border-amber-400 bg-amber-50 text-amber-700' },
];

const CONDITIONS = [
  { value: 'nuevo',             label: 'Nuevo',               desc: 'Sin uso, en caja' },
  { value: 'seminuevo',         label: 'Seminuevo',           desc: 'Poco uso, excelente estado' },
  { value: 'usado_buen_estado', label: 'Usado - Buen estado', desc: 'Funciona perfectamente' },
  { value: 'usado',             label: 'Usado',               desc: 'Con signos de uso normal' },
];

const STEPS = ['Tipo', 'Información', 'Detalles', 'Imágenes'];

/* Devuelve el estado (entidad federativa) de un punto de encuentro */
function getPointState(point) {
  if (point.type === 'metro_edomex') return 'Estado de México';
  if (point.type === 'metro_cdmx') return 'Ciudad de México';
  return /Estado de México|EDOMEX|Naucalpan|Ecatepec|Nezahualcóyotl|Tlalnepantla/i.test(point.address)
    ? 'Estado de México'
    : 'Ciudad de México';
}

/* Componente de aviso legal coloreado */
function LegalNotice({ color = 'amber', icon, text, children }) {
  const palette = {
    red:    'bg-red-50 border-red-200 text-red-800',
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  return (
    <div className={`p-3.5 border rounded-xl flex gap-2.5 ${palette[color]}`}>
      {icon && <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>}
      <div className="text-xs font-medium leading-relaxed">
        {text}
        {children}
      </div>
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                done    ? 'bg-success-600 text-white shadow-sm' :
                active  ? 'bg-primary-600 text-white shadow-md ring-4 ring-primary-200' :
                          'bg-gray-100 text-gray-400'
              }`}>
                {done ? <CheckCircle2 size={18} /> : step}
              </div>
              <span className={`text-[10px] mt-1.5 font-semibold ${active ? 'text-primary-600' : done ? 'text-success-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-16 h-0.5 mx-1 mb-4 transition-all duration-500 ${done ? 'bg-success-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateSupply() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || {};
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const imageUrlsRef = useRef([]);

  /* Meeting point picker */
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [pointSearch, setPointSearch] = useState('');
  const [showPickerMap, setShowPickerMap] = useState(false);

  /* Legal declarations (obligatorias antes de publicar) */
  const [declarations, setDeclarations] = useState({
    generalLegal: false,
    consumablesSafety: false,
    prescriptionMeds: false,
  });
  const [hasPrescriptionMeds, setHasPrescriptionMeds] = useState(false);

  const setDecl = (key) => (e) => setDeclarations((p) => ({ ...p, [key]: e.target.checked }));

  useEffect(() => { imageUrlsRef.current = imageUrls; }, [imageUrls]);
  useEffect(() => () => imageUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const [form, setForm] = useState({
    title: prefill.title || '',
    description: prefill.description || '',
    supply_type: prefill.supply_type || '',
    category: prefill.category || '',
    condition: prefill.condition || 'seminuevo',
    price: '',
    budget_min: '',
    budget_max: '',
    city: '',
    state: '',
    quantity: 1,
    brand: '',
    model: '',
    is_urgent: prefill.is_urgent || false,
  });

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  /* ── Forzar supply_type donacion si el tipo actual queda bloqueado ── */
  useEffect(() => {
    const locked = getLockedTypes(form.category, form.condition);
    if (locked.includes(form.supply_type)) {
      setForm((p) => ({ ...p, supply_type: 'donacion' }));
    }
  }, [form.category, form.condition]);

  /* ── Limitar cantidad a 1 cuando es sangre ── */
  useEffect(() => {
    if (form.category === 'sangre' && form.quantity > 1) {
      setForm((p) => ({ ...p, quantity: 1 }));
    }
  }, [form.category]);

  /* ── Forzar condición "nuevo" para consumibles ── */
  useEffect(() => {
    if (form.category === 'consumibles' && form.condition !== 'nuevo') {
      setForm((p) => ({ ...p, condition: 'nuevo' }));
    }
  }, [form.category, form.condition]);

  /* ── Selección de punto de encuentro ── */
  const handleSelectPoint = useCallback((point) => {
    setSelectedPoint(point);
    setForm((p) => ({ ...p, city: point.name, state: getPointState(point) }));
  }, []);

  const clearPoint = () => {
    setSelectedPoint(null);
    setForm((p) => ({ ...p, city: '', state: '' }));
  };

  const filteredPoints = MEETING_POINTS.filter((p) =>
    p.name.toLowerCase().includes(pointSearch.toLowerCase()) ||
    p.address.toLowerCase().includes(pointSearch.toLowerCase())
  );

  /* ── Variables derivadas de restricciones ── */
  const lockedTypes   = getLockedTypes(form.category, form.condition);
  const rules         = LEGAL_RULES[form.category];
  const isConsumibles = form.category === 'consumibles';
  const isUsed        = ['usado', 'usado_buen_estado'].includes(form.condition);
  const isSangre      = false; // Sangre se maneja en /donors, no aquí
  const isSolicitud   = form.supply_type === 'solicitud';
  const isProtesiOrto = ['protesis', 'ortopedico'].includes(form.category);

  /* ── Validation ── */
  const validateStep = (s) => {
    if (s === 1) {
      if (!form.supply_type) { toast.error('Selecciona el tipo de publicación'); return false; }
      if (!form.category) { toast.error('Selecciona una categoría'); return false; }
      return true;
    }
    if (s === 2) {
      if (!form.title.trim()) { toast.error('El título es obligatorio'); return false; }
      if (form.title.trim().length < 3) { toast.error('El título debe tener al menos 3 caracteres'); return false; }
      if (!form.description.trim()) { toast.error('La descripción es obligatoria'); return false; }
      if (form.description.trim().length < 10) { toast.error('La descripción debe tener al menos 10 caracteres'); return false; }
      if (form.supply_type === 'venta' && (!form.price || parseFloat(form.price) <= 0)) {
        toast.error('El precio es obligatorio para publicaciones de venta'); return false;
      }
      if (form.supply_type === 'solicitud' && form.budget_max && parseFloat(form.budget_max) <= 0) {
        toast.error('El presupuesto máximo debe ser mayor a 0'); return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep((s) => s + 1); };
  const prevStep = () => setStep((s) => s - 1);

  /* ── Image handling ── */
  const addImages = useCallback((files) => {
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 5 - images.length);
    const urls = valid.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...valid]);
    setImageUrls((prev) => [...prev, ...urls]);
  }, [images.length]);

  const handleImageInput = (e) => addImages(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addImages(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(imageUrls[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    /* Validar declaraciones legales */
    if (!declarations.generalLegal) {
      toast.error('Debes aceptar las condiciones de uso y responsabilidad legal');
      return;
    }
    if (isConsumibles && !declarations.consumablesSafety) {
      toast.error('Debes confirmar que los consumibles cumplen las condiciones de seguridad');
      return;
    }
    if (hasPrescriptionMeds && !declarations.prescriptionMeds) {
      toast.error('Debes reconocer la advertencia sobre medicamentos con receta');
      return;
    }

    if (images.length === 0) {
      const confirmed = window.confirm('¿Publicar sin imágenes? Las publicaciones con imágenes reciben más atención.');
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const data = {
        ...form,
        quantity: parseInt(form.quantity) || 1,
        price: form.supply_type === 'venta' && form.price ? parseFloat(form.price) : undefined,
        budget_min: isSolicitud && form.budget_min ? parseFloat(form.budget_min) : undefined,
        budget_max: isSolicitud && form.budget_max ? parseFloat(form.budget_max) : undefined,
      };
      if (!data.price) delete data.price;
      if (!data.budget_min) delete data.budget_min;
      if (!data.budget_max) delete data.budget_max;

      const res = await suppliesAPI.create(data);
      if (images.length > 0) await suppliesAPI.uploadImages(res.data.id, images);

      toast.success('¡Publicación creada exitosamente!');
      navigate(`/supplies/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al publicar');
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════════
   * STEP 1 — Tipo + Categoría
   * ════════════════════════════════════════════════════════════════════ */
  const Step1 = (
    <div className="space-y-8">
      {/* Supply type */}
      <div>
        <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-1">Tipo de publicación</label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">¿Qué quieres hacer con el insumo?</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUPPLY_TYPES.map((t) => {
            const locked = lockedTypes.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => !locked && setForm((p) => ({ ...p, supply_type: t.value }))}
                disabled={locked}
                className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  locked
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-40 cursor-not-allowed'
                    : form.supply_type === t.value
                    ? `${t.color} shadow-md`
                    : 'border-gray-200 dark:border-gray-600 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                }`}
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                {form.supply_type === t.value && !locked && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-current rounded-full flex items-center justify-center opacity-80">
                    <CheckCircle2 size={13} className="text-white" />
                  </div>
                )}
                {locked && (
                  <div className="absolute top-3 right-3">
                    <ShieldAlert size={15} className="text-gray-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Aviso legal de sangre (siempre visible al seleccionar esa categoría) */}
        {isSangre && rules?.noticeSangre && (
          <div className="mt-3">
            <LegalNotice color={rules.noticeSangre.color} icon={rules.noticeSangre.icon} text={rules.noticeSangre.text} />
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-1">Categoría</label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">¿Qué tipo de insumo médico es?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                form.category === cat.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <p className={`text-xs font-bold ${form.category === cat.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {cat.label}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
   * STEP 2 — Información básica + avisos legales contextuales
   * ════════════════════════════════════════════════════════════════════ */
  const Step2 = (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100">Título *</label>
          <span className={`text-xs ${form.title.length > 90 ? 'text-accent-500' : 'text-gray-400'}`}>
            {form.title.length}/100
          </span>
        </div>
        <input
          type="text"
          className="input-field"
          placeholder="Ej: Silla de ruedas plegable aluminio marca Drive"
          value={form.title}
          onChange={set('title')}
          maxLength={100}
        />
        <p className="text-xs text-gray-400 mt-1">Sé específico: marca, modelo, características principales</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100">Descripción *</label>
          <span className={`text-xs ${form.description.length > 900 ? 'text-accent-500' : 'text-gray-400'}`}>
            {form.description.length}/1000
          </span>
        </div>
        <textarea
          className="input-field resize-none"
          placeholder="Describe el estado del insumo, motivo de la publicación, información de uso, accesorios incluidos..."
          value={form.description}
          onChange={set('description')}
          maxLength={1000}
          rows={5}
        />
        {form.description.length > 0 && form.description.length < 10 && (
          <p className="text-xs text-accent-500 mt-1">Mínimo 10 caracteres</p>
        )}
      </div>

      {/* Condición */}
      <div>
        <label className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5 block">Condición del insumo</label>
        {isConsumibles && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">
            ⚠️ Los consumibles médicos (jeringas, agujas, catéteres, etc.) deben publicarse en condición <strong>nuevo</strong> únicamente.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((c) => {
            if (isSangre && c.value !== 'nuevo') return null;
            if (isConsumibles && !['nuevo'].includes(c.value)) return null;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, condition: c.value }))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.condition === c.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                }`}
              >
                <p className={`text-sm font-semibold ${form.condition === c.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>
                  {c.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{c.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Aviso: consumibles usados → solo donación */}
      {isConsumibles && isUsed && (
        <LegalNotice color="amber" icon="⚠️" text={rules?.noticeUsed?.text} />
      )}

      {/* Aviso informativo para consumibles */}
      {isConsumibles && (
        <LegalNotice color="blue" icon="🧴" text={rules?.noticeInfo?.text} />
      )}

      {/* Precio (solo si venta) */}
      {form.supply_type === 'venta' && (
        <div>
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5 block">Precio (MXN) *</label>
          <div className="relative">
            <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              className="input-field pl-9"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Ingresa un precio justo y accesible para la comunidad</p>
        </div>
      )}

      {/* Presupuesto (solo si solicitud) */}
      {isSolicitud && (
        <div>
          <label className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5 block">Presupuesto (MXN)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Mínimo</p>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  className="input-field pl-9"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={form.budget_min}
                  onChange={set('budget_min')}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Máximo</p>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  className="input-field pl-9"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={form.budget_max}
                  onChange={set('budget_max')}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Opcional — define cuánto estás dispuesto a pagar</p>
        </div>
      )}

      {/* ── ¿Incluye medicamentos con receta? ── */}
      {(isConsumibles || form.category === 'otro') && (
        <div className="space-y-2">
          <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
            hasPrescriptionMeds ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={hasPrescriptionMeds}
              onChange={(e) => setHasPrescriptionMeds(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-red-500"
            />
            <div>
              <p className={`text-sm font-bold ${hasPrescriptionMeds ? 'text-red-800 dark:text-red-300' : 'text-gray-800 dark:text-gray-200'}`}>
                ⚕️ Esta publicación incluye medicamentos con receta médica
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Antibióticos, analgésicos controlados, insulina, quimioterapias, etc.
              </p>
            </div>
          </label>

          {hasPrescriptionMeds && (
            <LegalNotice color="red" icon="🏥">
              <strong>Aviso legal importante:</strong> Los medicamentos con receta médica están regulados por la Ley General de Salud (México). Su venta sin prescripción es ilegal. Solo puedes compartirlos como donación cuando el receptor cuente con la prescripción médica correspondiente. LifeLink no se responsabiliza del uso indebido de medicamentos controlados.
            </LegalNotice>
          )}
        </div>
      )}

      {/* Aviso de especificaciones para prótesis y ortopédico */}
      {isProtesiOrto && (
        <LegalNotice color="blue" icon={form.category === 'protesis' ? '🦿' : '🦽'}>
          <strong>Especificaciones requeridas:</strong> Para {form.category === 'protesis' ? 'prótesis' : 'equipo ortopédico'} es obligatorio incluir en la descripción: <strong>talla/medidas</strong>, <strong>lado</strong> (derecho/izquierdo si aplica), <strong>marca y modelo</strong>, y <strong>estado de higiene</strong>. Esto garantiza que el receptor pueda evaluar si es adecuado para sus necesidades.
        </LegalNotice>
      )}

      {/* Aviso para equipo ortopédico/prótesis de segunda mano */}
      {isProtesiOrto && isUsed && (
        <LegalNotice color="amber" icon="⚠️">
          <strong>Importante:</strong> El equipo de segunda mano debe estar limpio y en condiciones de uso seguro. Se recomienda que el receptor consulte a un especialista antes de utilizarlo.
        </LegalNotice>
      )}

      {/* Aviso para diagnóstico */}
      {form.category === 'diagnostico' && isUsed && (
        <LegalNotice color="blue" icon="🔬">
          Los dispositivos de diagnóstico usados (glucómetros, tensiómetros, oxímetros) deben ser calibrados y limpiados antes de su uso. Incluye en la descripción si tienen accesorios, batería y cuánto tiempo llevan en uso.
        </LegalNotice>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
   * STEP 3 — Punto de encuentro + Detalles
   * ════════════════════════════════════════════════════════════════════ */
  const Step3 = (
    <div className="space-y-6">

      {/* ── Punto de encuentro ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={16} className="text-primary-600" />
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Punto de encuentro</span>
          <span className="ml-auto text-xs text-gray-400 font-medium">Opcional</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Elige dónde realizarás la entrega. Esto ayuda a los interesados a saber si están cerca.
        </p>

        {selectedPoint ? (
          <div className="p-4 bg-primary-50 border-2 border-primary-300 rounded-2xl flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{POINT_TYPE_CONFIG[selectedPoint.type]?.emoji}</span>
              <div className="min-w-0">
                <p className="font-bold text-primary-900 text-sm leading-snug">{selectedPoint.name}</p>
                <p className="text-xs text-primary-600 truncate mt-0.5">{selectedPoint.address}</p>
                {selectedPoint.lines && (
                  <p className="text-[10px] text-primary-500 mt-0.5">🚇 Líneas: {selectedPoint.lines}</p>
                )}
              </div>
            </div>
            <button type="button" onClick={clearPoint}
              className="w-7 h-7 rounded-full bg-primary-200 hover:bg-red-100 text-primary-700 hover:text-red-600 flex items-center justify-center flex-shrink-0 transition-all">
              <X size={13} />
            </button>
          </div>
        ) : null}

        <div className="relative mb-2">
          <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar metro, hospital, colonia..."
            value={pointSearch}
            onChange={(e) => setPointSearch(e.target.value)}
            className="input-field text-sm pl-9"
          />
        </div>

        <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {filteredPoints.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Sin resultados</p>
          ) : filteredPoints.map((point) => {
            const isSelected = selectedPoint?.id === point.id;
            return (
              <button key={point.id} type="button" onClick={() => handleSelectPoint(point)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isSelected ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                <span className="text-lg flex-shrink-0">{POINT_TYPE_CONFIG[point.type]?.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {point.name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{point.address}</p>
                </div>
                {isSelected && <CheckCircle2 size={15} className="text-primary-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => setShowPickerMap((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
          <Train size={13} />
          {showPickerMap ? 'Ocultar mapa de puntos' : 'Ver mapa de puntos de encuentro'}
        </button>

        {showPickerMap && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 text-center py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-medium">
              Haz clic en un marcador para seleccionarlo como punto de entrega
            </p>
            <Suspense fallback={
              <div className="h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                Cargando mapa...
              </div>
            }>
              <MeetingPointsMap height="300px" showLegend={false} onSelectPoint={handleSelectPoint} />
            </Suspense>
          </div>
        )}
      </div>

      {/* ── Detalles del producto ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={16} className="text-primary-600" />
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Detalles del producto</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Marca</label>
            <input type="text" className="input-field text-sm" placeholder="Ej: Drive Medical"
              value={form.brand} onChange={set('brand')} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Modelo</label>
            <input type="text" className="input-field text-sm" placeholder="Ej: STD18FA-4E"
              value={form.model} onChange={set('model')} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Cantidad</label>
            <input type="number" className="input-field text-sm" min="1"
              max={isSangre ? 1 : 999}
              value={form.quantity} onChange={set('quantity')}
              disabled={isSangre}
            />
            {isSangre && <p className="text-[10px] text-gray-400 mt-1">La cantidad para sangre siempre es 1</p>}
          </div>
        </div>
      </div>

      {/* ── Urgencia ── */}
      <div>
        <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
          form.is_urgent ? 'border-accent-400 bg-accent-50' : 'border-gray-200 hover:border-amber-200 hover:bg-amber-50/50'
        }`}>
          <div className="pt-0.5">
            <input type="checkbox" checked={form.is_urgent} onChange={set('is_urgent')}
              className="w-4 h-4 accent-accent-500 rounded" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className={form.is_urgent ? 'text-accent-600' : 'text-amber-500'} />
              <span className={`text-sm font-bold ${form.is_urgent ? 'text-accent-700' : 'text-gray-800'}`}>
                Marcar como urgente
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${form.is_urgent ? 'text-accent-600' : 'text-gray-500'}`}>
              Las publicaciones urgentes aparecen destacadas y tienen mayor visibilidad
            </p>
          </div>
        </label>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
   * STEP 4 — Imágenes + Declaraciones legales + Resumen
   * ════════════════════════════════════════════════════════════════════ */
  const Step4 = (
    <div className="space-y-5">
      {/* Zona de imágenes */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ImagePlus size={16} className="text-primary-600" />
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Imágenes del insumo</span>
          <span className="text-xs text-gray-400 ml-auto">{images.length}/5</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Las publicaciones con fotos reciben hasta 3× más solicitudes. Sube hasta 5 imágenes (JPG, PNG, WebP).
        </p>

        {images.length < 5 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
              dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/50'
            }`}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageInput} />
            <Upload size={28} className={`mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-semibold ${dragOver ? 'text-primary-700' : 'text-gray-600'}`}>
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP · Máx. 5 imágenes</p>
          </div>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                <img src={imageUrls[i]} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-600/80 text-white text-[9px] font-bold text-center py-0.5">
                    Principal
                  </div>
                )}
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                  <X size={11} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all">
                <Plus size={18} className="text-gray-400" />
                <span className="text-[10px] text-gray-400 mt-1">Agregar</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageInput} />
              </label>
            )}
          </div>
        )}
      </div>

      {/* ── Declaraciones legales ── */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={15} className="text-primary-600" />
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Declaraciones legales requeridas</p>
        </div>

        {/* Siempre requerida */}
        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
          declarations.generalLegal ? 'bg-success-50 border-success-300' : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          <input type="checkbox" checked={declarations.generalLegal} onChange={setDecl('generalLegal')}
            className="mt-0.5 w-4 h-4 accent-success-600 flex-shrink-0" />
          <p className={`text-xs leading-relaxed ${declarations.generalLegal ? 'text-success-800 font-medium' : 'text-gray-600'}`}>
            Declaro que soy el propietario legítimo de este insumo y que la información proporcionada es veraz. Entiendo que LifeLink es una plataforma de intermediación y no se responsabiliza de transacciones ilícitas.
          </p>
        </label>

        {/* Requerida para consumibles */}
        {isConsumibles && (
          <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            declarations.consumablesSafety ? 'bg-success-50 border-success-300' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input type="checkbox" checked={declarations.consumablesSafety} onChange={setDecl('consumablesSafety')}
              className="mt-0.5 w-4 h-4 accent-success-600 flex-shrink-0" />
            <p className={`text-xs leading-relaxed ${declarations.consumablesSafety ? 'text-success-800 font-medium' : 'text-gray-600'}`}>
              🧴 Confirmo que estos consumibles están en condiciones higiénicas adecuadas para su uso, no son materiales contaminados ni artículos de un solo uso ya utilizados (jeringas, agujas, catéteres, gasas con sangre u otros RPBI).
            </p>
          </label>
        )}

        {/* Requerida si tiene medicamentos con receta */}
        {hasPrescriptionMeds && (
          <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            declarations.prescriptionMeds ? 'bg-success-50 border-success-300' : 'bg-red-50 border-red-200 hover:border-red-300'
          }`}>
            <input type="checkbox" checked={declarations.prescriptionMeds} onChange={setDecl('prescriptionMeds')}
              className="mt-0.5 w-4 h-4 accent-success-600 flex-shrink-0" />
            <p className={`text-xs leading-relaxed ${declarations.prescriptionMeds ? 'text-success-800 font-medium' : 'text-red-700'}`}>
              ⚕️ Entiendo que los medicamentos con receta solo pueden transferirse legalmente al amparo de una prescripción médica válida, y me responsabilizo de que la transacción cumpla con la Ley General de Salud de México.
            </p>
          </label>
        )}
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-600">
        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Resumen de la publicación</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Tipo</span>
            <span className="font-semibold capitalize">{SUPPLY_TYPES.find(t => t.value === form.supply_type)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Categoría</span>
            <span className="font-semibold">
              {CATEGORIES.find(c => c.value === form.category)?.icon}{' '}
              {CATEGORIES.find(c => c.value === form.category)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Título</span>
            <span className="font-semibold text-right max-w-[60%] truncate">{form.title || '—'}</span>
          </div>
          {form.supply_type === 'venta' && (
            <div className="flex justify-between">
              <span className="text-gray-500">Precio</span>
              <span className="font-semibold text-primary-700">${parseFloat(form.price || 0).toLocaleString('es-MX')} MXN</span>
            </div>
          )}
          {isSolicitud && (form.budget_min || form.budget_max) && (
            <div className="flex justify-between">
              <span className="text-gray-500">Presupuesto</span>
              <span className="font-semibold text-amber-700">
                {form.budget_min ? `$${parseFloat(form.budget_min).toLocaleString('es-MX')}` : '$0'} –{' '}
                {form.budget_max ? `$${parseFloat(form.budget_max).toLocaleString('es-MX')} MXN` : 'sin límite'}
              </span>
            </div>
          )}
          {selectedPoint && (
            <div className="flex justify-between">
              <span className="text-gray-500">Punto de entrega</span>
              <span className="font-semibold text-right max-w-[60%] truncate">{selectedPoint.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Imágenes</span>
            <span className="font-semibold">{images.length} imagen{images.length !== 1 ? 'es' : ''}</span>
          </div>
          {form.is_urgent && (
            <div className="flex items-center gap-2 pt-1">
              <AlertTriangle size={13} className="text-accent-500" />
              <span className="text-xs font-semibold text-accent-600">Marcado como urgente</span>
            </div>
          )}
          {hasPrescriptionMeds && (
            <div className="flex items-center gap-2 pt-1">
              <Info size={13} className="text-red-500" />
              <span className="text-xs font-semibold text-red-600">Incluye medicamentos con receta</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const STEP_CONTENT = [Step1, Step2, Step3, Step4];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-medical-600 rounded-xl flex items-center justify-center shadow-sm">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight">
              {form.supply_type === 'solicitud' ? 'Solicitar Insumo' : 'Publicar Insumo'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {prefill.is_urgent
                ? '⚡ Solicitud urgente — pre-rellenada con el insumo seleccionado'
                : form.supply_type === 'solicitud'
                ? '🔍 Publica lo que necesitas y recibe ofertas de la comunidad'
                : 'Comparte un insumo médico con la comunidad'}
            </p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-card p-6 sm:p-8 mb-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">
            {step === 1 && 'Tipo y categoría'}
            {step === 2 && 'Información del insumo'}
            {step === 3 && 'Punto de entrega y detalles'}
            {step === 4 && 'Imágenes y publicación'}
          </h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
            {step === 1 && 'Define qué tipo de transacción deseas hacer'}
            {step === 2 && 'Describe el insumo con la mayor precisión posible'}
            {step === 3 && 'Elige dónde harás la entrega y agrega más detalles'}
            {step === 4 && 'Agrega fotos, acepta las declaraciones y publica'}
          </p>
        </div>

        {STEP_CONTENT[step - 1]}
      </div>

      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-2">
            <ChevronLeft size={16} /> Anterior
          </button>
        ) : <div />}

        {step < 4 ? (
          <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2 ml-auto">
            Continuar <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="bg-gradient-to-r from-primary-600 to-medical-600 hover:from-primary-700 hover:to-medical-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 ml-auto disabled:opacity-60">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><CheckCircle2 size={18} /> Publicar Ahora</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
