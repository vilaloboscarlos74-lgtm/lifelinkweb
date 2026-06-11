import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  Shield, QrCode, CheckCircle, XCircle, Loader,
  Eye, EyeOff, Copy, Mail, Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TwoFactorSetup({ onClose }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const handleClose = () => { if (onClose) onClose(); else navigate('/profile'); };

  // Selector de método
  const [methodTab, setMethodTab] = useState('totp'); // 'totp' | 'email'

  // TOTP state
  const [totpStep, setTotpStep] = useState('intro'); // intro | qr | verify | done
  const [qrData, setQrData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Email 2FA state
  const [emailStep, setEmailStep] = useState('intro'); // intro | sent | done
  const [emailCode, setEmailCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);

  // ── TOTP handlers ─────────────────────────────────────────────────────────
  const generateTOTP = async () => {
    setLoading(true);
    try {
      const res = await authAPI.generate2FA();
      setQrData(res.data);
      setTotpStep('qr');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al generar 2FA');
    } finally { setLoading(false); }
  };

  const enableTOTP = async () => {
    if (totpCode.length !== 6) return toast.error('Ingresa el código de 6 dígitos');
    setLoading(true);
    try {
      await authAPI.enable2FA(totpCode);
      updateUser({ ...user, totp_enabled: true });
      setTotpStep('done');
      toast.success('2FA por app activado');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
    } finally { setLoading(false); }
  };

  const disableTOTP = async () => {
    if (disableCode.length !== 6) return toast.error('Ingresa tu código actual');
    setLoading(true);
    try {
      await authAPI.disable2FA(disableCode);
      updateUser({ ...user, totp_enabled: false });
      toast.success('2FA desactivado');
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto');
    } finally { setLoading(false); }
  };

  // ── Email 2FA handlers ────────────────────────────────────────────────────
  const sendEmailSetup = async () => {
    setLoading(true);
    try {
      await authAPI.setupEmail2FA();
      setEmailStep('sent');
      toast.success(`Código enviado a ${user.email}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al enviar');
    } finally { setLoading(false); }
  };

  const enableEmail2FA = async () => {
    if (emailCode.length !== 6) return toast.error('Ingresa el código de 6 dígitos');
    setLoading(true);
    try {
      await authAPI.enableEmail2FA(emailCode);
      updateUser({ ...user, email_2fa_enabled: true });
      setEmailStep('done');
      toast.success('2FA por correo activado');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Código incorrecto o expirado');
    } finally { setLoading(false); }
  };

  const disableEmail2FA = async () => {
    if (!disablePassword) return toast.error('Ingresa tu contraseña');
    setLoading(true);
    try {
      await authAPI.disableEmail2FA(disablePassword);
      updateUser({ ...user, email_2fa_enabled: false });
      toast.success('2FA por correo desactivado');
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Contraseña incorrecta');
    } finally { setLoading(false); }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(qrData?.secret || '');
    toast.success('Copiado al portapapeles');
  };

  // ── Pantalla: TOTP activo (desactivar) ────────────────────────────────────
  if (user?.totp_enabled) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800 text-sm">2FA por app activo</p>
            <p className="text-green-700 text-xs mt-0.5">Tu cuenta está protegida con Google Authenticator / Authy.</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código actual de tu app para desactivar</label>
          <input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
            value={disableCode}
            onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <button onClick={disableTOTP} disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
          {loading ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
          Desactivar 2FA por app
        </button>
      </div>
    );
  }

  // ── Pantalla: Email 2FA activo (desactivar) ───────────────────────────────
  if (user?.email_2fa_enabled) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <Mail size={20} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-blue-800 text-sm">2FA por correo activo</p>
            <p className="text-blue-700 text-xs mt-0.5">Recibes un código en <strong>{user.email}</strong> cada vez que inicias sesión.</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña para desactivar</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={disablePassword}
              onChange={e => setDisablePassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button onClick={disableEmail2FA} disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
          {loading ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
          Desactivar 2FA por correo
        </button>
      </div>
    );
  }

  // ── Selector de método ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Tabs método */}
      <div className="flex gap-2">
        {[
          { key: 'totp',  icon: <Smartphone size={14} />, label: 'App autenticadora' },
          { key: 'email', icon: <Mail size={14} />,        label: 'Correo electrónico' },
        ].map(({ key, icon, label }) => (
          <button key={key} onClick={() => setMethodTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all border-2
              ${methodTab === key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── TOTP flow ── */}
      {methodTab === 'totp' && totpStep === 'intro' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-2xl">
            <Shield size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-800 leading-relaxed">
              <strong>App autenticadora:</strong> Instala Google Authenticator o Authy y escanea el código QR. Genera códigos que cambian cada 30 segundos y funcionan sin internet.
            </div>
          </div>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="bg-primary-100 text-primary-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span> Instala Google Authenticator o Authy</li>
            <li className="flex items-start gap-2"><span className="bg-primary-100 text-primary-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span> Escanea el código QR</li>
            <li className="flex items-start gap-2"><span className="bg-primary-100 text-primary-700 font-bold w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span> Confirma con el código de 6 dígitos</li>
          </ol>
          <button onClick={generateTOTP} disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60">
            {loading ? <Loader size={16} className="animate-spin" /> : <QrCode size={16} />}
            Generar código QR
          </button>
        </div>
      )}

      {methodTab === 'totp' && totpStep === 'qr' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Escanea este QR con tu app autenticadora:</p>
          {qrData?.qr_code && (
            <div className="flex justify-center">
              <img src={qrData.qr_code} alt="QR 2FA" className="w-48 h-48 rounded-xl border border-gray-200 shadow-sm" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">¿No puedes escanear? Ingresa este código manualmente:</p>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirma con el código de tu app:</label>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-400"
              autoFocus
            />
          </div>
          <button onClick={enableTOTP} disabled={loading || totpCode.length < 6}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
            {loading ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
            Verificar y activar
          </button>
        </div>
      )}

      {methodTab === 'totp' && totpStep === 'done' && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">¡2FA por app activado!</h3>
          <p className="text-gray-500 text-sm mb-6">Necesitarás tu app autenticadora cada vez que inicies sesión.</p>
          <button onClick={handleClose} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3 rounded-xl transition-all">
            Entendido
          </button>
        </div>
      )}

      {/* ── Email 2FA flow ── */}
      {methodTab === 'email' && emailStep === 'intro' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 leading-relaxed">
              <strong>2FA por correo:</strong> Cada vez que inicies sesión, recibirás un código de 6 dígitos en <strong>{user?.email}</strong>. No necesitas ninguna app extra.
            </div>
          </div>
          <button onClick={sendEmailSetup} disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-primary-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-60">
            {loading ? <Loader size={16} className="animate-spin" /> : <Mail size={16} />}
            Enviar código de verificación
          </button>
        </div>
      )}

      {methodTab === 'email' && emailStep === 'sent' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
            <Mail size={24} className="text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-blue-800">Código enviado a:</p>
            <p className="text-blue-700 font-bold">{user?.email}</p>
            <p className="text-xs text-blue-500 mt-1">Revisa también la carpeta de spam</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ingresa el código recibido:</label>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={emailCode}
              onChange={e => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>
          <button onClick={enableEmail2FA} disabled={loading || emailCode.length < 6}
            className="w-full bg-gradient-to-r from-blue-600 to-primary-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60">
            {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Verificar y activar
          </button>
          <button onClick={sendEmailSetup} disabled={loading}
            className="w-full text-sm text-gray-500 hover:text-primary-600 font-medium py-2 transition-colors">
            ¿No recibiste el código? Reenviar
          </button>
        </div>
      )}

      {methodTab === 'email' && emailStep === 'done' && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">¡2FA por correo activado!</h3>
          <p className="text-gray-500 text-sm mb-6">Recibirás un código en tu correo cada vez que inicies sesión.</p>
          <button onClick={handleClose} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3 rounded-xl transition-all">
            Entendido
          </button>
        </div>
      )}
    </div>
  );
}
