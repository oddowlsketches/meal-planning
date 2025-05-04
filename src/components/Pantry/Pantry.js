import React, { useState, useEffect } from 'react';
import PantryItemsList from './PantryItemsList.js';
import ReceiptScanner from './ReceiptScanner.js';
import api from '../../services/api/index.js';
import './Pantry.css';

function Pantry() {
  const [pantryItems, setPantryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'scan'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    purchase_date: new Date().toISOString().split('T')[0],
    estimated_expiry: ''
  });
  
  // Load pantry items on component mount
  useEffect(() => {
    loadPantryItems();
  }, []);
  
  // Function to load pantry items from API
  const loadPantryItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const items = await api.pantry.getAllPantryItems();
      setPantryItems(items);
    } catch (err) {
      console.error('Error loading pantry items:', err);
      setError('Failed to load pantry items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle input changes for the new item form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prevItem => ({
      ...prevItem,
      [name]: value
    }));
  };
  
  // Submit new item to API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Add the item via API
      await api.pantry.addPantryItem(newItem);
      
      // Reset form and reload items
      setNewItem({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        purchase_date: new Date().toISOString().split('T')[0],
        estimated_expiry: ''
      });
      setShowAddForm(false);
      
      // Reload pantry items
      loadPantryItems();
    } catch (err) {
      console.error('Error adding pantry item:', err);
      setError('Failed to add item. Please try again.');
    }
  };
  
  // Delete a pantry item
  const handleDeleteItem = async (itemId) => {
    try {
      await api.pantry.deletePantryItem(itemId);
      // Remove item from state
      setPantryItems(pantryItems.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting pantry item:', err);
      setError('Failed to delete item. Please try again.');
    }
  };
  
  // Handle items extracted from receipt scanner
  const handleExtractedItems = async (items) => {
    try {
      // Add each extracted item to pantry
      for (const item of items) {
        await api.pantry.addPantryItem(item);
      }
      
      // Reload pantry items
      loadPantryItems();
      
      // Switch to items tab
      setActiveTab('items');
    } catch (err) {
      console.error('Error adding extracted items:', err);
      setError('Failed to add items from receipt. Please try again.');
    }
  };
  
  return (
    <div className="pantry-container">
      <div className="pantry-header">
        <h1>My Pantry</h1>
        <div className="pantry-tabs">
          <button 
            className={activeTab === 'items' ? 'active' : ''}
            onClick={() => setActiveTab('items')}
          >
            Pantry Items
          </button>
          <button 
            className={activeTab === 'scan' ? 'active' : ''}
            onClick={() => setActiveTab('scan')}
          >
            Scan Receipt
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {activeTab === 'items' ? (
        <div className="pantry-items-section">
          <div className="pantry-controls">
            <button 
              className="add-item-button"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : 'Add Item Manually'}
            </button>
            <button 
              className="refresh-button"
              onClick={loadPantryItems}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          
          {showAddForm && (
            <div className="add-item-form">
              <h2>Add New Item</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Item Name*</label>
                  <input 
                    id="name"
                    name="name"
                    type="text"
                    value={newItem.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select 
                    id="category"
                    name="category"
                    value={newItem.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Category</option>
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Grains">Grains</option>
                    <option value="Canned Goods">Canned Goods</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Condiments">Condiments</option>
                    <option value="Spices">Spices</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input 
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="unit">Unit</label>
                    <select 
                      id="unit"
                      name="unit"
                      value={newItem.unit}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Unit</option>
                      <option value="ea">Each</option>
                      <option value="g">Grams</option>
                      <option value="kg">Kilograms</option>
                      <option value="lb">Pounds</option>
                      <option value="oz">Ounces</option>
                      <option value="ml">Milliliters</option>
                      <option value="l">Liters</option>
                      <option value="cup">Cups</option>
                      <option value="tbsp">Tablespoons</option>
                      <option value="tsp">Teaspoons</option>
                      <option value="bunch">Bunch</option>
                      <option value="pkg">Package</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="purchase_date">Purchase Date</label>
                    <input 
                      id="purchase_date"
                      name="purchase_date"
                      type="date"
                      value={newItem.purchase_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="estimated_expiry">Estimated Expiry</label>
                    <input 
                      id="estimated_expiry"
                      name="estimated_expiry"
                      type="date"
                      value={newItem.estimated_expiry}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-button">Add Item</button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <PantryItemsList 
            items={pantryItems}
            isLoading={isLoading}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      ) : (
        <ReceiptScanner onItemsExtracted={handleExtractedItems} />
      )}
    </div>
  );
}

export default Pantry;