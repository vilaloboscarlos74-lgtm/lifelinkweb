import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Ingresa tu correo electrónico');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch {
      // Siempre mostrar éxito para no revelar si el email existe
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10">

        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-8 transition-colors">
          <ArrowLeft size={15} /> Volver al inicio de sesión
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-success-600 dark:text-success-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-3">Revisa tu correo</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Si <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ¿No llegó? Revisa tu carpeta de spam o{' '}
              <button
                onClick={() => setSent(false)}
                className="text-primary-600 font-semibold hover:underline"
              >
                intenta de nuevo
              </button>.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Mail size={22} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">¿Olvidaste tu contraseña?</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-medical-500 hover:from-primary-700 hover:to-medical-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail size={17} /> Enviar enlace de recuperación
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
