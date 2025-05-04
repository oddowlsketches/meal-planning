/**
 * Pantry Service
 * Handles interactions with the pantry API endpoints
 */

import { ENDPOINTS } from './config.js';
import { get, post, put, del } from './apiService.js';

/**
 * Get all pantry items
 * @returns {Promise<Array>} - Array of pantry items
 */
export const getAllPantryItems = async () => {
  try {
    const response = await get(ENDPOINTS.PANTRY_ITEMS);
    return response.items || [];
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    throw error;
  }
};

/**
 * Add a new pantry item
 * @param {Object} item - Pantry item data
 * @returns {Promise<Object>} - Added item with ID
 */
export const addPantryItem = async (item) => {
  try {
    const response = await post(ENDPOINTS.PANTRY_ITEMS, item);
    return response;
  } catch (error) {
    console.error('Error adding pantry item:', error);
    throw error;
  }
};

/**
 * Update a pantry item
 * @param {number} id - Item ID
 * @param {Object} item - Updated pantry item data
 * @returns {Promise<Object>} - Update result
 */
export const updatePantryItem = async (id, item) => {
  try {
    const response = await put(ENDPOINTS.PANTRY_ITEM_BY_ID(id), item);
    return response;
  } catch (error) {
    console.error('Error updating pantry item:', error);
    throw error;
  }
};

/**
 * Delete a pantry item
 * @param {number} id - Item ID to delete
 * @returns {Promise<Object>} - Delete result
 */
export const deletePantryItem = async (id) => {
  try {
    const response = await del(ENDPOINTS.PANTRY_ITEM_BY_ID(id));
    return response;
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    throw error;
  }
};

/**
 * Process a receipt image to extract pantry items
 * @param {FormData} formData - FormData containing the receipt image
 * @returns {Promise<Object>} - Extracted items
 */
export const processReceipt = async (formData) => {
  try {
    console.log('Preparing to process receipt...');
    console.log('FormData entries:', [...formData.entries()]);
    
    // Check if formData contains an image
    if (!formData.has('image')) {
      console.error('FormData does not contain an image');
      throw new Error('No image provided in FormData');
    }
    
    // Get the image from FormData
    const file = formData.get('image');
    console.log('File object:', file);
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');
    
    // Custom request without using the API service's POST method
    // because we need to handle FormData differently
    const endpoint = `${ENDPOINTS.API_BASE_URL}${ENDPOINTS.PANTRY_RECEIPT}`;
    console.log('Sending request to:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - the browser will set it with the boundary parameter
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error response:', errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Processed receipt successfully, items:', responseData.items?.length || 0);
    return responseData;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
};

/**
 * Normalize a pantry item
 */
export const normalizePantryItem = (item) => {
  if (!item) return null;
  
  return {
    id: item.id,
    name: item.name || '',
    category: item.category || null,
    quantity: item.quantity || null,
    unit: item.unit || null,
    purchase_date: item.purchase_date || item.purchaseDate || null,
    estimated_expiry: item.estimated_expiry || item.estimatedExpiry || null
  };
};

export default {
  getAllPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
  processReceipt,
  normalizePantryItem
};