import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type User = {
  id: number;
  email: string;
  username: string;
  role: string;
  profile_image?: string;
};

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, role: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          const user = await api.get('/auth/me');
          // If user is null (401 handled silently), try to refresh
          if (!user) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              try {
                const response = await api.post('/auth/refresh', { refresh_token: refreshToken }, false);
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('refresh_token', response.refresh_token);
                const refreshedUser = await api.get('/auth/me');
                if (refreshedUser) {
                  setCurrentUser(refreshedUser);
                } else {
                  // Refresh succeeded but /auth/me still returns null, clear tokens
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  setCurrentUser(null);
                }
              } catch (refreshError: any) {
                // Refresh failed, clear tokens silently
                // Don't show errors during initial load - user might not be logged in
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setCurrentUser(null);
              }
            } else {
              // No refresh token, clear access token silently
              localStorage.removeItem('access_token');
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(user);
          }
        } catch (error: any) {
          // Only log unexpected errors, don't show alerts
          console.error('Error loading user:', error);
          // Clear tokens on any error
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setCurrentUser(null);
        }
      } else {
        // No access token, user is not logged in
        setCurrentUser(null);
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Clear any existing tokens first
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      const response = await api.post('/auth/login', { email, password }, false);
      
      if (!response || !response.access_token || !response.refresh_token) {
        throw new Error('Invalid response from server. Missing authentication tokens.');
      }
      
      const { access_token, refresh_token } = response;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Get user info from backend
      const user = await api.get('/auth/me');
      
      if (!user || !user.role) {
        throw new Error('Failed to retrieve user information.');
      }
      
      setCurrentUser(user);
      
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'raw_material_checker') {
        navigate('/raw-material/dashboard');
      } else if (user.role === 'quality_checker') {
        navigate('/quality-check/dashboard');
      } else if (user.role === 'crm_manager') {
        navigate('/crm/dashboard');
      } else if (['accounts_manager', 'accounts_executive', 'finance_head'].includes(user.role)) {
        navigate('/accounts/dashboard');
      } else if (user.role === 'billing_executive') {
        navigate('/billing/dashboard');
      } else if (['logistics_manager', 'logistics_executive', 'driver'].includes(user.role)) {
        navigate('/logistics/dashboard');
      } else if (['dispatch_executive', 'dispatch_supervisor'].includes(user.role)) {
        navigate('/dispatch/dashboard');
      } else if (['marketing_executive', 'sales_executive', 'sales_manager'].includes(user.role)) {
        navigate('/sales/dashboard');
      } else if (user.role === 'site_supervisor') {
        navigate('/site-supervisor/dashboard');
      } else if (user.role === 'carpenter_captain') {
        navigate('/carpenter/dashboard');
      } else if (['purchase_executive', 'purchase_manager', 'store_incharge'].includes(user.role)) {
        navigate('/purchase/dashboard');
      } else if (user.role === 'measurement_captain') {
        navigate('/measurement-captain/dashboard');
      } else if (user.role === 'production_manager') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Clear tokens on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCurrentUser(null);
      
      // Provide better error messages
      if (error.message) {
        throw error;
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Login failed. Please check your credentials and try again.');
      }
    }
  };

  const register = async (email: string, username: string, role: string, password: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        username,
        role,
        password
      }, false);
      
      // After successful registration, log the user in
      await login(email, password);
    } catch (error: any) {
      // Re-throw with better error message
      if (error instanceof Error) {
        throw error;
      }
      
      // Extract error message from various possible formats
      let errorMessage = 'Registration failed. Please try again.';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => {
            const field = d.loc ? d.loc.join('.') : 'field';
            return `${field}: ${d.msg || JSON.stringify(d)}`;
          }).join(', ');
        } else {
          errorMessage = String(detail);
        }
      } else if (error?.detail) {
        errorMessage = error.detail;
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
    navigate('/login');
  };

  const updateUser = (user: User) => {
    setCurrentUser(user);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export useAuth hook (function declaration for Fast Refresh compatibility)
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
