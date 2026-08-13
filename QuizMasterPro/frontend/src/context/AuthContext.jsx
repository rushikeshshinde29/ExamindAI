import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qmp_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qmp_token');
    if (token) {
      authApi.me()
        .then(r => setUser(r.data.user))
        .catch(() => { localStorage.removeItem('qmp_token'); localStorage.removeItem('qmp_user'); })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      if (data.success) {
        localStorage.setItem('qmp_token', data.token);
        localStorage.setItem('qmp_user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        return { success: true, role: data.user.role };
      }
      toast.error(data.message);
      return { success: false };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return { success: false };
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(formData);
      if (data.success) {
        localStorage.setItem('qmp_token', data.token);
        localStorage.setItem('qmp_user', JSON.stringify(data.user));
        setUser(data.user);
        toast.success('Account created! Welcome 🎉');
        return { success: true, role: data.user.role };
      }
      toast.error(data.message);
      return { success: false };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return { success: false };
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('qmp_token');
    localStorage.removeItem('qmp_user');
    setUser(null);
    toast.success('Logged out');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('qmp_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading, authLoading, isStudent: user?.role === 'student', isFaculty: user?.role === 'faculty', isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
