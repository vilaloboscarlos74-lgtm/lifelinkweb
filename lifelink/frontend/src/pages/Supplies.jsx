import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { suppliesAPI } from '../services/api';
import toast from 'react-hot-toast';
import SupplyCard from '../components/SupplyCard';
import { ALCALDIAS_CDMX, MUNICIPIOS_EDOMEX } from '../constants/ubicaciones';
import {
  Search, SlidersHorizontal, X, Map, LayoutGrid,
  ChevronLeft, ChevronRight, Train,
} from 'lucide-react';

const MeetingPointsMap = lazy(() => import('../components/MeetingPointsMap'));

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'ortopedico',    label: 'Ortopédico' },
  { value: 'rehabilitacion',label: 'Rehabilitación' },
  { value: 'diagnostico',   label: 'Diagnóstico' },
  { value: 'protesis',      label: 'Prótesis' },
  { value: 'mobiliario',    label: 'Mobiliario' },
  { value: 'consumibles',   label: 'Consumibles' },
  { value: 'sangre',        label: 'Sangre' },
  { value: 'otro',          label: 'Otros' },
];

const CONDITION_LABELS = {
  nuevo: 'Nuevo', seminuevo: 'Seminuevo',
  usado_buen_estado: 'Buen estado', usado: 'Usado',
};

