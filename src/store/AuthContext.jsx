import { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

const AuthContext = createContext();

// Default admin user for the admin-panel branch so teammates can immediately manage content
const DEFAULT_ADMIN_USER = {
  id: 1,
  name: 'Admin Manager',
  email: 'admin@rankrise.edu',
  role: 'admin',
  profile_completed: true,
  branch: 'Computer'
};

const DEFAULT_ADMIN_TOKEN = 'rankrise_admin_dev_token_2026';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rankrise_user');
    if (saved) {
      try { 
        return JSON.parse(saved); 
      } catch { 
        // fallback
      }
    }
    return DEFAULT_ADMIN_USER;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || DEFAULT_ADMIN_TOKEN;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('rankrise_user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role || 'admin');
    }
    if (token) {
      localStorage.setItem('token', token);
    }
  }, [user, token]);

  const fetchProfile = async (currentToken) => {
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
      // In dev / admin mode, keep admin user
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    const activeUser = userData || DEFAULT_ADMIN_USER;
    setToken(newToken);
    setUser(activeUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', activeUser.role);
    localStorage.setItem('rankrise_user', JSON.stringify(activeUser));
  };

  const logout = () => {
    setUser(DEFAULT_ADMIN_USER);
    setToken(DEFAULT_ADMIN_TOKEN);
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('rankrise_user', JSON.stringify(DEFAULT_ADMIN_USER));
  };

  const toggleRole = () => {
    const nextRole = user?.role === 'admin' ? 'student' : 'admin';
    const updated = {
      ...user,
      role: nextRole,
      name: nextRole === 'admin' ? 'Admin Manager' : 'Student Preview'
    };
    setUser(updated);
    localStorage.setItem('userRole', nextRole);
    localStorage.setItem('rankrise_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchProfile, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
