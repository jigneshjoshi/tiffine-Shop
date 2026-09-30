import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('apkatiffine_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('apkatiffine_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apkatiffine_user');
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('apkatiffine_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
