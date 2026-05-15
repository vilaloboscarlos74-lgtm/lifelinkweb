import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Package, MessageCircle, Droplets, ToggleLeft, ToggleRight, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      setLoading(true);
      adminAPI.getUsers({ limit: 50 }).then(r => setUsers(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  const toggleUser = async (id) => {
    try {
      const res = await adminAPI.toggleUserActive(id);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
      toast.success(res.data.detail);
    } catch (err) { toast.error('Error'); }
  };

  if (loading && !stats) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['stats', 'Estadísticas'], ['users', 'Usuarios']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${tab === key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Usuarios totales', value: stats.users?.total, sub: `${stats.users?.active ?? 0} activos`, color: 'text-primary-600 bg-primary-100' },
            { icon: Package, label: 'Insumos publicados', value: stats.supplies?.total, sub: `${stats.supplies?.available ?? 0} disponibles`, color: 'text-medical-600 bg-medical-100' },
            { icon: MessageCircle, label: 'Solicitudes', value: stats.requests?.total, sub: `${stats.requests?.pending ?? 0} pendientes`, color: 'text-amber-600 bg-amber-100' },
            { icon: Droplets, label: 'Donantes de sangre', value: stats.users?.blood_donors, sub: `${stats.requests?.completed ?? 0} completadas`, color: 'text-accent-600 bg-accent-100' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.full_name}</p>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'donante' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleUser(u.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title={u.is_active ? 'Desactivar' : 'Activar'}>
                          {u.is_active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
