import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#f3f8fc] dark:bg-gray-950 transition-colors duration-200 flex flex-col">
      <Navbar />
      <main className={`pt-[60px] ${user ? 'pb-[72px] md:pb-8' : 'pb-8'} px-4 sm:px-6 max-w-7xl mx-auto flex-1 w-full`}>
        {children}
      </main>
      <footer className={`${user ? 'hidden md:block' : ''} border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 LifeLink · Plataforma de insumos médicos</p>
          <div className="flex items-center gap-4">
            <Link to="/terminos" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Términos</Link>
            <Link to="/privacidad" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Privacidad</Link>
            <Link to="/puntos-encuentro" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Puntos de encuentro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
