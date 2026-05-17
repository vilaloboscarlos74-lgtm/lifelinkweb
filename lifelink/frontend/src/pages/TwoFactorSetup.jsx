import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Shield, QrCode, CheckCircle, XCircle, Loader, Eye, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TwoFactorSetup({ onClose }) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState('intro');   // intro | qr | verify | done
  const [qrData, setQrData] = useState(null);
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await authAPI.generate2FA();
      setQrData(res.data);
      setStep('qr');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al generar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const enable = async () => {
    if (code.length !== 6) return toast.error('Ingresa el código de 6 dígitos');
    setLoading(true);
    try {
      await authAPI.enable2FA(code);
      updateUser({ ...user, totp_enabled: true });
      setStep('done');
      toast.success('2FA activado correctamente');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    if (disableCode.length !== 6) return toast.error('Ingresa tu código actual');
    setLoading(true);
    try {
      await authAPI.disable2FA(disableCode);
      updateUser({ ...user, totp_enabled: false });
      toast.success('2FA desactivado');
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(qrData?.secret || '');
    toast.success('Copiado al portapapeles');
  };

  // Si ya tiene 2FA, mostrar opción de desactivar
  if (user?.totp_enabled) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800 text-sm">2FA activo</p>
            <p className="text-green-700 text-xs mt-0.5">Tu cuenta está protegida con autenticación en dos pasos.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Código actual de tu app para desactivar
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={disableCode}
            onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <button
          onClick={disable}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
          Desactivar 2FA
        </button>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-2xl">
          <Shield size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-800 leading-relaxed">
            <strong>¿Qué es el 2FA?</strong> Agrega una capa extra de seguridad a tu cuenta.
            Además de tu contraseña, necesitarás un código temporal de 6 dígitos de tu
            aplicación autenticadora (Google Authenticator, Authy, etc.).
          </div>
        </div>

        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2"><span className="bg-primary-100 text-primary-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span> Instala Google Authenticator o Authy en tu teléfono</li>
          <li className="flex items-start gap-2"><span className="bg-primary-100 text-primary-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span> Escanea el código QR que te mostraremos</li>
          <li className="flex items-start gap-2"><span className="bg-primary-100 text-primary-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span> Confirma con el código de 6 dígitos</li>
        </ol>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60"
        >
          {loading
            ? <Loader size={16} className="animate-spin" />
            : <QrCode size={16} />}
          Activar 2FA
        </button>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="space-y-5">
        <p className="text-sm text-gray-600 leading-relaxed">
          Escanea este QR con tu app autenticadora:
        </p>

        {qrData?.qr_code && (
          <div className="flex justify-center">
            <img
              src={qrData.qr_code}
              alt="QR 2FA"
              className="w-48 h-48 rounded-xl border border-gray-200 shadow-sm"
            />
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">
            ¿No puedes escanear? Ingresa este código manualmente:
          </p>
          <div className="flex items-center gap-2">
            <code className={`flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-800 tracking-widest ${!showSecret ? 'blur-sm select-none' : ''}`}>
              {qrData?.secret}
            </code>
            <button onClick={() => setShowSecret(v => !v)} className="text-gray-400 hover:text-gray-600 p-1">
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button onClick={copySecret} className="text-gray-400 hover:text-primary-600 p-1">
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Confirma con el código de tu app:
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-400"
            autoFocus
          />
        </div>

        <button
          onClick={enable}
          disabled={loading || code.length < 6}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
          Verificar y activar
        </button>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">¡2FA Activado!</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Tu cuenta ahora tiene autenticación en dos pasos.
          Necesitarás tu código cada vez que inicies sesión.
        </p>
        <button
          onClick={onClose}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
        >
          Entendido
        </button>
      </div>
    );
  }

  return null;
}
