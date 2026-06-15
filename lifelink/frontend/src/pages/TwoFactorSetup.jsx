import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI } from '../services/api';
import { Shield, QrCode, CheckCircle, XCircle, Loader, Eye, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TwoFactorSetup({ onClose }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const handleClose = () => { if (onClose) onClose(); else navigate('/profile'); };

  const [step, setStep] = useState('intro'); // intro | qr | disabling
  const [qrData, setQrData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateTOTP = async () => {
    setLoading(true);
    try {
      const res = await authAPI.generate2FA();
      setQrData(res.data);
      setStep('qr');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al generar QR');
    } finally { setLoading(false); }
  };

  const enableTOTP = async () => {
    if (totpCode.length !== 6) return toast.error('Ingresa el código de 6 dígitos');
    setLoading(true);
    try {
      await authAPI.enable2FA(totpCode);
      const res = await usersAPI.getMe();
      updateUser(res.data);
      toast.success('Autenticador activado');
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
    } finally { setLoading(false); }
  };

  const disableTOTP = async () => {
    if (disableCode.length !== 6) return toast.error('Ingresa tu código actual');
    setLoading(true);
    try {
      await authAPI.disable2FA(disableCode);
      const res = await usersAPI.getMe();
      updateUser(res.data);
      toast.success('Autenticador desactivado');
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
    } finally { setLoading(false); }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(qrData?.secret || '');
    toast.success('Copiado al portapapeles');
  };

  // Activo — desactivar
  if (user?.totp_enabled) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800 dark:text-green-300 text-sm">Autenticador activo</p>
            <p className="text-green-700 dark:text-green-400 text-xs mt-0.5">Tu cuenta está protegida con Google Authenticator o Authy.</p>
          </div>
        </div>
        {step !== 'disabling' ? (
          <button onClick={() => setStep('disabling')}
            className="text-sm text-red-500 hover:text-red-700 hover:underline font-medium">
            Desactivar autenticador
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Código actual de tu app para confirmar</label>
              <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" autoFocus
                value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-red-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setStep('intro'); setDisableCode(''); }}
                className="flex-1 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                Cancelar
              </button>
              <button onClick={disableTOTP} disabled={loading || disableCode.length < 6}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                {loading ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
                Desactivar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Intro
  if (step === 'intro') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl">
          <Shield size={20} className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-800 dark:text-primary-300 leading-relaxed">
            <strong>App autenticadora:</strong> Genera códigos que cambian cada 30 segundos. Funciona sin internet y sin depender de correos ni SMS.
          </div>
        </div>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
            Instala <strong>Google Authenticator</strong> o <strong>Authy</strong>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
            Escanea el código QR que generaremos
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
            Confirma con el código de 6 dígitos
          </li>
        </ol>
        <button onClick={generateTOTP} disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60">
          {loading ? <Loader size={16} className="animate-spin" /> : <QrCode size={16} />}
          Generar código QR
        </button>
      </div>
    );
  }

  // QR
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Escanea este QR con tu app autenticadora:</p>
      {qrData?.qr_code && (
        <div className="flex justify-center">
          <img src={qrData.qr_code} alt="QR 2FA" className="w-48 h-48 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" />
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">¿No puedes escanear? Ingresa este código manualmente:</p>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5">
          <code className={`flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 tracking-widest ${!showSecret ? 'blur-sm select-none' : ''}`}>
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
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirma con el código de tu app:</label>
        <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" autoFocus
          value={totpCode}
          onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setStep('intro'); setTotpCode(''); setQrData(null); }}
          className="flex-1 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
          Cancelar
        </button>
        <button onClick={enableTOTP} disabled={loading || totpCode.length < 6}
          className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
          {loading ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
          Activar
        </button>
      </div>
    </div>
  );
}
