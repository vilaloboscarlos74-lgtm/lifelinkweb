import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, Clock, MessageCircle, UserCheck,
  UserX, Info, Trash2, ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';

const TYPE_ICONS = {
  solicitud_nueva: MessageCircle,
  solicitud_aceptada: UserCheck,
  solicitud_rechazada: UserX,
  mensaje_nuevo: MessageCircle,
  resena_nueva: Bell,
  sistema: Info,
};
const TYPE_COLORS = {
  solicitud_nueva:    'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  solicitud_aceptada: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  solicitud_rechazada:'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
  mensaje_nuevo:      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  resena_nueva:       'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  sistema:            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll({ page: p, limit: 20 });
      const data = res.data;
      setNotifs(data.items || []);
      setTotal(data.total || 0);
      setUnread(data.unread || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch {
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      toast.error('Error al marcar como leídas');
    }
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // no feedback needed — user can retry by clicking again
    }
  };

  const deleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      setNotifs((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // silent
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Notificaciones</h1>
          {unread > 0 && (
            <p className="text-sm text-primary-600 font-medium mt-0.5">
              {unread} sin leer
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <CheckCheck size={14} /> Marcar todas leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-2/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Bell size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg mb-1">Sin notificaciones</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Aquí aparecerán las actualizaciones de tu cuenta</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifs.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              const colorCls = TYPE_COLORS[n.type] || 'bg-gray-100 text-gray-600';

              return (
                <div
                  key={n.id}
                  onClick={async () => {
                    if (!n.is_read) await markRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                  className={`group bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-start gap-3 border transition-all duration-200 animate-fade-in ${
                    n.link ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    !n.is_read
                      ? 'border-primary-100 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10 shadow-sm hover:shadow-md'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.content}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(n.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!n.is_read && (
                      <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />
                    )}
                    {n.link && (
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-primary-400 transition-colors" />
                    )}
                    <button
                      onClick={(e) => deleteNotif(e, n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 text-gray-400 dark:text-gray-500 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => fetchNotifs(page - 1)}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                {page} / {pages}
              </span>
              <button
                onClick={() => fetchNotifs(page + 1)}
                disabled={page === pages}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
