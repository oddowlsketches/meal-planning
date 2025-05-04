# Receipt Scanner Module

A standalone module for scanning and parsing grocery receipts using OCR. This module is designed to be easily integrated into the meal planning application.

## Features

- Upload receipt images
- Extract text using OCR via Tesseract.js
- Parse grocery items, quantities, and prices
- Categorize items automatically
- Simple web interface for testing

## Installation

1. Clone the repository or navigate to this directory
2. Install dependencies:
   ```
   npm install
   ```
3. Create an `.env` file based on the example or ensure the following environment variables are set:
   ```
   PORT=3001
   UPLOAD_DIR=uploads
   NODE_ENV=development
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

2. Access the test UI at `http://localhost:3001`

3. Upload a receipt image and check the parsed results

## API Endpoints

- `POST /api/receipts/upload` - Upload and process a receipt
- `GET /api/receipts/:id` - Get a specific receipt by ID (placeholder for future DB integration)
- `GET /api/status` - Check API status

## Integration with Meal Planning App

This module is designed to be integrated with the main meal planning application in two ways:

1. **As a microservice**: The receipt scanner can run as a separate service, and the main app can make API calls to it.

2. **As a module**: The core functionality can be imported into the main app as a set of services.

### Integration steps:

1. Import the OCR and parser services into the main app
2. Set up the necessary endpoints or UI components
3. Connect the parsed items to the pantry management system

## Future Enhancements

- Database integration for storing processed receipts
- Improved item recognition with machine learning
- Support for different receipt formats and stores
- Barcode scanning for better accuracy
- Integration with store loyalty programs for digital receipts

## Technology Stack

- Node.js and Express.js
- Tesseract.js for OCR
- Multer for file uploads
- Frontend: HTML, CSS, JavaScript (vanilla)
