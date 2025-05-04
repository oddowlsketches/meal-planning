const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Import services
const ocrService = require('../services/ocrService');
const parserService = require('../services/parserService');

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
    const ocrResult = await ocrService.processImage(filePath);
    console.log('OCR processing completed');
    
    // Step 2: Parse items from OCR text
    console.log('Starting receipt parsing');
    const parsedItems = await parserService.parseReceiptItems(ocrResult.text);
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
        text: ocrResult.text,
        confidence: ocrResult.confidence
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
