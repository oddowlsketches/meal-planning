/**
 * API Service
 * Handles all API requests to the backend
 */

import { API_BASE_URL, ENDPOINTS, DEFAULT_OPTIONS, handleApiError } from './config.js';

/**
 * Base API Request function
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - JSON response
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Merge default and custom options
  const requestOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...options.headers
    }
  };

  try {
    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    
    // Handle API errors
    await handleApiError(response);
    
    // Parse and return the response
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// GET request helper
export const get = (endpoint, params = {}) => {
  // Build query string from params
  const queryString = Object.keys(params).length 
    ? `?${new URLSearchParams(params).toString()}`
    : '';
  
  return apiRequest(`${endpoint}${queryString}`, { method: 'GET' });
};

// POST request helper
export const post = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// PUT request helper
export const put = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// DELETE request helper
export const del = (endpoint) => {
  return apiRequest(endpoint, { method: 'DELETE' });
};

/**
 * Check API server status
 * @returns {Promise<Object>} - Status information
 */
export const checkStatus = () => {
  return get(ENDPOINTS.STATUS).catch(error => {
    console.error('Server unavailable:', error);
    return { status: 'error', message: 'Server unavailable' };
  });
};

export default {
  get,
  post,
  put,
  del,
  checkStatus
};