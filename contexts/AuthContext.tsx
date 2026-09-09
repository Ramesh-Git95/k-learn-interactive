import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiClient, User } from '../services/apiClient';
import { clearLocalGamification } from '../utils/xpStreak';
import { clearLocalTopikEstimate } from '../utils/topikEstimate';
import { readCachedUser, writeCachedUser, clearCachedUser, isAuthRejection } from '../utils/session';

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

  // Restore the session on app load.
  //
  // When we have both a token and last visit's profile, the app renders
  // immediately from that copy and the server is checked in the background. The
  // token is what authorises the session; fetching the profile confirms its
  // details. Waiting for it meant every returning visitor sat behind the free
  // tier's 30–50s cold start looking at a skeleton, because their request was
  // the one waking the server up.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    const cached = readCachedUser();
    if (cached) {
      apiClient.setToken(token);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user: cached, token } });
      validateToken(token, { alreadyRendered: true });
    } else {
      validateToken(token, { alreadyRendered: false });
    }
  }, []);

  // Keep the cached profile in step with the one in memory, from one place.
  // login, register, updateProfile, refreshUser and updateSubscription all
  // change the user; writing the cache at each of them means the day someone
  // adds a sixth, next visit silently restores a stale profile.
  //
  // Only writes. Clearing is explicit — at logout, and when the server rejects
  // the token — because state.user is legitimately null in the moment before
  // the session is restored, and treating that as "signed out" would erase the
  // cache before it has been read.
  useEffect(() => {
    if (state.user) writeCachedUser(state.user);
  }, [state.user]);

  // Validate token and get user data.
  //
  // A failure here only ends the session when the server actually rejected the
  // token. Previously any failure cleared it, so a 502 from a service that was
  // still waking up — or a moment offline — signed people out with no
  // explanation. That is the one outcome worse than a slow load.
  const validateToken = async (token: string, { alreadyRendered }: { alreadyRendered: boolean }) => {
    apiClient.setToken(token);
    const result = await apiClient.getProfile();

    if (result.success) {
      writeCachedUser(result.data.user);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: result.data.user, token }
      });
      return;
    }

    if (isAuthRejection(result.status)) {
      localStorage.removeItem('token');
      clearCachedUser();
      apiClient.setToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return;
    }

    // Server unreachable or erroring. Keep the session: if we are already
    // showing the cached profile, leave it be and try again on the next call.
    // If we are not, there is nothing to show, so stop blocking the app — the
    // user lands signed out but their token survives for the next attempt.
    if (!alreadyRendered) {
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
    // Same reasoning as the gamification mirror below: left behind, this would
    // restore the previous user's profile on the next visit to this browser.
    clearCachedUser();
    // Drop the XP/streak mirror so the next person to sign in on this browser
    // doesn't inherit — or merge up — the previous user's numbers.
    clearLocalGamification();
    clearLocalTopikEstimate();
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

