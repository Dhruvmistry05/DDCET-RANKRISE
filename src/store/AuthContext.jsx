import { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rankrise_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        // Filter out any legacy hardcoded demo name
        if (parsed && parsed.name !== 'Dhruv Mistry' && parsed.email !== 'dhruv@rankrise.edu') {
          return parsed;
        }
      } catch { 
        // ignore parse errors
      }
    }
    // Clean legacy test user from storage if present
    localStorage.removeItem('rankrise_user');
    return null;
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && savedToken !== 'rankrise_test_token_2026') {
      return savedToken;
    }
    localStorage.removeItem('token');
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('rankrise_user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role || 'student');
    } else {
      localStorage.removeItem('rankrise_user');
    }

    if (token) {
      localStorage.setItem('token', token);
    } else {
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
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('rankrise_user');
    localStorage.setItem('userRole', 'student');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
