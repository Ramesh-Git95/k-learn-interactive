import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiClient, User } from '../services/apiClient';

// Auth context
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  logout: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<{ success: boolean; error?: string; data?: any }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  clearError: () => void;
  hasPremiumAccess: () => boolean;
  refreshUser: () => Promise<void>;
  updateSubscription: (subscriptionData: any) => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
function authReducer(state: AuthState, action: any): AuthState {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    default:
      return state;
  }
}

// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Validate token and get user data
  const validateToken = async (token: string) => {
    try {
      apiClient.setToken(token);
      const result = await apiClient.getProfile();
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: result.data.user,
            token
          }
        });
      } else {
        localStorage.removeItem('token');
        apiClient.setToken(null);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      localStorage.removeItem('token');
      apiClient.setToken(null);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await apiClient.login(email, password);
      
      if (result.success) {
        const { token, user } = result.data;
        
        // Set token in API client and localStorage
        apiClient.setToken(token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        });
        
        return { success: true, data: result.data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.error || 'Login failed'
        });
        
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      const errorMessage = 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const result = await apiClient.register(name, email, password);
      
      if (result.success) {
        const { token, user } = result.data;
        
        // Set token in API client and localStorage
        apiClient.setToken(token);
        
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user, token }
        });
        
        return { success: true, data: result.data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: result.error || 'Registration failed'
        });
        
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      const errorMessage = 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
    
    apiClient.setToken(null);
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update user profile
  const updateProfile = async (profileData: any) => {
    try {
      const result = await apiClient.updateProfile(profileData);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: result.data.user
        });
        
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Profile update failed' };
      }
      
    } catch (error) {
      const errorMessage = 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const result = await apiClient.changePassword(currentPassword, newPassword);
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error || 'Password change failed' };
      }
      
    } catch (error) {
      const errorMessage = 'Password change failed';
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
        const result = await apiClient.getProfile();
        
        if (result.success) {
          dispatch({
            type: AUTH_ACTIONS.UPDATE_USER,
            payload: result.data.user
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Check if user has premium access
  const hasPremiumAccess = () => {
    if (!state.user) return false;
    return state.user.subscription?.type !== 'free' && 
           state.user.subscription?.status === 'active';
  };

  // Update subscription data
  const updateSubscription = (subscriptionData: any) => {
    if (state.user) {
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: {
          ...state.user,
          subscription: {
            ...state.user.subscription,
            ...subscriptionData
          }
        }
      });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    hasPremiumAccess,
    refreshUser,
    updateSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

