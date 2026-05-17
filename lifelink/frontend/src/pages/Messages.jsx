import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, requestsAPI, getMediaUrl } from '../services/api';
import {
  Send, ArrowLeft, MessageCircle, User, Search, Check, CheckCheck,
  Clock, Package, X, InboxIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

function ConversationItem({ conv, active }) {
  const initials = conv.other_user.full_name?.charAt(0).toUpperCase();
  const time = conv.last_message_at
    ? new Date(conv.last_message_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Link
      to={`/messages/${conv.request_id}`}
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative ${
        active ? 'bg-primary-50 dark:bg-primary-900/20 border-l-[3px] border-l-primary-600' : ''
      }`}
    >
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {conv.other_user.avatar_url ? (
          <img src={getMediaUrl(conv.other_user.avatar_url)} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-black text-primary-700">{initials}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>
            {conv.other_user.full_name}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
            {conv.last_message || 'Sin mensajes aún'}
          </p>
          {conv.unread_count > 0 && (
            <span className="w-5 h-5 bg-primary-600 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PendingRequestCard({ req, onRespond, responding }) {
  const sender = req.sender;
  const initials = sender?.full_name?.charAt(0).toUpperCase();
  const isResponding = responding === req.id;

  return (
    <div className="mx-3 mb-2 bg-white dark:bg-gray-800 rounded-2xl border border-primary-100 dark:border-primary-800/50 shadow-sm overflow-hidden">
      {/* Top bar */}
      <div className="h-1 bg-gradient-to-r from-primary-400 to-medical-400" />

      <div className="p-3">
        {/* User info */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {sender?.avatar_url ? (
              <img src={getMediaUrl(sender.avatar_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-primary-700">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{sender?.full_name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">@{sender?.username}</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex-shrink-0">
            <Clock size={9} /> Pendiente
          </div>
        </div>

        {/* Supply link */}
        {req.supply_id && (
          <Link
            to={`/supplies/${req.supply_id}`}
            className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Package size={11} className="text-gray-400 dark:text-gray-500" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex-1 truncate">Ver publicación del insumo</span>
          </Link>
        )}

        {/* Message */}
        {req.message && (
          <div className="mb-2.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 mb-0.5">Mensaje</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{req.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onRespond(req.id, 'aceptada')}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all disabled:opacity-60 shadow-sm"
          >
            {isResponding ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Check size={12} /> Aceptar</>
            )}
          </button>
          <button
            onClick={() => onRespond(req.id, 'rechazada')}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-bold transition-all disabled:opacity-60"
          >
            <X size={12} /> Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 my-5 px-2">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold capitalize bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
        {date}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function MessageBubble({ msg, isMine }) {
  const time = new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`max-w-[70%] sm:max-w-[60%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
          isMine
            ? `bg-primary-600 text-white rounded-br-sm ${msg._pending ? 'opacity-60' : ''}`
            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{time}</span>
          {isMine && !msg._pending && (
            msg.is_read
              ? <CheckCheck size={11} className="text-primary-400" />
              : <Check size={11} className="text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' | 'requests'
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convSearch, setConvSearch] = useState('');

  const [pendingReqs, setPendingReqs] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const pollingRef = useRef(null);

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    try {
      const r = await messagesAPI.getConversations();
      setConversations(r.data || []);
    } catch {
      // silent
    } finally {
      setConvLoading(false);
    }
  }, []);

  // ── Load pending requests ──
  const loadPending = useCallback(async () => {
    try {
      const r = await requestsAPI.getReceived();
      setPendingReqs((r.data || []).filter((req) => req.status === 'pendiente'));
    } catch {
      // silent
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadPending();
  }, [loadConversations, loadPending]);

  // Auto-switch to requests tab if there are pending and no conversations yet
  useEffect(() => {
    if (!convLoading && !pendingLoading) {
      if (pendingReqs.length > 0 && conversations.length === 0) {
        setSidebarTab('requests');
      }
    }
  }, [convLoading, pendingLoading, pendingReqs.length, conversations.length]);

  // ── Respond to request ──
  const handleRespond = async (reqId, status) => {
    setRespondingId(reqId);
    try {
      await requestsAPI.respond(reqId, { status });
      setPendingReqs((prev) => prev.filter((r) => r.id !== reqId));
      if (status === 'aceptada') {
        toast.success('¡Solicitud aceptada! Ya pueden chatear.');
        await loadConversations();
        setSidebarTab('chats');
        navigate(`/messages/${reqId}`);
      } else {
        toast.success('Solicitud rechazada');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al responder');
    } finally {
      setRespondingId(null);
    }
  };

  // ── Load + poll messages ──
  useEffect(() => {
    clearInterval(pollingRef.current);
    if (!requestId) { setMessages([]); return; }

    const load = async () => {
      try {
        const r = await messagesAPI.getMessages(requestId);
        setMessages(r.data || []);
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 404) {
          navigate('/messages');
        }
      }
    };

    setMsgLoading(true);
    load().finally(() => setMsgLoading(false));
    pollingRef.current = setInterval(load, 5000);
    return () => clearInterval(pollingRef.current);
  }, [requestId, navigate]);

  // ── Auto scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ──
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // ── Send message ──
  const handleSend = async (e) => {
    e?.preventDefault();
    const content = newMsg.trim();
    if (!content || !requestId || sending) return;

    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      _pending: true,
    };

    setSending(true);
    setMessages((prev) => [...prev, optimistic]);
    setNewMsg('');
    setTimeout(resizeTextarea, 0);

    try {
      await messagesAPI.send({ request_id: parseInt(requestId), content });
      const r = await messagesAPI.getMessages(requestId);
      setMessages(r.data || []);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setNewMsg(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Group messages by date ──
  const groupedMessages = messages.reduce((acc, msg) => {
    const d = new Date(msg.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString()) label = 'Hoy';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Ayer';
    else label = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);
    return acc;
  }, {});

  const activeConv = conversations.find((c) => String(c.request_id) === String(requestId));
  const filteredConvs = conversations.filter((c) =>
    !convSearch || c.other_user.full_name.toLowerCase().includes(convSearch.toLowerCase())
  );

  // ── SIDEBAR ──
  const Sidebar = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-3">Mensajes</h1>

        {/* Tabs */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setSidebarTab('chats')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              sidebarTab === 'chats'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MessageCircle size={13} />
            Chats
            {conversations.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                sidebarTab === 'chats' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {conversations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSidebarTab('requests')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              sidebarTab === 'requests'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <InboxIcon size={13} />
            Solicitudes
            {pendingReqs.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                sidebarTab === 'requests' ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {pendingReqs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Chats tab ── */}
        {sidebarTab === 'chats' && (
          <>
            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700/50">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-300/40 focus:border-primary-400"
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                />
              </div>
            </div>

            {convLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center animate-pulse">
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg w-2/3" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {convSearch ? 'Sin resultados' : 'Sin conversaciones activas'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {convSearch
                    ? 'Intenta otro nombre'
                    : 'Acepta una solicitud de la pestaña "Solicitudes" para comenzar a chatear'}
                </p>
                {!convSearch && pendingReqs.length > 0 && (
                  <button
                    onClick={() => setSidebarTab('requests')}
                    className="mt-3 text-xs text-amber-600 font-bold hover:underline"
                  >
                    Ver {pendingReqs.length} solicitud{pendingReqs.length !== 1 ? 'es' : ''} pendiente{pendingReqs.length !== 1 ? 's' : ''} →
                  </button>
                )}
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <ConversationItem
                  key={conv.request_id}
                  conv={conv}
                  active={String(conv.request_id) === String(requestId)}
                />
              ))
            )}
          </>
        )}

        {/* ── Requests tab ── */}
        {sidebarTab === 'requests' && (
          <div className="pt-2">
            {pendingLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 mx-3 animate-pulse">
                    <div className="flex gap-2 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="h-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-2" />
                    <div className="flex gap-1.5">
                      <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                      <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingReqs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <InboxIcon size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sin solicitudes pendientes</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Aquí aparecerán las solicitudes de personas interesadas en tus publicaciones
                </p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 mb-2">
                  {pendingReqs.length} solicitud{pendingReqs.length !== 1 ? 'es' : ''} esperando respuesta
                </p>
                {pendingReqs.map((req) => (
                  <PendingRequestCard
                    key={req.id}
                    req={req}
                    onRespond={handleRespond}
                    responding={respondingId}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── CHAT PANEL ──
  const ChatPanel = requestId ? (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <Link
          to="/messages"
          className="md:hidden w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>

        {activeConv ? (
          <>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {activeConv.other_user.avatar_url ? (
                <img src={getMediaUrl(activeConv.other_user.avatar_url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-black text-primary-700">
                  {activeConv.other_user.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
                {activeConv.other_user.full_name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">@{activeConv.other_user.username}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <User size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Conversación</p>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50/60 dark:bg-gray-900/60">
        {msgLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-3xl flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-primary-400 dark:text-primary-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Comienza la conversación</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Envía el primer mensaje</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <DateDivider date={date} />
                {msgs.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === user.id} />
                ))}
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pt-3 pb-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="w-full px-4 py-2.5 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 focus:bg-white dark:focus:bg-gray-800 resize-none transition-all leading-relaxed"
              placeholder="Escribe un mensaje..."
              value={newMsg}
              onChange={(e) => { setNewMsg(e.target.value); resizeTextarea(); }}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={2000}
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!newMsg.trim() || sending}
            className="w-11 h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center text-white transition-all flex-shrink-0 shadow-sm"
          >
            {sending
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 px-1 flex items-center justify-between">
          <span>Shift+Enter para nueva línea · Enter para enviar</span>
          {newMsg.length > 1800 && (
            <span className={newMsg.length > 1950 ? 'text-accent-500 font-semibold' : ''}>
              {newMsg.length}/2000
            </span>
          )}
        </p>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/40 dark:bg-gray-900/40">
      <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-4xl shadow-card flex items-center justify-center mb-5">
        <MessageCircle size={40} className="text-primary-300 dark:text-primary-600" />
      </div>
      <h3 className="font-black text-gray-800 dark:text-gray-200 text-xl mb-2">Tus mensajes</h3>
      <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs leading-relaxed">
        Selecciona una conversación de la lista para leer y responder mensajes
      </p>
      {pendingReqs.length > 0 && (
        <button
          onClick={() => setSidebarTab('requests')}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <InboxIcon size={16} />
          {pendingReqs.length} solicitud{pendingReqs.length !== 1 ? 'es' : ''} pendiente{pendingReqs.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );

  return (
    <div
      className="-mx-4 sm:-mx-6 overflow-hidden"
      style={{ height: 'calc(100dvh - 132px)' }}
    >
      <style>{`
        @media (min-width: 768px) {
          .messages-root { height: calc(100dvh - 96px) !important; }
        }
      `}</style>

      <div className="messages-root flex h-full border-t border-gray-100 dark:border-gray-700" style={{ height: 'calc(100dvh - 132px)' }}>
        {/* Sidebar */}
        <div className={`
          flex-shrink-0 md:w-80 border-r border-gray-100
          ${requestId ? 'hidden md:flex md:flex-col w-80' : 'flex flex-col w-full'}
        `}>
          {Sidebar}
        </div>

        {/* Chat panel */}
        <div className={`flex-1 overflow-hidden ${requestId ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
          {ChatPanel}
        </div>
      </div>
    </div>
  );
}
