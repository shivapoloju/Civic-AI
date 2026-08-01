import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civicai_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Configure global axios authorization
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('civicai_token', token);
      fetchCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('civicai_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
      setError(null);
    } catch (err) {
      console.error('Session restore failed:', err.response?.data?.error || err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/signup`, userData);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const requestOTP = async (phone) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/otp-request`, { phone });
      return res.data.message;
    } catch (err) {
      const msg = err.response?.data?.error || 'OTP request failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyOTP = async (phone, otp) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/otp-verify`, { phone, otp });
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid OTP code.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const googleOAuthLogin = async (googleData) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/google-login`, googleData);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Google login failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('civicai_token');
  };

  const clearError = () => setError(null);

  // Route resolver helper
  const getDashboardRedirect = (role) => {
    switch (role || user?.role) {
      case 'admin': return '/admin';
      case 'supervisor': return '/supervisor';
      case 'officer': return '/officer';
      case 'worker': return '/worker';
      default: return '/citizen';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      signup,
      requestOTP,
      verifyOTP,
      googleOAuthLogin,
      logout,
      clearError,
      getDashboardRedirect
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
