import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('agri-theme') || 'dark');
  const [lang, setLang]   = useState(() => localStorage.getItem('agri-lang')  || 'en');
  const [user, setUser]   = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('agri-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('agri-lang', lang);
  }, [lang]);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('agri-token');
    if (!token) { setAuthLoading(false); return; }
    authAPI.profile()
      .then(res => setUser(res.data.data))
      .catch(() => { localStorage.removeItem('agri-token'); })
      .finally(() => setAuthLoading(false));
  }, []);

  const login = (token, userData, remember = true) => {
    if (remember) localStorage.setItem('agri-token', token);
    else sessionStorage.setItem('agri-token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('agri-token');
    sessionStorage.removeItem('agri-token');
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, lang, setLang, user, setUser, login, logout, authLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
