import { useState } from 'react';
import { Lock } from 'lucide-react';

const LOCK_ENABLED = import.meta.env.VITE_SITE_LOCKED === 'true';
const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || '';
const STORAGE_KEY = 'site_unlocked';

export default function SiteLock({ children }) {
  const [unlocked, setUnlocked] = useState(
    !LOCK_ENABLED || sessionStorage.getItem(STORAGE_KEY) === 'true'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === SITE_PASSWORD && SITE_PASSWORD !== '') {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
          <Lock size={24} className="text-primary-600" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-1.5">Sitio en mantenimiento</h1>
        <p className="text-gray-500 text-sm mb-6">LifeLink está temporalmente cerrado al público.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            className="input-field text-center"
            placeholder="Contraseña de acceso"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoFocus
          />
          {error && <p className="text-accent-500 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-3 rounded-2xl shadow-lg"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
