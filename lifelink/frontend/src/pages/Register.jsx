import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Eye,
  EyeOff,
  Shield,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';

import toast from 'react-hot-toast';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'solicitante',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.email ||
      !form.username ||
      !form.password ||
      !form.full_name
    ) {
      return toast.error('Completa todos los campos obligatorios');
    }

    if (form.password.length < 8) {
      return toast.error('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(form.password)) {
      return toast.error('La contraseña debe tener al menos una mayúscula');
    }
    if (!/\d/.test(form.password)) {
      return toast.error('La contraseña debe tener al menos un número');
    }

    setLoading(true);

    try {
      await register(form);
      // Auto-login con las mismas credenciales
      await login(form.username, form.password);
      toast.success('¡Bienvenido a LifeLink!');
      navigate('/');
    } catch (err) {
      // Si el auto-login falla (ej. verificación de email requerida), ir al login
      toast.success('Cuenta creada. Inicia sesión para continuar.');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900 text-white p-10 flex-col justify-between overflow-hidden">

          {/* blur effects */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-medical-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl" />

          <div className="relative z-10">

            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/10">
              <span className="text-3xl font-black">L</span>
            </div>

            <h1 className="text-4xl font-black leading-tight mb-5">
              Únete a la comunidad de{' '}
              <span className="text-medical-300">
                LifeLink
              </span>
            </h1>

            <p className="text-primary-100 text-lg leading-relaxed">
              Comparte, dona o encuentra insumos médicos
              esenciales para ayudar a quienes más lo necesitan.
            </p>

            <div className="space-y-5 mt-10">

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                  <HeartHandshake size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Comunidad solidaria
                  </h3>

                  <p className="text-primary-200 text-sm mt-1">
                    Conecta con personas dispuestas a ayudar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Shield size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Plataforma segura
                  </h3>

                  <p className="text-primary-200 text-sm mt-1">
                    Tus datos y publicaciones protegidos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Fácil y rápido
                  </h3>

                  <p className="text-primary-200 text-sm mt-1">
                    Publica o encuentra insumos en minutos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-sm text-primary-200">
            © 2026 LifeLink — Conectando vidas.
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-6 sm:p-10 lg:p-12 flex items-center">

          <div className="w-full max-w-md mx-auto">

            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-medical-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-3xl font-black">
                  L
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100">
                Crear cuenta
              </h2>

              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Regístrate para comenzar a ayudar o encontrar apoyo médico.
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre completo *
                </label>

                <input
                  type="text"
                  className="input-field"
                  placeholder="María García"
                  value={form.full_name}
                  onChange={set('full_name')}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Correo electrónico *
                </label>

                <input
                  type="email"
                  className="input-field"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de usuario *
                </label>

                <input
                  type="text"
                  className="input-field"
                  placeholder="usuario123"
                  value={form.username}
                  onChange={set('username')}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña *
                </label>

                <div className="relative">

                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={set('password')}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>

                <input
                  type="tel"
                  className="input-field"
                  placeholder="55 1234 5678"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué deseas hacer?
                </label>

                <select
                  className="input-field"
                  value={form.role}
                  onChange={set('role')}
                >
                  <option value="solicitante">
                    Buscar insumos médicos
                  </option>

                  <option value="donante">
                    Donar o vender insumos
                  </option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-medical-500 hover:from-primary-700 hover:to-medical-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    Crear Cuenta
                  </>
                )}
              </button>

              {/* Login link */}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                ¿Ya tienes cuenta?{' '}

                <Link
                  to="/login"
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Inicia sesión
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}