// src/context/AuthContext.tsx
import { createContext, useContext, useMemo, useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { createApiClient } from '../api/client';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  email: string;
  login: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { loginOrEmail: string; password: string; remember: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  loadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('accessToken') || !!sessionStorage.getItem('accessToken')
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const apiClient = useMemo(() => createApiClient(), []);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
      logout();
    }
  };

  const login = async ({ loginOrEmail, password, remember }: { 
    loginOrEmail: string; 
    password: string; 
    remember: boolean 
  }) => {
    try {
      setAuthError(null);
      const response = await apiClient.post('/auth/login', {
        loginOrEmail,
        password,
        rememberMe: remember,
      });

      const { accessToken } = response.data;

      // Сохраняем токен в соответствии с remember
      if (remember) {
        localStorage.setItem('accessToken', accessToken);
      } else {
        sessionStorage.setItem('accessToken', accessToken);
      }

      setIsAuthenticated(true);
      await loadUser();
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Ошибка авторизации';
      setAuthError(errorMessage);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated,
      user,
      login, 
      logout, 
      authError,
      setAuthError,
      loadUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);