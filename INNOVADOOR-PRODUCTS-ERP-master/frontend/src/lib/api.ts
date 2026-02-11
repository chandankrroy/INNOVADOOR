// Use proxy in development (when running through Vite dev server)
// In production, use VITE_API_URL (must include /api/v1)
const API_BASE_URL =
  import.meta.env.DEV
    ? "/api/v1" // Use Vite proxy in development
    : (import.meta.env.VITE_API_URL as string) ||
      "https://REPLACE_WITH_BACKEND_URL/api/v1";

// Utility function to safely extract error message from error objects
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error?.message) {
    return String(error.message);
  }
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((err: any) => {
        const field = err.loc ? err.loc.join('.') : 'field';
        return `${field}: ${err.msg || JSON.stringify(err)}`;
      }).join(', ');
    }
    return JSON.stringify(detail);
  }
  if (error?.detail) {
    return typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
  }
  if (error?.response?.status) {
    return `HTTP ${error.response.status}: ${error.response.statusText || 'Error'}`;
  }
  return 'An unexpected error occurred';
};

const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Prevent concurrent refresh attempts
let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false;

const refreshAccessToken = async (): Promise<string | null> => {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  // Set refreshing flag and create promise
  isRefreshing = true;
  refreshPromise = (async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch (error) {
    clearTokens();
    return null;
    } finally {
      // Reset flags after refresh completes
      isRefreshing = false;
      refreshPromise = null;
  }
  })();

  return refreshPromise;
};

const makeRequest = async (
  url: string,
  options: RequestInit,
  requireAuth: boolean = false,
  retry: boolean = true
): Promise<Response> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requireAuth) {
    let token = getAccessToken();
    
    // If no access token, try to refresh using refresh token
    if (!token) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            token = newToken;
          } else {
            throw new Error('Session expired. Please login again.');
          }
        } catch (error) {
          throw new Error('Session expired. Please login again.');
        }
      } else {
        throw new Error('No authentication token found. Please login again.');
      }
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const fullUrl = `${API_BASE_URL}${url}`;
    console.log('Making request:', options.method || 'GET', fullUrl);
    
    response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('Response status:', response.status, response.statusText);
  } catch (error: any) {
    // Handle network errors (server not running, CORS, etc.)
    if (error.name === "AbortError") {
      throw new Error(
        "Request timeout. Please check if the backend server is reachable."
      );
    }
    if (error.name === "TypeError" || error.message === "Failed to fetch") {
      throw new Error(
        "Failed to connect to server. Please make sure the backend server is running."
      );
    }
    throw error;
  }

  // If 401 and we have a refresh token, try to refresh (only once)
  if (response.status === 401 && requireAuth && retry) {
    // Prevent infinite refresh loops - only retry once
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry the request with the new token (without retry flag to prevent loops)
      headers['Authorization'] = `Bearer ${newToken}`;
      try {
        const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers,
        });
        // If retry succeeds, return the response
        if (retryResponse.ok) {
          return retryResponse;
        }
        // If still 401 after refresh, token is invalid
        if (retryResponse.status === 401) {
          clearTokens();
          // Don't throw error for /auth/me endpoint during initial load
          if (url.includes('/auth/me')) {
            return retryResponse; // Return the 401 response, let caller handle it
          }
          throw new Error('Session expired. Please login again.');
        }
        return retryResponse;
      } catch (error: any) {
        if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
          throw new Error('Failed to fetch');
        }
        // If it's already our custom error, re-throw it
        if (error.message?.includes('Session expired')) {
          throw error;
        }
        throw error;
      }
    } else {
      // Refresh failed, clear tokens
      clearTokens();
      // Don't throw error for /auth/me endpoint during initial load
      if (url.includes('/auth/me')) {
        return response; // Return the 401 response, let caller handle it
      }
      throw new Error('Session expired. Please login again.');
    }
  }
  
  // If still 401 and we didn't retry, clear tokens
  if (response.status === 401 && requireAuth && !retry) {
    clearTokens();
    // Don't throw error for /auth/me endpoint during initial load
    if (url.includes('/auth/me')) {
      return response; // Return the 401 response, let caller handle it
    }
    throw new Error('Session expired. Please login again.');
  }

  return response;
};

