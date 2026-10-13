import { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

const AuthContext = createContext();

// Default student user profile for testing and direct website exploration
const DEFAULT_TEST_USER = {
  id: 1,
  name: 'Dhruv Mistry',
  email: 'dhruv@rankrise.edu',
  role: 'student',
  profile_completed: true,
  branch: 'Computer',
  mobile: '9426727875',
  college: 'Government Polytechnic Gandhinagar',
  semester: '6'
};

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
    return DEFAULT_TEST_USER;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || 'rankrise_test_token_2026';
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('rankrise_user', JSON.stringify(user));
      localStorage.setItem('userRole', user.role || 'student');
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
      // In offline / testing mode, preserve test user profile
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    const activeUser = userData || DEFAULT_TEST_USER;
    setToken(newToken);
    setUser(activeUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', activeUser.role);
    localStorage.setItem('rankrise_user', JSON.stringify(activeUser));
  };

  const logout = () => {
    // Reset to default active student so dashboard remains instantly accessible
    setUser(DEFAULT_TEST_USER);
    setToken('rankrise_test_token_2026');
    localStorage.setItem('userRole', 'student');
    localStorage.setItem('rankrise_user', JSON.stringify(DEFAULT_TEST_USER));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
