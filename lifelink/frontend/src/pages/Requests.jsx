import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { requestsAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Send, Inbox, Check, X, Clock, User, MessageCircle,
  ChevronRight, Package, AlertCircle, Star, Archive,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  aceptada:   { label: 'Aceptada',   cls: 'bg-success-100 text-success-700 border-success-200', dot: 'bg-success-500' },
  rechazada:  { label: 'Rechazada',  cls: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-400' },
  cancelada:  { label: 'Cancelada',  cls: 'bg-gray-100 text-gray-500 border-gray-200',       dot: 'bg-gray-400' },
  completada: { label: 'Completada', cls: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400' },
};

function ReviewModal({ req, otherUser, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating === 0) return toast.error('Selecciona una calificación');
    setSubmitting(true);
    try {
      await reviewsAPI.create({ request_id: req.id, reviewed_id: otherUser.id, rating, comment: comment.trim() || undefined });
      toast.success('¡Reseña publicada!');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al publicar reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-1">Calificar a {otherUser?.full_name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Tu reseña ayuda a la comunidad a confiar entre sí.</p>

        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-125"
            >
              <Star size={36} className={s <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'} />
            </button>
          ))}
        </div>

        <textarea
          className="input-field resize-none text-sm mb-4"
          placeholder="Cuéntanos tu experiencia (opcional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
          <button onClick={submit} disabled={submitting || rating === 0} className="btn-primary flex-1 text-sm">
            {submitting ? 'Publicando...' : 'Publicar reseña'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ req, tab, onRespond, onCancel, onComplete, currentUser }) {
  const [responding, setResponding] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const otherUser = tab === 'received' ? req.sender : req.receiver;
  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pendiente;
  const isPending = req.status === 'pendiente';

  useEffect(() => {
    if (req.status === 'completada') {
      reviewsAPI.canReview(req.id).then((r) => setCanReview(r.data.can_review)).catch(() => {});
    }
  }, [req.id, req.status]);

  const handleRespond = async (newStatus) => {
    setResponding(true);
    try {
      await onRespond(req.id, newStatus, responseMsg);
      setShowReply(false);
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 overflow-hidden animate-fade-in ${
      isPending && tab === 'received'
        ? 'border-primary-100 dark:border-primary-800 shadow-md'
        : 'border-gray-100 dark:border-gray-700 shadow-card'
    }`}>
      {/* Status indicator bar */}
      <div className={`h-1 ${status.dot} opacity-60`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {otherUser?.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-primary-700">
                  {otherUser?.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{otherUser?.full_name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">@{otherUser?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${status.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Supply info */}
        {req.supply_id && (
          <Link
            to={`/supplies/${req.supply_id}`}
            className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <Package size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">Ver publicación del insumo</span>
            <ChevronRight size={12} className="text-gray-400 ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Message */}
        {req.message && (
          <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Mensaje</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{req.message}</p>
          </div>
        )}

        {/* Response message */}
        {req.response_message && (
          <div className="mt-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Respuesta</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">{req.response_message}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
          <Clock size={11} />
          {new Date(req.created_at).toLocaleDateString('es-MX', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="mt-3 pt-3 border-t border-gray-100 animate-slide-down">
            <textarea
              className="input-field resize-none text-sm mb-2"
              placeholder="Mensaje opcional para el solicitante..."
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              rows={2}
              maxLength={300}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleRespond('aceptada')}
                disabled={responding}
                className="flex-1 btn-success text-xs flex items-center justify-center gap-1.5"
              >
                {responding ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={13} /> Aceptar</>}
              </button>
              <button
                onClick={() => handleRespond('rechazada')}
                disabled={responding}
                className="flex-1 btn-danger text-xs flex items-center justify-center gap-1.5"
              >
                <X size={13} /> Rechazar
              </button>
              <button onClick={() => setShowReply(false)} className="btn-secondary text-xs px-3">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showReply && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex-wrap">
            {/* Received + pending: respond */}
            {tab === 'received' && isPending && (
              <button
                onClick={() => setShowReply(true)}
                className="flex-1 btn-primary text-xs flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={13} /> Responder
              </button>
            )}

            {/* Sent + pending: cancel */}
            {tab === 'sent' && isPending && (
              <button
                onClick={() => onCancel(req.id)}
                className="flex-1 btn-secondary text-xs"
              >
                Cancelar solicitud
              </button>
            )}

            {/* Accepted: chat + complete (receiver only) */}
            {req.status === 'aceptada' && (
              <>
                <Link
                  to={`/messages/${req.id}`}
                  className="flex-1 btn-medical text-xs flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={13} /> Ir al chat
                </Link>
                {tab === 'received' && (
                  <button
                    onClick={() => onComplete(req.id)}
                    className="flex-1 btn-success text-xs flex items-center justify-center gap-1.5"
                  >
                    <Archive size={13} /> Marcar entregado
                  </button>
                )}
              </>
            )}

            {/* Completed: leave review */}
            {req.status === 'completada' && canReview && (
              <button
                onClick={() => setShowReview(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 transition-all"
              >
                <Star size={13} /> Dejar reseña
              </button>
            )}
          </div>
        )}
      </div>

      {showReview && (
        <ReviewModal
          req={req}
          otherUser={otherUser}
          onClose={() => setShowReview(false)}
          onDone={() => { setShowReview(false); setCanReview(false); }}
        />
      )}
    </div>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const [tab, setTab] = useState('received');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = tab === 'received'
        ? await requestsAPI.getReceived()
        : await requestsAPI.getSent();
      setRequests(res.data || []);
    } catch {
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRespond = async (id, status, message) => {
    try {
      await requestsAPI.respond(id, { status, response_message: message || undefined });
      toast.success(status === 'aceptada' ? '¡Solicitud aceptada! Ya pueden chatear.' : 'Solicitud rechazada');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al responder');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    try {
      await requestsAPI.cancel(id);
      toast.success('Solicitud cancelada');
      fetchRequests();
    } catch {
      toast.error('Error al cancelar');
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('¿Marcar esta solicitud como entregada? El insumo pasará a estado "Entregado".')) return;
    try {
      await requestsAPI.complete(id);
      toast.success('¡Entrega marcada! El solicitante puede dejar una reseña.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al marcar como entregado');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pendiente').length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Solicitudes</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Gestiona las solicitudes de tus publicaciones</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'received', icon: Inbox, label: 'Recibidas' },
          { key: 'sent',     icon: Send,  label: 'Enviadas' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
            {tab === key && !loading && requests.length > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${tab === key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending alert */}
      {!loading && tab === 'received' && pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-4 animate-fade-in">
          <AlertCircle size={18} className="text-primary-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-primary-700">
            Tienes {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de respuesta
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-11 h-11 bg-gray-100 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/4" />
                </div>
              </div>
              <div className="h-12 bg-gray-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            {tab === 'received' ? <Inbox size={32} className="text-gray-300" /> : <Send size={32} className="text-gray-300" />}
          </div>
          <h3 className="font-bold text-gray-700 text-lg mb-1">
            Sin solicitudes {tab === 'received' ? 'recibidas' : 'enviadas'}
          </h3>
          <p className="text-gray-400 text-sm">
            {tab === 'received'
              ? 'Cuando alguien se interese en tus publicaciones, aparecerá aquí'
              : 'Encuentra insumos que te interesen y envía solicitudes'}
          </p>
          {tab === 'sent' && (
            <Link to="/supplies" className="btn-primary mt-4 inline-flex items-center gap-2">
              <Package size={16} /> Explorar insumos
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              tab={tab}
              onRespond={handleRespond}
              onCancel={handleCancel}
              onComplete={handleComplete}
              currentUser={user}
            />
          ))}
        </div>
      )}
    </div>
  );
}
