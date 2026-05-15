import { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { suppliesAPI } from '../services/api';
import SupplyCard from '../components/SupplyCard';
import {
  Search, SlidersHorizontal, X, Map, LayoutGrid,
  ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';

const SupplyMap = lazy(() => import('../components/SupplyMap'));

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'ortopedico', label: 'Ortopédico' },
  { value: 'rehabilitacion', label: 'Rehabilitación' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'protesis', label: 'Prótesis' },
  { value: 'mobiliario', label: 'Mobiliario' },
  { value: 'consumibles', label: 'Consumibles' },
  { value: 'sangre', label: 'Sangre' },
  { value: 'otro', label: 'Otros' },
];

export default function Supplies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [supplies, setSupplies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  const [filters, setFilters] = useState({
    query: searchParams.get('query') || '',
    category: searchParams.get('category') || '',
    supply_type: searchParams.get('supply_type') || '',
    condition: searchParams.get('condition') || '',
    is_urgent: searchParams.get('is_urgent') || '',
    city: searchParams.get('city') || '',
    sort_by: 'created_at',
    order: 'desc',
  });

  // For map view we load more items (up to 100)
  const [mapSupplies, setMapSupplies] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  const fetchSupplies = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await suppliesAPI.list(params);
      setSupplies(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchMapSupplies = async () => {
    setMapLoading(true);
    try {
      const params = { limit: 100 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await suppliesAPI.list(params);
      setMapSupplies(res.data.items || []);
    } catch {
      // silent
    } finally {
      setMapLoading(false);
    }
  };

  useEffect(() => { fetchSupplies(); }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchSupplies(1);
  };

  const handleMapView = () => {
    setViewMode('map');
    fetchMapSupplies();
  };

  const clearFilters = () => {
    const clean = { query: '', category: '', supply_type: '', condition: '', is_urgent: '', city: '', sort_by: 'created_at', order: 'desc' };
    setFilters(clean);
    setSearchParams({});
    setTimeout(() => {
      fetchSupplies(1);
    }, 0);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && !['sort_by', 'order'].includes(k)
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Insumos Médicos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'Buscando...' : `${total.toLocaleString()} insumo${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid size={15} /> Lista
          </button>
          <button
            onClick={viewMode === 'map' ? () => setViewMode('grid') : handleMapView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'map' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
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
        <div className="card p-5 mb-5 animate-slide-down border border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Categoría</label>
              <select className="input-field text-sm" value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tipo</label>
              <select className="input-field text-sm" value={filters.supply_type}
                onChange={(e) => setFilters({ ...filters, supply_type: e.target.value })}>
                <option value="">Todos</option>
                <option value="donacion">Donación</option>
                <option value="venta">Venta</option>
                <option value="intercambio">Intercambio</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ciudad</label>
              <input type="text" className="input-field text-sm" placeholder="Ej: Guadalajara"
                value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Condición</label>
              <select className="input-field text-sm" value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}>
                <option value="">Todas</option>
                <option value="nuevo">Nuevo</option>
                <option value="como_nuevo">Como nuevo</option>
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Urgencia</label>
              <select className="input-field text-sm" value={filters.is_urgent}
                onChange={(e) => setFilters({ ...filters, is_urgent: e.target.value })}>
                <option value="">Todos</option>
                <option value="true">Solo urgentes</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ordenar por</label>
              <select className="input-field text-sm" value={filters.sort_by}
                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}>
                <option value="created_at">Más recientes</option>
                <option value="price">Precio</option>
                <option value="views_count">Más vistos</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSearch} className="btn-primary text-xs">Aplicar filtros</button>
            <button onClick={clearFilters} className="btn-secondary text-xs flex items-center gap-1">
              <X size={13} /> Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.query && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              "{filters.query}"
              <button onClick={() => setFilters({ ...filters, query: '' })}><X size={11} /></button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              {CATEGORIES.find((c) => c.value === filters.category)?.label}
              <button onClick={() => setFilters({ ...filters, category: '' })}><X size={11} /></button>
            </span>
          )}
          {filters.supply_type && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              {filters.supply_type === 'donacion' ? 'Donación' : filters.supply_type === 'venta' ? 'Venta' : 'Intercambio'}
              <button onClick={() => setFilters({ ...filters, supply_type: '' })}><X size={11} /></button>
            </span>
          )}
          {filters.condition && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              {filters.condition === 'nuevo' ? 'Nuevo' : filters.condition === 'como_nuevo' ? 'Como nuevo' : filters.condition === 'bueno' ? 'Bueno' : 'Regular'}
              <button onClick={() => setFilters({ ...filters, condition: '' })}><X size={11} /></button>
            </span>
          )}
          {filters.city && (
            <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 rounded-full text-xs font-medium">
              📍 {filters.city}
              <button onClick={() => setFilters({ ...filters, city: '' })}><X size={11} /></button>
            </span>
          )}
          {filters.is_urgent && (
            <span className="inline-flex items-center gap-1.5 bg-accent-50 text-accent-700 border border-accent-200 px-3 py-1 rounded-full text-xs font-medium">
              🚨 Urgentes
              <button onClick={() => setFilters({ ...filters, is_urgent: '' })}><X size={11} /></button>
            </span>
          )}
        </div>
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div className="mb-6 animate-fade-in">
          {mapLoading ? (
            <div className="h-[500px] rounded-2xl bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Cargando mapa...</p>
              </div>
            </div>
          ) : (
            <Suspense fallback={
              <div className="h-[500px] rounded-2xl bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500 text-sm">Cargando mapa...</p>
              </div>
            }>
              <SupplyMap supplies={mapSupplies} height="500px" />
            </Suspense>
          )}
          <p className="text-xs text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
            <AlertCircle size={11} />
            Solo se muestran insumos en ciudades reconocidas. Haz clic en un marcador para ver detalles.
          </p>
        </div>
      )}

      {/* GRID VIEW */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="aspect-[4/3] bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : supplies.length === 0 && viewMode === 'grid' ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Search size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No se encontraron insumos</h3>
          <p className="text-gray-400 text-sm mb-5">Intenta ajustar los filtros o busca con otro término</p>
          <button onClick={clearFilters} className="btn-secondary text-sm">
            Limpiar filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {supplies.map((s) => <SupplyCard key={s.id} supply={s} />)}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => fetchSupplies(page - 1)}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                  <button
                    key={p}
                    onClick={() => fetchSupplies(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      page === p
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => fetchSupplies(page + 1)}
                disabled={page === pages}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
