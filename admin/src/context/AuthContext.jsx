import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext) || { admin: null, token: null, loading: false };

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/admin/me');
          if (res.data?.success) {
            setAdmin(res.data.data);
          } else {
            localStorage.removeItem('admin_token');
            setToken('');
            setAdmin(null);
          }
        } catch (error) {
          localStorage.removeItem('admin_token');
          setToken('');
          setAdmin(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.data?.success) {
        const newToken = res.data.token || res.data.data?.token;
        const adminData = res.data.data?.admin;
        if (!newToken || !adminData) {
          return { success: false, message: 'Invalid response from server' };
        }
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        setAdmin(adminData);
        return { success: true, data: adminData };
      }
      return res.data;
    } catch (err) {
      // Detect network / connection refused vs credential error
      const isNetworkError = !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.message?.includes('ERR_CONNECTION_REFUSED'));
      if (isNetworkError) {
        const base = import.meta.env.VITE_API_BASE_URL || '/api (proxied to http://localhost:5001)';
        console.error(`[Auth] Network error: cannot reach ${base}. Is the backend running? (cd server && npm run dev)`, err);
        return { success: false, message: `Cannot connect to API at ${base} (ERR_CONNECTION_REFUSED). Ensure the backend server is running on port 5001.` };
      }
      return { success: false, message: err.response?.data?.message || 'Login failed. Please check your credentials.' };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const res = await api.post('/admin/google', { email: credential });
      if (res.data?.success) {
        const newToken = res.data.token || res.data.data?.token;
        const adminData = res.data.data?.admin;
        if (!newToken || !adminData) {
          return { success: false, message: 'Invalid response from server' };
        }
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        setAdmin(adminData);
        return { success: true, data: adminData };
      }
      return res.data;
    } catch (err) {
      const isNetworkError = !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.message?.includes('ERR_CONNECTION_REFUSED'));
      if (isNetworkError) {
        const base = import.meta.env.VITE_API_BASE_URL || '/api';
        return { success: false, message: `Cannot connect to API at ${base} (ERR_CONNECTION_REFUSED). Ensure backend is running.` };
      }
      return { success: false, message: err.response?.data?.message || 'Google login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
