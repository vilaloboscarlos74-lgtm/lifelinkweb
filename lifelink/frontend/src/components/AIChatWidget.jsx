import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

const INITIAL_GREETING = '¡Hola! Soy el asistente de LifeLink. Puedo ayudarte con información sobre insumos médicos, donación de sangre, derechos ARCO y cómo usar la plataforma. ¿En qué te puedo ayudar?';

export default function AIChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [displayMessages, setDisplayMessages] = useState([
    { role: 'assistant', content: INITIAL_GREETING },
  ]);
  const [apiMessages, setApiMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, displayMessages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newApiMessages = [...apiMessages, userMsg];

    setDisplayMessages((prev) => [...prev, userMsg]);
    setApiMessages(newApiMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat({ messages: newApiMessages });
      const assistantMsg = { role: 'assistant', content: res.data.message };
      setDisplayMessages((prev) => [...prev, assistantMsg]);
      setApiMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const errorMsg = {
        role: 'assistant',
        content: detail || 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
      };
      setDisplayMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Position above mobile bottom nav when logged in
  const btnBottom = user ? 'bottom-[88px] md:bottom-6' : 'bottom-6';
  const panelBottom = user ? 'bottom-[152px] md:bottom-[80px]' : 'bottom-[80px]';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed ${btnBottom} right-4 md:right-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente IA'}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed ${panelBottom} right-4 md:right-6 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden`}
          style={{ width: '340px', maxWidth: 'calc(100vw - 2rem)', height: '460px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-600 text-white flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Asistente LifeLink</p>
              <p className="text-[11px] text-blue-100">Powered by Gemini</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayMessages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all active:scale-95"
              aria-label="Enviar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
