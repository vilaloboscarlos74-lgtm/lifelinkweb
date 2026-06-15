import { MapPin } from 'lucide-react';
import { ESTADOS_AREA, MUNICIPIOS_POR_ESTADO } from '../constants/ubicaciones';

/**
 * Dos selects enlazados: Estado → Alcaldía/Municipio (CDMX y EdoMex).
 *
 * Props:
 *   estado / onEstadoChange   — valor del primer select y su setter
 *   ciudad / onCiudadChange   — valor del segundo select y su setter
 *   required                  — marca ambos campos como requeridos
 *   labelEstado / labelCiudad — etiquetas personalizables
 *   className                 — clases extra para el wrapper
 */
export default function UbicacionSelect({
  estado = '',
  ciudad = '',
  onEstadoChange,
  onCiudadChange,
  required = false,
  labelEstado = 'Estado',
  labelCiudad = 'Alcaldía / Municipio',
  className = '',
}) {
  const municipios = MUNICIPIOS_POR_ESTADO[estado] || [];

  const handleEstado = (e) => {
    onEstadoChange(e.target.value);
    onCiudadChange(''); // resetear ciudad al cambiar estado
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
          <MapPin size={13} className="text-primary-500" />
          {labelEstado}
          {required && <span className="text-accent-500 ml-0.5">*</span>}
        </label>
        <select
          className="input-field"
          value={estado}
          onChange={handleEstado}
          required={required}
        >
          <option value="">Seleccionar estado</option>
          {ESTADOS_AREA.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          {labelCiudad}
          {required && <span className="text-accent-500 ml-0.5">*</span>}
        </label>
        <select
          className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
          value={ciudad}
          onChange={(e) => onCiudadChange(e.target.value)}
          disabled={!estado}
          required={required}
        >
          <option value="">
            {estado ? 'Seleccionar alcaldía / municipio' : 'Primero elige el estado'}
          </option>
          {municipios.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
