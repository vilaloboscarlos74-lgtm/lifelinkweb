import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { suppliesAPI } from '../services/api';
import {
  Plus, Upload, X, AlertTriangle, ChevronRight, ChevronLeft,
  Package, Tag, MapPin, ImagePlus, CheckCircle2, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MEXICO_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila de Zaragoza',
  'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'México', 'Michoacán de Ocampo', 'Morelos', 'Nayarit', 'Nuevo León',
  'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatán', 'Zacatecas',
];

const CATEGORIES = [
  { value: 'ortopedico',    icon: '🦴', label: 'Ortopédico',    desc: 'Sillas, muletas, bastones' },
  { value: 'rehabilitacion',icon: '💪', label: 'Rehabilitación',desc: 'Equipo fisioterapia' },
  { value: 'diagnostico',   icon: '🔬', label: 'Diagnóstico',   desc: 'Glucómetros, tensiómetros' },
  { value: 'protesis',      icon: '🦿', label: 'Prótesis',      desc: 'Prótesis y órtesis' },
  { value: 'mobiliario',    icon: '🛏️', label: 'Mobiliario',   desc: 'Camas, sillas, mesas' },
  { value: 'consumibles',   icon: '💉', label: 'Consumibles',   desc: 'Jeringas, gasas, guantes' },
  { value: 'sangre',        icon: '🩸', label: 'Sangre',        desc: 'Donación de sangre' },
  { value: 'otro',          icon: '📦', label: 'Otro',          desc: 'Otros insumos médicos' },
];

const SUPPLY_TYPES = [
  {
    value: 'donacion',
    icon: '🎁',
    label: 'Donación',
    desc: 'Regalas el insumo sin costo',
    color: 'border-medical-400 bg-medical-50 text-medical-700',
    badge: 'badge-donation',
  },
  {
    value: 'venta',
    icon: '💰',
    label: 'Venta',
    desc: 'Lo vendes a precio justo',
    color: 'border-primary-400 bg-primary-50 text-primary-700',
    badge: 'badge-sale',
  },
  {
    value: 'intercambio',
    icon: '🔄',
    label: 'Intercambio',
    desc: 'Lo cambias por otro insumo',
    color: 'border-brand-400 bg-brand-50 text-brand-700',
    badge: 'badge-exchange',
  },
];

const CONDITIONS = [
  { value: 'nuevo',             label: 'Nuevo',               desc: 'Sin uso, en caja' },
  { value: 'seminuevo',         label: 'Seminuevo',           desc: 'Poco uso, excelente estado' },
  { value: 'usado_buen_estado', label: 'Usado - Buen estado', desc: 'Funciona perfectamente' },
  { value: 'usado',             label: 'Usado',               desc: 'Con signos de uso normal' },
];

