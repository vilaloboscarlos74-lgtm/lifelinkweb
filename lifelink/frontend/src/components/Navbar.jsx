import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationsAPI, requestsAPI, getMediaUrl } from '../services/api';
import {
  Menu, X, Heart, Bell, MessageCircle, Search, Plus, User,
  LogOut, LayoutDashboard, Package, ChevronDown, Home, Sun, Moon, Droplets,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () =>
      notificationsAPI.getUnreadCount().then((r) => setUnread(r.data.count)).catch(() => {});
    const fetchPending = () =>
      requestsAPI.getReceived()
        .then((r) => setPendingCount((r.data || []).filter((req) => req.status === 'pendiente').length))
        .catch(() => {});
    fetchNotifs();
    fetchPending();
    const id = setInterval(() => { fetchNotifs(); fetchPending(); }, 30000);
    return () => clearInterval(id);
  }, [user]);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/',        label: 'Inicio',   icon: Home },
    { to: '/supplies',label: 'Insumos',  icon: Search },
    { to: '/donors',  label: 'Sangre',   icon: Droplets },
  ];

  return (
    <>
      {/* Main nav bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white dark:bg-gray-900 shadow-md border-b border-gray-100 dark:border-gray-800'
          : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-medical-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                <span className="text-white font-black text-sm tracking-tight">L</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-lg text-gray-900 dark:text-white leading-none">
                  Life<span className="text-primary-600">Link</span>
                </span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive(to)
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}

              {user && (
                <Link
                  to="/messages"
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive('/messages')
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <MessageCircle size={16} />
                  Mensajes
                  {pendingCount > 0 && (
                    <span className="w-5 h-5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {user ? (
                <>
                  {/* Publish button */}
                  <Link
                    to="/publish"
                    className="hidden sm:flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm"
                  >
                    <Plus size={15} />
                    Publicar
                  </Link>

                  {/* Theme toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
                    title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  >
                    {dark ? <Sun size={19} /> : <Moon size={19} />}
                  </button>

                  {/* Favorites */}
                  <Link
                    to="/favorites"
                    className={`p-2 rounded-xl transition-all duration-200 hidden sm:flex ${
                      isActive('/favorites') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <Heart size={19} />
                  </Link>

                  {/* Notifications */}
                  <Link
                    to="/notifications"
                    className={`p-2 rounded-xl transition-all duration-200 relative ${
                      isActive('/notifications') ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <Bell size={19} />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm animate-scale-in">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>

                  {/* Profile dropdown */}
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {user.avatar_url ? (
                          <img src={getMediaUrl(user.avatar_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-primary-700">
                            {user.full_name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 max-w-[90px] truncate">
                        {user.full_name?.split(' ')[0]}
                      </span>
                      <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                      <>
                        <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-scale-in z-50">
                          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.full_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
                          </div>

                          {[
                            { to: '/profile',      icon: User,          label: 'Mi Perfil' },
                            { to: '/my-supplies',  icon: Package,       label: 'Mis Publicaciones' },
                            { to: '/requests',     icon: MessageCircle, label: 'Solicitudes' },
                            { to: '/favorites',    icon: Heart,         label: 'Favoritos' },
                            { to: '/mis-alertas',  icon: Bell,          label: 'Mis Alertas' },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            >
                              <Icon size={15} className="text-gray-400 dark:text-gray-500" /> {label}
                            </Link>
                          ))}

                          {user.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            >
                              <LayoutDashboard size={15} /> Panel Admin
                            </Link>
                          )}

                          <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                          <button
                            onClick={() => { logout(); navigate('/login'); setProfileOpen(false); }}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 w-full transition-colors"
                          >
                            <LogOut size={15} /> Cerrar Sesión
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile menu toggle */}
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    {menuOpen ? <X size={21} /> : <Menu size={21} />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-secondary text-xs sm:text-sm">Iniciar Sesión</Link>
                  <Link to="/register" className="btn-primary text-xs sm:text-sm">Registrarse</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && user && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-[60px] left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl animate-slide-down">
            <div className="p-3 space-y-0.5">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-medical-100 flex items-center justify-center overflow-hidden">
                  {user.avatar_url
                    ? <img src={getMediaUrl(user.avatar_url)} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-primary-700">{user.full_name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{user.full_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">@{user.username}</p>
                </div>
              </div>

              {[
                { to: '/',           icon: Home,          label: 'Inicio' },
                { to: '/supplies',   icon: Search,        label: 'Insumos' },
                { to: '/publish',    icon: Plus,          label: 'Publicar', highlight: true },
                { to: '/messages',   icon: MessageCircle, label: 'Mensajes' },
                { to: '/profile',    icon: User,          label: 'Mi Perfil' },
                { to: '/my-supplies',icon: Package,       label: 'Mis Publicaciones' },
                { to: '/requests',   icon: MessageCircle, label: 'Solicitudes' },
                { to: '/favorites',  icon: Heart,         label: 'Favoritos' },
                { to: '/notifications', icon: Bell,       label: 'Notificaciones', badge: unread },
              ].map(({ to, icon: Icon, label, highlight, badge }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    highlight
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : isActive(to)
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={17} className={highlight ? 'text-primary-600' : 'text-gray-400'} />
                  {label}
                  {badge > 0 && (
                    <span className="ml-auto w-5 h-5 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              ))}

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                >
                  <LayoutDashboard size={17} className="text-primary-500" /> Panel Admin
                </Link>
              )}

              <div className="pt-1 border-t border-gray-100 mt-1">
                <button
                  onClick={() => { logout(); navigate('/login'); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 w-full transition-all"
                >
                  <LogOut size={17} /> Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation — mobile only */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shadow-lg md:hidden safe-bottom">
          <div className="flex items-center justify-around h-[56px] px-1">
            {[
              { to: '/',             icon: Home,           label: 'Inicio' },
              { to: '/supplies',     icon: Search,         label: 'Insumos' },
              { to: '/publish',      icon: Plus,           label: 'Publicar', accent: true },
              { to: '/messages',     icon: MessageCircle,  label: 'Chat',    badge: pendingCount, badgeColor: 'bg-amber-500' },
              { to: '/notifications',icon: Bell,           label: 'Alertas', badge: unread },
            ].map(({ to, icon: Icon, label, accent, badge, badgeColor }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative ${
                  accent
                    ? 'bg-primary-600 text-white rounded-2xl -mt-3 px-4 shadow-lg shadow-primary-200'
                    : isActive(to)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon size={accent ? 22 : 19} />
                <span className="text-[9px] font-semibold leading-none">{label}</span>
                {badge > 0 && (
                  <span className={`absolute -top-0.5 right-1 w-4 h-4 ${badgeColor || 'bg-accent-500'} text-white text-[8px] font-black rounded-full flex items-center justify-center`}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
