import React, { useState } from 'react';
import api from '../../services/api/index.js';
import './ReceiptScanner.css';

function ReceiptScanner({ onItemsExtracted }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Create preview URL
    const fileUrl = URL.createObjectURL(file);
    
    setSelectedFile(file);
    setPreviewUrl(fileUrl);
    setError(null);
    setExtractedItems([]);
    setShowItemEditor(false);
  };
  
  // Process the receipt image
  const handleProcessReceipt = async () => {
    if (!selectedFile) {
      setError('Please select a receipt image first');
      return;
    }
    
    console.log('Processing receipt image...');
    console.log('Selected file:', selectedFile);
    
    setIsLoading(true);
    setError(null);
    setExtractedItems([]);
    
    try {
      // Create form data with the image
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      console.log('FormData created with image file');
      console.log('Form data entries:', [...formData.entries()]);
      
      // Send the image to the backend for processing
      console.log('Sending to backend for processing...');
      const result = await api.pantry.processReceipt(formData);
      console.log('Processing complete, result:', result);
      
      // Store extracted items
      setExtractedItems(result.items || []);
      setSelectedItems(result.items || []);
      setShowItemEditor(true);
    } catch (err) {
      console.error('Error processing receipt:', err);
      setError(`Failed to process receipt: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle item selection
  const toggleItemSelection = (index) => {
    setSelectedItems(prevItems => {
      const item = extractedItems[index];
      const isSelected = prevItems.find(i => i.name === item.name);
      
      if (isSelected) {
        // Remove from selection
        return prevItems.filter(i => i.name !== item.name);
      } else {
        // Add to selection
        return [...prevItems, item];
      }
    });
  };
  
  // Update an item's properties
  const updateItem = (index, field, value) => {
    setExtractedItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
      
      // Also update in selectedItems if it's selected
      const selectedIndex = selectedItems.findIndex(item => item.name === updatedItems[index].name);
      if (selectedIndex !== -1) {
        setSelectedItems(prevSelected => {
          const updatedSelected = [...prevSelected];
          updatedSelected[selectedIndex] = { ...updatedItems[index] };
          return updatedSelected;
        });
      }
      
      return updatedItems;
    });
  };
  
  // Add selected items to pantry
  const handleAddToPantry = () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to add to your pantry');
      return;
    }
    
    // Pass selected items to parent component
    onItemsExtracted(selectedItems);
  };
  
  // Reset everything
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError(null);
    setExtractedItems([]);
    setShowItemEditor(false);
    setSelectedItems([]);
  };
  
  return (
    <div className="receipt-scanner">
      <div className="scanner-header">
        <h2>Receipt Scanner</h2>
        <p className="scanner-description">
          Upload a photo of your grocery receipt to automatically add items to your pantry.
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-section">
        <input
          type="file"
          id="receipt-image"
          className="file-input"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <label htmlFor="receipt-image" className="file-input-label">
          {selectedFile ? 'Change Image' : 'Select Receipt Image'}
        </label>
        
        {selectedFile && !showItemEditor && (
          <button 
            className="process-button"
            onClick={handleProcessReceipt}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Process Receipt'}
          </button>
        )}
        
        {showItemEditor && (
          <button 
            className="reset-button"
            onClick={handleReset}
          >
            Upload New Receipt
          </button>
        )}
      </div>
      
      {previewUrl && !showItemEditor && (
        <div className="image-preview">
          <h3>Receipt Preview</h3>
          <img src={previewUrl} alt="Receipt preview" />
          {isLoading && (
            <div className="processing-overlay">
              <div className="processing-spinner"></div>
              <div className="processing-text">Processing receipt...</div>
            </div>
          )}
        </div>
      )}
      
      {showItemEditor && extractedItems.length > 0 && (
        <div className="items-editor">
          <h3>Extracted Items</h3>
          <p>Review and select the items you want to add to your pantry.</p>
          
          <table className="items-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {extractedItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedItems.some(i => i.name === item.name)}
                      onChange={() => toggleItemSelection(index)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={item.category || ''}
                      onChange={(e) => updateItem(index, 'category', e.target.value)}
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
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={item.unit || ''}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="editor-actions">
            <button
              className="add-to-pantry-button"
              onClick={handleAddToPantry}
              disabled={selectedItems.length === 0}
            >
              Add {selectedItems.length} Items to Pantry
            </button>
            <button
              className="cancel-button"
              onClick={handleReset}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {showItemEditor && extractedItems.length === 0 && (
        <div className="no-items-message">
          No items could be extracted from this receipt. 
          Try a clearer image or add items manually.
        </div>
      )}
    </div>
  );
}

export default ReceiptScanner;