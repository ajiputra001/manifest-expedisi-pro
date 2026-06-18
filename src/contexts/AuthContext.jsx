import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('manifestUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      throw new Error('Username atau password salah');
    }

    setCurrentUser(data);
    localStorage.setItem('manifestUser', JSON.stringify(data));
    return data;
  };

  const register = async (userData) => {
    const { error } = await supabase.from('users').insert([userData]);
    if (error) {
      if (error.code === '23505') { // Postgres code for unique_violation
          throw new Error('DUPLICATE_USERNAME');
      }
      throw new Error(error.message);
    }
    return true;
  };

  const logout = () => {
    localStorage.removeItem('manifestUser');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
