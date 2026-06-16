import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, Shield, Heart, Users, ArrowLeft, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, completeTOTP } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado TOTP
  const [step, setStep] = useState('credentials'); // 'credentials' | 'totp'
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('Completa todos los campos');
    setLoading(true);
    try {
      const result = await login(form.username, form.password);
      if (result?.requires_2fa) {
        setTempToken(result.temp_token);
        setOtp(['', '', '', '', '', '']);
        toast.success('Introduce el código de tu app autenticadora');
        setStep('totp');
        return;
      }
      toast.success(`¡Bienvenido de nuevo, ${result.full_name?.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Ingresa el código de 6 dígitos');
    setLoading(true);
    try {
      const result = await completeTOTP(tempToken, code);
      toast.success(`¡Bienvenido de nuevo, ${result.full_name?.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center px-4 py-10 -mx-4 sm:-mx-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white dark:bg-gray-900 rounded-4xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">

        {/* Left panel */}
        <div className="hidden lg:flex relative bg-hero-gradient text-white p-10 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-medical-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-300/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-8">
              <span className="text-2xl font-black">L</span>
            </div>

            <h1 className="text-4xl font-black leading-tight mb-4">
              Bienvenido a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-300 to-cyan-300">
                LifeLink
              </span>
            </h1>

            <p className="text-primary-100 text-base leading-relaxed mb-10">
              La plataforma solidaria que conecta a personas con insumos médicos esenciales en México.
            </p>

            <div className="space-y-5">
              {[
                { icon: Heart,  text: 'Más de 150 donaciones activas' },
                { icon: Users,  text: '500+ usuarios en la comunidad' },
                { icon: Shield, text: 'Plataforma 100% segura y verificada' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <span className="text-primary-100 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-primary-300 text-xs">
            © 2026 LifeLink — Conectando vidas
          </div>
        </div>

        {/* Right panel - form */}
        <div className="p-7 sm:p-10 lg:p-12 flex items-center">
          <div className="w-full max-w-sm mx-auto">

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-medical-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-white text-2xl font-black">L</span>
              </div>
            </div>

            {step === 'credentials' ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1.5">Iniciar Sesión</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Accede a tu cuenta de LifeLink</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Usuario o correo
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="tu_usuario o correo@ejemplo.com"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="input-field pr-11"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end -mt-1">
                    <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline font-medium">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><LogIn size={18} /> Iniciar Sesión</>
                    )}
                  </button>

                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-1">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-primary-600 font-bold hover:underline">
                      Regístrate gratis
                    </Link>
                  </p>
                </form>
              </>
            ) : (
              <>
                <div className="mb-7">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                    <Smartphone size={26} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2 text-center">
                    Verificación en dos pasos
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center leading-relaxed">
                    Introduce el código de 6 dígitos de tu app autenticadora
                    <span className="block text-xs mt-1 text-gray-400">(Google Authenticator, Authy u otra)</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-14 text-center text-xl font-black border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Shield size={18} /> Verificar código</>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                    Los códigos se renuevan cada 30 segundos
                  </p>

                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); }}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <ArrowLeft size={14} /> Volver al inicio de sesión
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
