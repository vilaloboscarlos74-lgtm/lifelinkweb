import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, usersAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      usersAPI.getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    if (res.data.requires_2fa) {
      return {
        requires_2fa: true,
        temp_token: res.data.temp_token,
        method: res.data.method,
        masked_email: res.data.masked_email,
      };
    }
    return _saveSession(res.data.access_token, res.data.user);
  };

  const complete2FA = async (temp_token, otp) => {
    const res = await authAPI.verify2FA(temp_token, otp);
    return _saveSession(res.data.access_token, res.data.user);
  };

  const completeTOTP = async (temp_token, code) => {
    const res = await authAPI.verifyTOTP(temp_token, code);
    return _saveSession(res.data.access_token, res.data.user);
  };

  const _saveSession = async (access_token, userData) => {
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // _noRedirect evita que un 401 aquí limpie la sesión que acabamos de guardar
    usersAPI.getMe({ _noRedirect: true }).then((res) => {
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    }).catch(() => { /* non-fatal — se usa userData del login response */ });
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, complete2FA, completeTOTP, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
