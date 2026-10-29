import { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import { logPortalActivity } from '../utils/activityTracker';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && savedToken !== 'rankrise_test_token_2026' && savedToken !== 'rankrise_test_token_2027') {
      return savedToken;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('rankrise_user');
    return null;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rankrise_user');
    const savedToken = localStorage.getItem('token');
    if (saved && savedToken) {
      try { 
        const parsed = JSON.parse(saved); 
        if (parsed && (parsed.id || parsed.email)) {
          return parsed;
        }
      } catch { 
        // ignore parse errors
      }
    }
    // Clean legacy / invalid user from storage if present
    localStorage.removeItem('rankrise_user');
    localStorage.removeItem('userRole');
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('rankrise_user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role || 'student');
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('rankrise_user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('token');
    }
  }, [user, token]);

  const fetchProfile = async (currentToken) => {
    if (!currentToken) return;
    try {
      const res = await fetch(getApiUrl('/api/user/profile'), {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('rankrise_user', JSON.stringify(data));
      }
    } catch {
      // In offline / network error mode, preserve local state
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    if (userData?.role) localStorage.setItem('userRole', userData.role);
    if (userData) localStorage.setItem('rankrise_user', JSON.stringify(userData));
    logPortalActivity({ type: 'login', action_name: 'Logged in to DDCET Portal' });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('rankrise_user');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
