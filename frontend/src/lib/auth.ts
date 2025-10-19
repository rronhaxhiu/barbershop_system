/**
 * Authentication utilities for managing JWT tokens and auth state
 */

const TOKEN_KEY = 'admin_token';

export const authUtils = {
  /**
   * Store the JWT token in localStorage
   */
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  /**
   * Get the JWT token from localStorage
   */
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  /**
   * Remove the JWT token from localStorage
   */
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },

  /**
   * Logout user
   */
  logout: (): void => {
    authUtils.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  },
};

/**
 * Get authorization header with Bearer token
 */
export const getAuthHeader = (): Record<string, string> => {
  const token = authUtils.getToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
};

