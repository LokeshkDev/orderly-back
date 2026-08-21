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