const STEPS = ['Tipo', 'Información', 'Detalles', 'Imágenes'];

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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    supply_type: '',
    category: '',
    condition: 'seminuevo',
    price: '',
    city: '',
    state: '',
    quantity: 1,
    brand: '',
    model: '',
    is_urgent: false,
  });

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  // ── Validation per step ──
  const validateStep = (s) => {
    if (s === 1) {
      if (!form.supply_type) { toast.error('Selecciona el tipo de publicación'); return false; }
      if (!form.category) { toast.error('Selecciona una categoría'); return false; }
      return true;
    }
    if (s === 2) {
      if (!form.title.trim()) { toast.error('El título es obligatorio'); return false; }
      if (form.title.trim().length < 5) { toast.error('El título debe tener al menos 5 caracteres'); return false; }
      if (!form.description.trim()) { toast.error('La descripción es obligatoria'); return false; }
      if (form.description.trim().length < 15) { toast.error('La descripción debe tener al menos 15 caracteres'); return false; }
      if (form.supply_type === 'venta' && (!form.price || parseFloat(form.price) <= 0)) {
        toast.error('El precio es obligatorio para publicaciones de venta'); return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep((s) => s + 1); };
  const prevStep = () => setStep((s) => s - 1);

  // ── Image handling ──
  const addImages = useCallback((files) => {
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...valid]);
  }, [images.length]);

  const handleImageInput = (e) => addImages(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addImages(e.dataTransfer.files);
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ──
  const handleSubmit = async () => {
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
      };
      if (!data.price) delete data.price;

      const res = await suppliesAPI.create(data);

      if (images.length > 0) {
        await suppliesAPI.uploadImages(res.data.id, images);
      }

      toast.success('¡Publicación creada exitosamente!');
      navigate(`/supplies/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al publicar');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Type + Category ──
  const Step1 = (
    <div className="space-y-8">
      {/* Supply type */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-1">Tipo de publicación</label>
        <p className="text-sm text-gray-500 mb-4">¿Qué quieres hacer con el insumo?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUPPLY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, supply_type: t.value }))}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                form.supply_type === t.value
                  ? `${t.color} shadow-md`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-3xl mb-3">{t.icon}</div>
              <p className="font-bold text-gray-900 text-sm">{t.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              {form.supply_type === t.value && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-current rounded-full flex items-center justify-center opacity-80">
                  <CheckCircle2 size={13} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-1">Categoría</label>
        <p className="text-sm text-gray-500 mb-4">¿Qué tipo de insumo médico es?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
              className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                form.category === cat.value
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <p className={`text-xs font-bold ${form.category === cat.value ? 'text-primary-700' : 'text-gray-700'}`}>
                {cat.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Step 2: Basic info ──
  const Step2 = (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-bold text-gray-900">Título *</label>
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
          <label className="text-sm font-bold text-gray-900">Descripción *</label>
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
        {form.description.length > 0 && form.description.length < 15 && (
          <p className="text-xs text-accent-500 mt-1">Mínimo 15 caracteres</p>
        )}
      </div>

      <div>
        <label className="text-sm font-bold text-gray-900 mb-1.5 block">Condición del insumo</label>
        <div className="grid grid-cols-2 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, condition: c.value }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                form.condition === c.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <p className={`text-sm font-semibold ${form.condition === c.value ? 'text-primary-700' : 'text-gray-700'}`}>
                {c.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {form.supply_type === 'venta' && (
        <div>
          <label className="text-sm font-bold text-gray-900 mb-1.5 block">Precio (MXN) *</label>
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
    </div>
  );

  // ── Step 3: Details + location ──
  const Step3 = (
    <div className="space-y-6">
      {/* Location */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-primary-600" />
          <span className="font-bold text-gray-900 text-sm">Ubicación</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ciudad</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="Ej: Guadalajara"
              value={form.city}
              onChange={set('city')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Estado</label>
            <select className="input-field text-sm" value={form.state} onChange={set('state')}>
              <option value="">Seleccionar estado</option>
              {MEXICO_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Details */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag size={16} className="text-primary-600" />
          <span className="font-bold text-gray-900 text-sm">Detalles del producto</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Marca</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="Ej: Drive Medical"
              value={form.brand}
              onChange={set('brand')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Modelo</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="Ej: STD18FA-4E"
              value={form.model}
              onChange={set('model')}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Cantidad</label>
            <input
              type="number"
              className="input-field text-sm"
              min="1"
              max="999"
              value={form.quantity}
              onChange={set('quantity')}
            />
          </div>
        </div>
      </div>

      {/* Urgency */}
      <div>
        <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
          form.is_urgent ? 'border-accent-400 bg-accent-50' : 'border-gray-200 hover:border-amber-200 hover:bg-amber-50/50'
        }`}>
          <div className="pt-0.5">
            <input
              type="checkbox"
              checked={form.is_urgent}
              onChange={set('is_urgent')}
              className="w-4 h-4 accent-accent-500 rounded"
            />
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

  // ── Step 4: Images ──
  const Step4 = (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ImagePlus size={16} className="text-primary-600" />
          <span className="font-bold text-gray-900 text-sm">Imágenes del insumo</span>
          <span className="text-xs text-gray-400 ml-auto">{images.length}/5</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Las publicaciones con fotos reciben hasta 3× más solicitudes. Sube hasta 5 imágenes (JPG, PNG, WebP).
        </p>

        {/* Drop zone */}
        {images.length < 5 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/50'
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageInput}
            />
            <Upload size={28} className={`mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-semibold ${dragOver ? 'text-primary-700' : 'text-gray-600'}`}>
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP · Máx. 5 imágenes</p>
          </div>
        )}

        {/* Image previews */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-600/80 text-white text-[9px] font-bold text-center py-0.5">
                    Principal
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                >
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

      {/* Summary before publish */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Resumen de la publicación</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Tipo</span>
            <span className="font-semibold capitalize">{SUPPLY_TYPES.find(t => t.value === form.supply_type)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Categoría</span>
            <span className="font-semibold">{CATEGORIES.find(c => c.value === form.category)?.icon} {CATEGORIES.find(c => c.value === form.category)?.label}</span>
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
          {form.city && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ubicación</span>
              <span className="font-semibold">{form.city}, {form.state}</span>
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
        </div>
      </div>
    </div>
  );

  const STEP_CONTENT = [Step1, Step2, Step3, Step4];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-medical-600 rounded-xl flex items-center justify-center shadow-sm">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Publicar Insumo</h1>
            <p className="text-gray-500 text-xs">Comparte un insumo médico con la comunidad</p>
          </div>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* Step content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-card p-6 sm:p-8 mb-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="font-black text-gray-900 text-lg">
            {step === 1 && 'Tipo y categoría'}
            {step === 2 && 'Información del insumo'}
            {step === 3 && 'Detalles y ubicación'}
            {step === 4 && 'Imágenes y publicación'}
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {step === 1 && 'Define qué tipo de transacción deseas hacer'}
            {step === 2 && 'Describe el insumo con la mayor precisión posible'}
            {step === 3 && 'Agrega información adicional que ayude a los interesados'}
            {step === 4 && 'Agrega fotos y revisa antes de publicar'}
          </p>
        </div>

        {STEP_CONTENT[step - 1]}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            Continuar <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-primary-600 to-medical-600 hover:from-primary-700 hover:to-medical-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 ml-auto disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><CheckCircle2 size={18} /> Publicar Ahora</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
