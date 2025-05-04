const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Import services
const ocrService = require('../services/ocrService');
const parserService = require('../services/parserService');
const db = require('../db/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    console.log('Upload directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    console.log('Generated filename:', uniqueFilename);
    cb(null, uniqueFilename);
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  console.log('Received file:', file.originalname, 'mimetype:', file.mimetype);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/receipts/upload - Upload and process a receipt
router.post('/upload', upload.single('receipt'), async (req, res, next) => {
  try {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log(`Processing receipt image: ${filePath}`);

    // Step 1: Extract text from receipt image
    console.log('Starting OCR processing');
    const ocrText = await ocrService.processImage(filePath);
    console.log('OCR processing completed');
    
    // Step 2: Parse items from OCR text
    console.log('Starting receipt parsing');
    const parsedItems = await parserService.parseReceiptItems(ocrText);
    console.log('Receipt parsing completed');

    // Return the processing results
    const response = {
      success: true,
      file: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      ocr: {
        text: ocrText
      },
      parsed: {
        items: parsedItems
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error processing receipt:', error);
    // Send a more detailed error response
    res.status(500).json({
      error: 'Error processing receipt',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/receipts/save - Save processed receipt and items
router.post('/save', async (req, res) => {
  try {
    const { receipt, items } = req.body;
    
    if (!receipt || !items || !Array.isArray(items)) {
      return res.status(400).json({ 
        error: 'Invalid request format. Receipt and items array are required.' 
      });
    }

    // Start a transaction
    await new Promise((resolve, reject) => {
      db.db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // Save receipt metadata
      const receiptId = await db.receipts.insert({
        store_name: receipt.store_name,
        receipt_date: receipt.receipt_date,
        receipt_total: receipt.receipt_total,
        receipt_image_path: receipt.receipt_image_path,
        ocr_text: receipt.ocr_text
      });

      // Save each item
      for (const item of items) {
        await db.pantryItems.insert({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          purchase_date: receipt.receipt_date, // Use receipt date as purchase date
          expiry_date: item.expiry_date,
          receipt_id: receiptId,
          notes: item.notes
        });
      }

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(201).json({
        success: true,
        message: 'Receipt and items saved successfully',
        receipt_id: receiptId
      });
    } catch (error) {
      // Rollback transaction on error
      await new Promise((resolve) => {
        db.db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }
  } catch (error) {
    console.error('Error saving receipt and items:', error);
    res.status(500).json({
      error: 'Error saving receipt and items',
      message: error.message
    });
  }
});

// GET /api/receipts/items - Get all pantry items
router.get('/items', async (req, res) => {
  try {
    const { category } = req.query;
    
    let items;
    if (category) {
      // Filter by category if provided
      items = await new Promise((resolve, reject) => {
        db.db.all(
          'SELECT * FROM pantry_items WHERE is_active = 1 AND category = ? ORDER BY purchase_date DESC',
          [category],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    } else {
      // Get all active items
      items = await db.pantryItems.getAll(true);
    }
    
    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error retrieving pantry items:', error);
    res.status(500).json({
      error: 'Error retrieving pantry items',
      message: error.message
    });
  }
});

// GET /api/receipts/items/:id - Get a single pantry item
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Item ID is required' 
      });
    }
    
    // Get the item from the database
    const item = await db.pantryItems.getById(id);
    
    if (!item) {
      return res.status(404).json({ 
        error: 'Item not found' 
      });
    }
    
    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Error retrieving pantry item:', error);
    res.status(500).json({
      error: 'Error retrieving pantry item',
      message: error.message
    });
  }
});

// PATCH /api/receipts/items/:id - Update a pantry item
router.patch('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate input
    if (!id || !updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Item ID and at least one field to update are required.' 
      });
    }
    
    // Check if item exists
    const existingItem = await db.pantryItems.getById(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Update item
    const result = await db.pantryItems.update(id, updates);
    
    if (result > 0) {
      res.json({
        success: true,
        message: 'Item updated successfully'
      });
    } else {
      res.status(400).json({
        error: 'No changes made to the item'
      });
    }
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({
      error: 'Error updating pantry item',
      message: error.message
    });
  }
});

// DELETE /api/receipts/items/:id - Remove item (soft delete)
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    // Check if item exists
    const existingItem = await db.pantryItems.getById(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Soft delete by setting is_active to 0
    const result = await db.pantryItems.deactivate(id);
    
    if (result > 0) {
      res.json({
        success: true,
        message: 'Item removed successfully'
      });
    } else {
      res.status(400).json({
        error: 'Failed to remove item'
      });
    }
  } catch (error) {
    console.error('Error removing pantry item:', error);
    res.status(500).json({
      error: 'Error removing pantry item',
      message: error.message
    });
  }
});

// POST /api/receipts/items/clear - Clear all pantry items
router.post('/items/clear', async (req, res) => {
  try {
    // Deactivate all active pantry items
    const result = await db.pantryItems.deactivateAll();
    
    res.json({
      success: true,
      message: 'All pantry items cleared successfully',
      count: result
    });
  } catch (error) {
    console.error('Error clearing pantry items:', error);
    res.status(500).json({
      error: 'Error clearing pantry items',
      message: error.message
    });
  }
});

// GET /api/receipts/:id - Get a specific receipt by ID
router.get('/:id', (req, res) => {
  // This would typically fetch from database
  // For now, just return a placeholder
  res.json({
    id: req.params.id,
    status: 'This would fetch receipt details from a database'
  });
});

module.exports = router;
