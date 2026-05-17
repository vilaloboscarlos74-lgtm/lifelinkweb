import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { CheckCircle, XCircle, Loader, Mail, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error | no_token
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('no_token');
      return;
    }
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Token inválido o expirado');
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    try {
      await authAPI.resendVerification(resendEmail);
      setResent(true);
    } catch {
      setResent(true); // igual mostramos éxito para no revelar si el email existe
    } finally {
      setResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verificando tu correo...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">¡Correo verificado!</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Tu cuenta de LifeLink Medical está activa.
            Ya puedes donar, solicitar e intercambiar insumos médicos.
          </p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold px-8 py-3.5 rounded-2xl inline-flex items-center gap-2 hover:shadow-lg transition-all"
          >
            Iniciar Sesión <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Enlace inválido</h1>
            <p className="text-gray-500 leading-relaxed">{message}</p>
          </div>

          {!resent ? (
            <form onSubmit={handleResend} className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 text-center">
                Solicita un nuevo enlace de verificación:
              </p>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                type="submit"
                disabled={resending}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {resending
                  ? <><Loader size={16} className="animate-spin" /> Enviando...</>
                  : <><Mail size={16} /> Reenviar enlace</>}
              </button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
              <p className="text-green-800 text-sm font-semibold">
                Si el correo está registrado, recibirás el enlace en breve.
              </p>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-5">
            <Link to="/login" className="text-primary-600 font-bold hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // no_token
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={36} className="text-primary-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Revisa tu correo</h1>
        <p className="text-gray-500 leading-relaxed mb-8">
          Te enviamos un enlace de verificación al registrarte.
          Revisa tu bandeja de entrada y carpeta de spam.
        </p>
        <Link to="/" className="text-primary-600 font-bold hover:underline text-sm">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
