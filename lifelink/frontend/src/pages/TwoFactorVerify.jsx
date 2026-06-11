import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Shield, Mail, Loader, ChevronLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tempToken = params.get('temp_token');
  const method = params.get('method') || 'totp';   // 'totp' | 'email' | 'sms'
  const { loginWith2FA, loginWithEmail2FA } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const code = digits.join('');

  // Cuenta regresiva para reenvío
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (code.length < 6) return toast.error('Ingresa el código de 6 dígitos');
    if (!tempToken) return toast.error('Token temporal no encontrado. Inicia sesión de nuevo.');

    setLoading(true);
    try {
      if (method === 'email') {
        await loginWithEmail2FA(tempToken, code);
      } else {
        await loginWith2FA(tempToken, code);
      }
      toast.success('¡Bienvenido de nuevo!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!tempToken || resending || countdown > 0) return;
    setResending(true);
    try {
      if (method === 'email') {
        await authAPI.sendEmail2FA(tempToken);
      } else {
        await authAPI.sms_2fa_send?.({ temp_token: tempToken });
      }
      toast.success('Código reenviado a tu correo');
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al reenviar');
    } finally {
      setResending(false);
    }
  };

  // Auto-submit al completar los 6 dígitos
  useEffect(() => {
    if (code.length === 6 && !loading) handleSubmit();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEmail = method === 'email';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center px-4 py-10 -mx-4 sm:-mx-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">

          {/* Icono */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            isEmail
              ? 'bg-gradient-to-br from-blue-100 to-primary-100'
              : 'bg-gradient-to-br from-primary-100 to-medical-100'
          }`}>
            {isEmail
              ? <Mail size={30} className="text-primary-700" />
              : <Shield size={30} className="text-primary-700" />
            }
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-1.5">
            {isEmail ? 'Código por correo' : 'Verificación 2FA'}
          </h1>

          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {isEmail
              ? 'Te enviamos un código de 6 dígitos a tu correo electrónico. Revisa también la carpeta de spam.'
              : 'Abre tu app autenticadora (Google Authenticator, Authy) e ingresa el código de 6 dígitos.'
            }
          </p>

          {/* Inputs del código */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 transition-all focus:outline-none
                    ${d
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-gray-200 bg-gray-50 text-gray-900'}
                    focus:border-primary-500 focus:bg-primary-50`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg mb-4"
            >
              {loading
                ? <><Loader size={18} className="animate-spin" /> Verificando...</>
                : <><Shield size={18} /> Verificar código</>
              }
            </button>
          </form>

          {/* Botón reenviar (solo para email) */}
          {isEmail && (
            <button
              onClick={resendCode}
              disabled={resending || countdown > 0}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {resending
                ? <><Loader size={14} className="animate-spin" /> Enviando...</>
                : countdown > 0
                ? <><RefreshCw size={14} /> Reenviar en {countdown}s</>
                : <><RefreshCw size={14} /> Reenviar código</>
              }
            </button>
          )}

          <p className="text-sm text-gray-400">
            <Link to="/login" className="inline-flex items-center gap-1 text-primary-600 font-semibold hover:underline">
              <ChevronLeft size={14} /> Volver al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
