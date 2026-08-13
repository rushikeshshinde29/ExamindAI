import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const r = await api.get('/auth/me');
          if (r.data.success) {
            setUser(r.data.user);
            localStorage.setItem('user', JSON.stringify(r.data.user));
          }
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, []);

  const login = async (email, password) => {
    try {
      const r = await api.post('/auth/login', { email, password });
      if (r.data.success) {
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        setUser(r.data.user);
        toast.success(r.data.message || 'Logged in successfully!');
        return r.data.user;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw err;
    }
  };


  const register = async (userData) => {
    try {
      const r = await api.post('/auth/register', { ...userData });

      if (r.data.success) {
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        setUser(r.data.user);
        toast.success(r.data.message || 'Registration successful!');
        return r.data.user;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const r = await api.put('/auth/profile', profileData);
      if (r.data.success) {
        setUser(r.data.user);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        toast.success(r.data.message || 'Profile updated');
        return r.data.user;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      throw err;
    }
  };

  const updateUser = (data) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...data } : data;
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
