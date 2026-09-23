import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { TOKEN_KEY, USER_KEY, getErrorMessage } from '../api/client';

/**
 * Auth state poori app me share karta hai.
 * Token localStorage me rehta hai taake refresh par logout na ho.
 */
const AuthContext = createContext(null);

// Sender details (templates ke [Your Name] / [Your Title] ke liye)
const SENDER_KEY = 'xportyn_sender__v3';

const defaultSender = { name: 'Name', title: 'desination' };

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });

  const [sender, setSenderState] = useState(() => {
    // try {
    //   return { ...defaultSender, ...JSON.parse(localStorage.getItem(SENDER_KEY) || '{}') };
    // } catch {
    //   return defaultSender;
    // }
  });

  // App load par token verify karo (expire to nahi ho gaya)
  const [checking, setChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // Interceptor already localStorage clear kar deta hai
        setToken(null);
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await authApi.login(username, password);
      const { token: newToken, user: newUser } = res.data;

      // localStorage.setItem(TOKEN_KEY, newToken);
      // localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return { success: false, message: getErrorMessage(error, 'Login failed') };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const setSender = (next) => {
    const merged = { ...sender, ...next };
    // localStorage.setItem(SENDER_KEY, JSON.stringify(merged));
    // setSenderState(merged);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      sender,
      setSender,
      isAuthenticated: Boolean(token),
      checking,
      login,
      logout,
    }),
    [token, user, sender, checking]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
};
