import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) return toast.error('Debe incluir al menos una mayúscula');
    if (!/\d/.test(password)) return toast.error('Debe incluir al menos un número');
    if (password !== confirm) return toast.error('Las contraseñas no coinciden');
    if (!token) return toast.error('Enlace inválido. Solicita uno nuevo.');

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'El enlace es inválido o ha expirado');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl mb-4">🔗</p>
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Enlace inválido</h2>
          <p className="text-gray-400 text-sm mb-6">Este enlace no es válido. Solicita uno nuevo.</p>
          <Link to="/forgot-password" className="btn-primary inline-flex items-center gap-2">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-10">

        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-success-600 dark:text-success-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-3">¡Contraseña actualizada!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
              Tu contraseña se cambió correctamente. Ya puedes iniciar sesión.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-primary-600 to-medical-500 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all"
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-8 transition-colors">
              <ArrowLeft size={15} /> Volver al inicio de sesión
            </Link>

            <div className="mb-8">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-4">
                <KeyRound size={22} className="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Nueva contraseña</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Elige una contraseña segura para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Repite la contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              {/* Indicador de fortaleza */}
              {password && (
                <ul className="text-xs space-y-1 text-gray-500 dark:text-gray-400">
                  <li className={password.length >= 8 ? 'text-success-600 dark:text-success-400' : ''}>
                    {password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-success-600 dark:text-success-400' : ''}>
                    {/[A-Z]/.test(password) ? '✓' : '○'} Al menos una mayúscula
                  </li>
                  <li className={/\d/.test(password) ? 'text-success-600 dark:text-success-400' : ''}>
                    {/\d/.test(password) ? '✓' : '○'} Al menos un número
                  </li>
                </ul>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-medical-500 hover:from-primary-700 hover:to-medical-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound size={17} /> Guardar nueva contraseña
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
