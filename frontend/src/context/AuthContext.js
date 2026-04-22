// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext();

// AuthProvider component to wrap around the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user details (optional)
  useEffect(() => {
    const attemptAuth = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          // Token exists, verify it
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        }
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.warn('Initial auth check error:', error.response || error);
        }
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    attemptAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response || error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using AuthContext
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
