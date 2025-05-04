import React, { useState } from 'react';
import './PantryItemsList.css';

function PantryItemsList({ items, isLoading, onDeleteItem }) {
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Generate a list of unique categories from the items
  const categories = [''].concat([...new Set(items.map(item => item.category))].filter(Boolean).sort());
  
  // Filter items based on search term and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });
  
  // Sort items based on current sort settings
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Compare based on data type
    let comparison;
    if (typeof aValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else {
      comparison = aValue - bValue;
    }
    
    // Apply sort direction
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Toggle sort direction or change sort field
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Format pantry item's quantity and unit for display
  const formatQuantity = (item) => {
    if (!item.quantity) return 'N/A';
    return `${item.quantity} ${item.unit || ''}`.trim();
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  if (isLoading) {
    return <div className="loading">Loading pantry items...</div>;
  }
  
  return (
    <div className="pantry-items-list">
      <div className="pantry-filters">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search items..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      {sortedItems.length === 0 ? (
        <div className="no-items-message">
          {filter || categoryFilter ? 
            'No items match your filters.' : 
            'No items in your pantry yet. Add some items or scan a receipt to get started!'}
        </div>
      ) : (
        <table className="pantry-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Item Name
                {sortBy === 'name' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('category')}>
                Category
                {sortBy === 'category' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('quantity')}>
                Quantity
                {sortBy === 'quantity' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('purchase_date')}>
                Purchase Date
                {sortBy === 'purchase_date' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('estimated_expiry')}>
                Expiry Date
                {sortBy === 'estimated_expiry' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category || 'Uncategorized'}</td>
                <td>{formatQuantity(item)}</td>
                <td>{formatDate(item.purchase_date)}</td>
                <td>{formatDate(item.estimated_expiry)}</td>
                <td>
                  <button 
                    className="delete-button" 
                    onClick={() => onDeleteItem(item.id)}
                    title="Delete item"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PantryItemsList;