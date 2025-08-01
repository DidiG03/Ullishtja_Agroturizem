// Centralized API configuration to eliminate duplication
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Helper function for API calls
export const createApiUrl = (endpoint) => `${API_BASE_URL}/api${endpoint}`;

// Generic API call helper with error handling
export const apiCall = async (endpoint, options = {}) => {
  const url = createApiUrl(endpoint);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
};