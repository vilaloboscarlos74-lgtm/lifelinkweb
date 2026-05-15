import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { suppliesAPI } from '../services/api';
import SupplyCard from '../components/SupplyCard';
import { Heart, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Favorites() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(() => {
    setLoading(true);
    suppliesAPI.getFavorites()
      .then((r) => setSupplies(r.data || []))
      .catch(() => toast.error('Error al cargar favoritos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const handleUnfavorite = async (id) => {
    try {
      await suppliesAPI.toggleFavorite(id);
      setSupplies((prev) => prev.filter((s) => s.id !== id));
      toast.success('Eliminado de favoritos');
    } catch {
      toast.error('Error al eliminar de favoritos');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 w-40 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Mis Favoritos</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {supplies.length > 0
            ? `${supplies.length} insumo${supplies.length !== 1 ? 's' : ''} guardado${supplies.length !== 1 ? 's' : ''}`
            : 'Guarda insumos para encontrarlos fácilmente'}
        </p>
      </div>

      {supplies.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Heart size={36} className="text-rose-300 dark:text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Sin favoritos aún</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
            Marca insumos con ❤️ para guardarlos y encontrarlos rápido
          </p>
          <Link to="/supplies" className="btn-primary inline-flex items-center gap-2">
            <Package size={16} /> Explorar insumos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {supplies.map((s) => (
            <SupplyCard key={s.id} supply={s} onFavorite={handleUnfavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
