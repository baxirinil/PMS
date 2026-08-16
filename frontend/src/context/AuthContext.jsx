import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activePortfolio, setActivePortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('pms_user');
    const token = localStorage.getItem('pms_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('pms_token', token);
    localStorage.setItem('pms_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    setUser(null);
    setActivePortfolio(null);
  };

  return (
    <AuthContext.Provider value={{ user, activePortfolio, setActivePortfolio, handleLogin, handleLogout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
