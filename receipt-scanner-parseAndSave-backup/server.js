require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { processImage } = require('./src/services/ocrService');
const { parseReceiptItems } = require('./src/services/parserService');

// Import routes
const receiptRoutes = require('./src/controllers/receiptController');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src/public')));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/receipts', receiptRoutes);

// Handle receipt upload and processing
app.post('/api/upload', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const filePath = req.file.path;
    console.log('Processing receipt image:', filePath);

    // Process the image with OCR
    console.log('Starting OCR processing');
    const ocrText = await processImage(filePath);
    console.log('OCR completed successfully');

    // Parse the receipt text
    console.log('Starting receipt parsing with text:', ocrText);
    const items = await parseReceiptItems(ocrText);
    console.log('Receipt parsing completed');

    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });

    // Send response
    const response = {
      success: true,
      file: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      ocr: { text: ocrText },
      parsed: { items }
    };
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple status route
app.get('/api/status', (req, res) => {
  res.json({ status: 'Receipt Scanner API is running' });
});

// Serve the simple test UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Receipt Scanner server running on port ${PORT}`);
});
