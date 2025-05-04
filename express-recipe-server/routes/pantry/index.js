import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { dbOperations } from '../../db-utils.js';
import receiptProcessor from '../../services/ocr/receiptProcessor.js';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
console.log(`Uploads directory path: ${uploadsDir}`);
if (!fs.existsSync(uploadsDir)) {
  console.log('Uploads directory does not exist, creating it now');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    console.log('Uploads directory created successfully');
  } catch (dirError) {
    console.error('Error creating uploads directory:', dirError);
  }
} else {
  console.log('Uploads directory already exists');
  // Check if directory is writable
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log('Uploads directory is writable');
  } catch (accessError) {
    console.error('Uploads directory is not writable:', accessError);
  }
}

// Configure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`Setting destination for file: ${file.originalname}`);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const newFilename = `${Date.now()}-${file.originalname}`;
    console.log(`Generated filename: ${newFilename}`);
    cb(null, newFilename);
  }
});

// File filter to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
  console.log(`Checking file type: ${file.mimetype}`);
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    console.log(`Rejected file type: ${file.mimetype}`);
    return cb(new Error('Only image files are allowed!'), false);
  }
  console.log(`Accepted file type: ${file.mimetype}`);
  cb(null, true);
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Get all pantry items
router.get('/items', (req, res) => {
  try {
    const items = dbOperations.getPantryItems();
    res.json({ items });
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new pantry item
router.post('/items', (req, res) => {
  try {
    const item = req.body;
    
    // Validate required fields
    if (!item.name) {
      return res.status(400).json({ error: 'Pantry item must include a name' });
    }
    
    const itemId = dbOperations.addPantryItem(item);
    res.status(201).json({ 
      id: itemId, 
      message: 'Pantry item added successfully' 
    });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a pantry item
router.put('/items/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = req.body;
    
    // Validate required fields
    if (!item.name) {
      return res.status(400).json({ error: 'Pantry item must include a name' });
    }
    
    const success = dbOperations.updatePantryItem(itemId, item);
    
    if (!success) {
      return res.status(404).json({ error: 'Pantry item not found' });
    }
    
    res.json({ 
      id: itemId, 
      message: 'Pantry item updated successfully' 
    });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a pantry item
router.delete('/items/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const success = dbOperations.deletePantryItem(itemId);
    
    if (!success) {
      return res.status(404).json({ error: 'Pantry item not found' });
    }
    
    res.json({ message: 'Pantry item deleted successfully' });
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process a receipt image
router.post('/receipt', (req, res) => {
  upload.single('image')(req, res, async function(err) {
    if (err) {
      console.error('Multer file upload error:', err);
      return res.status(400).json({ error: `File upload failed: ${err.message}` });
    }
    
    // Continue with the rest of the route handler
  try {
    console.log('Receipt upload request received');
    
    if (!req.file) {
      console.log('No file was uploaded');
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    console.log(`Receipt image uploaded to ${req.file.path}`);
    console.log(`File details: ${JSON.stringify(req.file, null, 2)}`);
    
    // Process the receipt image to extract items
    console.log('Starting OCR processing...');
    const extractedItems = await receiptProcessor.processReceiptImage(req.file.path);
    console.log(`OCR processing complete, extracted ${extractedItems.length} items`);
    console.log('Extracted items:', JSON.stringify(extractedItems, null, 2));
    
    // Return the extracted items to the client
    res.json({ 
      message: 'Receipt processed successfully',
      filePath: req.file.path,
      items: extractedItems
    });
  } catch (error) {
    console.error('Receipt processing route error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
  });
});

export default router;