export default function Supplies() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Filters — derived from URL ──────────────────────── */
  const getParam = (k, def = '') => searchParams.get(k) || def;
  const urlFilters = {
    query:       getParam('query'),
    category:    getParam('category'),
    supply_type: getParam('supply_type'),
    condition:   getParam('condition'),
    is_urgent:   getParam('is_urgent'),
    city:        getParam('city'),
    sort_by:     getParam('sort_by', 'created_at'),
    order:       getParam('order', 'desc'),
  };

  /* Local query input (only committed on submit) */
  const [queryInput, setQueryInput] = useState(urlFilters.query);

  /* ── Results state ───────────────────────────────────── */
  const [supplies,    setSupplies]    = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [loading,     setLoading]     = useState(true);

  /* ── Map state ───────────────────────────────────────── */
  const [viewMode,    setViewMode]    = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  /* ── Helpers to update URL params ────────────────────── */
  const setFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (value) p.set(key, value);
      else p.delete(key);
      p.delete('page'); // reset to page 1
      return p;
    }, { replace: true });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setQueryInput('');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  /* ── Fetch grid supplies ─────────────────────────────── */
  const fetchSupplies = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      Object.entries(urlFilters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await suppliesAPI.list(params);
      setSupplies(res.data.items || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setPage(p);
    } catch {
      toast.error('Error al cargar insumos');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  /* ── Re-fetch when URL params change ─────────────────── */
  useEffect(() => {
    fetchSupplies(1);
    setQueryInput(getParam('query'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  /* ── Submit text search ──────────────────────────────── */
  const handleSearch = (e) => {
    e?.preventDefault();
    setFilter('query', queryInput.trim());
  };

  /* ── Switch to map view ──────────────────────────────── */
  const handleMapView = () => setViewMode('map');

  const activeFilterCount = ['query','category','supply_type','condition','is_urgent','city']
    .filter((k) => urlFilters[k]).length;

  /* ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Insumos Médicos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {loading ? 'Buscando...' : `${total.toLocaleString()} insumo${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <LayoutGrid size={15} /> Lista
          </button>
          <button
            onClick={viewMode === 'map' ? () => setViewMode('grid') : handleMapView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'map' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Map size={15} /> Mapa
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca, ciudad..."
            className="input-field pl-10"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap">Buscar</button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 whitespace-nowrap ${activeFilterCount > 0 ? 'border-primary-400 bg-primary-50 text-primary-700' : ''}`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Expandable filters */}
      {showFilters && (
        <div className="card p-5 mb-5 animate-slide-down border border-gray-100 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Categoría</label>
              <select className="input-field text-sm" value={urlFilters.category}
                onChange={(e) => setFilter('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Tipo</label>
              <select className="input-field text-sm" value={urlFilters.supply_type}
                onChange={(e) => setFilter('supply_type', e.target.value)}>
                <option value="">Todos</option>
                <option value="donacion">Donación</option>
                <option value="venta">Venta</option>
                <option value="intercambio">Intercambio</option>
                <option value="solicitud">Solicitud</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Alcaldía / Municipio</label>
              <select
                className="input-field text-sm"
                value={urlFilters.city || ''}
                onChange={(e) => setFilter('city', e.target.value)}
              >
                <option value="">Todas las zonas</option>
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
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Condición</label>
              <select className="input-field text-sm" value={urlFilters.condition}
                onChange={(e) => setFilter('condition', e.target.value)}>
                <option value="">Todas</option>
                <option value="nuevo">Nuevo</option>
                <option value="seminuevo">Seminuevo</option>
                <option value="usado_buen_estado">Buen estado</option>
                <option value="usado">Usado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Urgencia</label>
              <select className="input-field text-sm" value={urlFilters.is_urgent}
                onChange={(e) => setFilter('is_urgent', e.target.value)}>
                <option value="">Todos</option>
                <option value="true">Solo urgentes</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Ordenar por</label>
              <select className="input-field text-sm" value={urlFilters.sort_by}
                onChange={(e) => setFilter('sort_by', e.target.value)}>
                <option value="created_at">Más recientes</option>
                <option value="price">Precio</option>
                <option value="views_count">Más vistos</option>
              </select>
            </div>
          </div>
          <button onClick={clearFilters} className="btn-secondary text-xs flex items-center gap-1">
            <X size={13} /> Limpiar todos los filtros
          </button>
        </div>
      )}

      {/* Active filter chips — clicking X auto-re-fetches via URL update */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {urlFilters.query && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              "{urlFilters.query}"
              <button onClick={() => setFilter('query', '')}><X size={11} /></button>
            </span>
          )}
          {urlFilters.category && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              {CATEGORIES.find((c) => c.value === urlFilters.category)?.label}
              <button onClick={() => setFilter('category', '')}><X size={11} /></button>
            </span>
          )}
          {urlFilters.supply_type && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              {{ donacion: 'Donación', venta: 'Venta', intercambio: 'Intercambio', solicitud: 'Solicitud' }[urlFilters.supply_type]}
              <button onClick={() => setFilter('supply_type', '')}><X size={11} /></button>
            </span>
          )}
          {urlFilters.condition && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              {CONDITION_LABELS[urlFilters.condition] ?? urlFilters.condition}
              <button onClick={() => setFilter('condition', '')}><X size={11} /></button>
            </span>
          )}
          {urlFilters.city && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              📍 {urlFilters.city}
              <button onClick={() => setFilter('city', '')}><X size={11} /></button>
            </span>
          )}
          {urlFilters.is_urgent && (
            <span className="inline-flex items-center gap-1.5 bg-accent-50 text-accent-700 border border-accent-200 px-3 py-1 rounded-full text-xs font-medium">
              🚨 Urgentes
              <button onClick={() => setFilter('is_urgent', '')}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* MAP VIEW — puntos de encuentro */}
      {viewMode === 'map' && (
        <div className="mb-6 animate-fade-in">
          <Suspense fallback={
            <div className="h-[500px] rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando mapa...</p>
              </div>
            </div>
          }>
            <MeetingPointsMap height="500px" showLegend />
          </Suspense>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
            <Train size={11} /> Puntos de intercambio seguros en CDMX y Estado de México — metro y hospitales.
          </p>
          <div className="text-center mt-2">
            <Link to="/puntos-encuentro" className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Ver lista completa de puntos de encuentro →
            </Link>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
              <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : supplies.length === 0 && viewMode === 'grid' ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Search size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No se encontraron insumos</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">Intenta ajustar los filtros o busca con otro término</p>
          <button onClick={clearFilters} className="btn-secondary text-sm">
            Limpiar filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {supplies.map((s) => <SupplyCard key={s.id} supply={s} />)}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => fetchSupplies(page - 1)}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                let p;
                if (pages <= 7) p = i + 1;
                else if (page <= 4) p = i + 1;
                else if (page >= pages - 3) p = pages - 6 + i;
                else p = page - 3 + i;
                return (
                  <button key={p} onClick={() => fetchSupplies(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      page === p
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >{p}</button>
                );
              })}

              <button
                onClick={() => fetchSupplies(page + 1)}
                disabled={page === pages}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
