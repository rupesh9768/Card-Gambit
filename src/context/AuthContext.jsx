import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearStoredToken, getCurrentUser, getStoredToken, loginUser, registerUser, setStoredToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    let active = true;
    setLoading(true);

    getCurrentUser()
      .then((data) => {
        if (active) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (active) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials) {
    const data = await loginUser(credentials);
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(credentials) {
    const data = await registerUser(credentials);
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function refreshUser() {
    const data = await getCurrentUser();
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      refreshUser,
      logout,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