export const api = {
  post: async (url: string, data: any, requireAuth: boolean = false) => {
    try {
      // Don't retry POST requests to /auth/refresh to prevent loops
      const isRefreshEndpoint = url.includes('/auth/refresh');
      const response = await makeRequest(
        url,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        requireAuth,
        !isRefreshEndpoint // Only allow retry if not refresh endpoint
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Create error object with response status
        const error: any = new Error();
        error.response = {
          status: response.status,
          data: errorData
        };
        
        // Handle Pydantic validation errors (array format)
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          error.message = validationErrors || `HTTP ${response.status}: ${response.statusText}`;
          throw error;
        }
        
        // Handle single detail error
        if (errorData.detail) {
          error.message = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          throw error;
        }
        
        error.message = `HTTP ${response.status}: ${response.statusText}`;
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      // Handle network errors
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        throw new Error(
          "Unable to connect to server. Please make sure the backend server is reachable."
        );
      }
      // Handle timeout errors
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new Error('Request timeout. The server is taking too long to respond. Please try again.');
      }
      // Preserve error with response if it exists
      if (error.response) {
        throw error;
      }
      // Handle other errors
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },

  get: async (url: string, requireAuth: boolean = true) => {
    try {
      const response = await makeRequest(
        url,
        {
          method: 'GET',
        },
        requireAuth,
        true // Allow retry for GET requests
      );

      if (!response.ok) {
        // For /auth/me 401 errors, return null instead of throwing (handled silently in AuthContext)
        if (url.includes('/auth/me') && response.status === 401) {
          return null;
        }

        const errorData = await response.json().catch(() => ({}));
        
        // Create error object with response status
        const error: any = new Error();
        error.response = {
          status: response.status,
          data: errorData
        };
        
        // Handle Pydantic validation errors (array format)
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          error.message = validationErrors || `HTTP ${response.status}: ${response.statusText}`;
          throw error;
        }
        
        // Handle single detail error
        if (errorData.detail) {
          error.message = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          throw error;
        }
        
        error.message = `HTTP ${response.status}: ${response.statusText}`;
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      // For /auth/me 401 errors, return null instead of throwing (handled silently in AuthContext)
      if (url.includes('/auth/me') && error.response?.status === 401) {
        return null;
      }

      console.error('API Error:', error);
      // Handle network errors
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        throw new Error(
          "Unable to connect to server. Please make sure the backend server is reachable."
        );
      }
      // Preserve error with response if it exists
      if (error.response) {
        throw error;
      }
      // Handle other errors
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },

  put: async (url: string, data: any, requireAuth: boolean = true) => {
    try {
      const response = await makeRequest(
        url,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        requireAuth,
        true // Allow retry for PUT requests
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle Pydantic validation errors (array format)
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          throw new Error(validationErrors || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle single detail error
        if (errorData.detail) {
          throw new Error(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API Error:', error);
      // Handle network errors
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        throw new Error(
          "Unable to connect to server. Please make sure the backend server is reachable."
        );
      }
      // Handle other errors
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },

  patch: async (url: string, data: any, requireAuth: boolean = true) => {
    try {
      const response = await makeRequest(
        url,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
        requireAuth,
        true
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          throw new Error(validationErrors || `HTTP ${response.status}: ${response.statusText}`);
        }
        if (errorData.detail) {
          throw new Error(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API Error:', error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Unable to connect to server. Please make sure the backend server is running on http://localhost:8000');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },

  delete: async (url: string, data?: any, requireAuth: boolean = true) => {
    try {
      const response = await makeRequest(
        url,
        {
          method: 'DELETE',
          body: data ? JSON.stringify(data) : undefined,
        },
        requireAuth,
        true // Allow retry for DELETE requests
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle Pydantic validation errors (array format)
        if (Array.isArray(errorData.detail)) {
          const validationErrors = errorData.detail.map((err: any) => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          throw new Error(validationErrors || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Handle single detail error
        if (errorData.detail) {
          throw new Error(typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail));
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // DELETE might return 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json().catch(() => null);
    } catch (error: any) {
      console.error('API Error:', error);
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Unable to connect to server. Please make sure the backend server is running on http://localhost:8000');
      }
      // Handle other errors
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },
};
