import { useState, useEffect } from 'react';
import { suppliesAPI } from '../services/api';
import SupplyCard from '../components/SupplyCard';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Favorites() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    suppliesAPI.getFavorites().then(r => setSupplies(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleUnfavorite = async (id) => {
    try {
      await suppliesAPI.toggleFavorite(id);
      setSupplies(supplies.filter(s => s.id !== id));
      toast.success('Eliminado de favoritos');
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Favoritos</h1>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : supplies.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Heart size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg mb-1">Sin favoritos aún</p>
          <p className="text-sm">Marca insumos como favoritos para verlos aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {supplies.map((s) => <SupplyCard key={s.id} supply={s} onFavorite={handleUnfavorite} />)}
        </div>
      )}
    </div>
  );
}
