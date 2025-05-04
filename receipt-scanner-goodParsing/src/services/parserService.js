const { OpenAI } = require('openai');
const { categorizeItem } = require('./categorizationService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Identify store from receipt text
 * @param {string} text - The full receipt text
 * @returns {string} - Store identifier (WHOLE_FOODS, TRADER_JOES, or GENERIC)
 */
function identifyStore(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('whole foods') || lowerText.includes('wholefoods')) {
    return 'WHOLE_FOODS';
  } else if (lowerText.includes('trader joe') || lowerText.includes('traderjoe')) {
    return 'TRADER_JOES';
  }
  
  return 'GENERIC';
}

/**
 * Clean an item name from a receipt by applying common transformations
 * @param {string} name - Raw item name from receipt
 * @param {string} storeType - The type of store (WHOLE_FOODS, TRADER_JOES, or GENERIC)
 * @returns {string} - Cleaned and formatted item name
 */
function cleanItemName(name, storeType) {
  if (!name || typeof name !== 'string') return '';

  // Remove leading/trailing spaces
  let cleaned = name.trim();
  
  // Generic OCR error patterns that work across stores
  const genericPatterns = [
    // Fix common OCR errors in numbers
    { pattern: /0/g, replacement: "O" },
    { pattern: /1/g, replacement: "I" },
    { pattern: /5/g, replacement: "S" },
    { pattern: /8/g, replacement: "B" },
    // Fix common word separations
    { pattern: /([a-z])([A-Z])/g, replacement: "$1 $2" },
    { pattern: /([A-Z])([A-Z])/g, replacement: "$1 $2" },
    // Fix common OCR word errors
    { pattern: /\bPTACHPS\b/i, replacement: "Potato Chips" },
    { pattern: /\bWICHIPS\b/i, replacement: "Chips" },
    { pattern: /\b0G\b/i, replacement: "Organic" },
    { pattern: /\b0RGANIC\b/i, replacement: "Organic" },
    // Remove non-alphanumeric characters except spaces
    { pattern: /[^a-zA-Z0-9\s]/g, replacement: " " },
    // Fix multiple spaces
    { pattern: /\s{2,}/g, replacement: " " }
  ];
  
  // Apply generic patterns
  genericPatterns.forEach(({ pattern, replacement }) => {
    cleaned = cleaned.replace(pattern, replacement);
  });
  
  // Properly capitalize words
  cleaned = cleaned.split(' ')
    .map(word => {
      if (word.length === 0) return '';
      // Special case for abbreviations
      if (word.match(/^[A-Z]{2,}$/)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  return cleaned;
}

/**
 * Extract quantity and unit information from a line
 * @param {string} line - The text line to analyze
 * @param {string} storeType - The type of store (WHOLE_FOODS, TRADER_JOES, or GENERIC)
 * @returns {Object} - Quantity and unit information
 */
function extractQuantityAndUnit(line, storeType) {
  if (!line || typeof line !== 'string') return { quantity: 1, unit: 'ea' };

  // Skip lines that are clearly not quantities
  if (line.match(/^(TOTAL|SUBTOTAL|TAX|BALANCE|DUE|PAID|CHANGE)/i)) {
    return { quantity: 1, unit: 'ea' };
  }

  // Get patterns for this store
  const patterns = getQuantityPatterns(storeType);

  // Try each pattern
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const quantity = parseFloat(match[1]);
      const unit = match[2] || 'ea';
      
      // Validate quantity is reasonable (between 0.01 and 100)
      if (quantity >= 0.01 && quantity <= 100) {
        return { quantity, unit };
      }
    }
  }

  return { quantity: 1, unit: 'ea' };
}

function getQuantityPatterns(storeType) {
  // Define base patterns that are common across stores
  const basePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:x|X)\s*(?:ea|EA|EACH|each)/i,
    /(\d+(?:\.\d+)?)\s*(?:lb|LB|LBS|lbs|POUND|pound|POUNDS|pounds)/i,
    /(\d+(?:\.\d+)?)\s*(?:oz|OZ|OUNCE|ounce|OUNCES|ounces)/i,
    /(\d+(?:\.\d+)?)\s*(?:g|G|GRAM|gram|GRAMS|grams)/i,
    /(\d+(?:\.\d+)?)\s*(?:kg|KG|KILO|kilo|KILOS|kilos)/i,
    /(\d+(?:\.\d+)?)\s*(?:ml|ML|MILLILITER|milliliter|MILLILITERS|milliliters)/i,
    /(\d+(?:\.\d+)?)\s*(?:l|L|LITER|liter|LITERS|liters)/i,
    /(\d+(?:\.\d+)?)\s*(?:ct|CT|COUNT|count|COUNTS|counts)/i,
    /(\d+(?:\.\d+)?)\s*(?:pk|PK|PACK|pack|PACKS|packs)/i,
    /(\d+(?:\.\d+)?)\s*(?:box|BOX|Box)/i,
    /(\d+(?:\.\d+)?)\s*(?:bag|BAG|Bag)/i,
    /(\d+(?:\.\d+)?)\s*(?:bottle|BOTTLE|Bottle)/i,
    /(\d+(?:\.\d+)?)\s*(?:jar|JAR|Jar)/i,
    /(\d+(?:\.\d+)?)\s*(?:can|CAN|Can)/i,
    /(\d+(?:\.\d+)?)\s*(?:roll|ROLL|Roll)/i,
    /(\d+(?:\.\d+)?)\s*(?:piece|PIECE|Piece)/i,
    /(\d+(?:\.\d+)?)\s*(?:unit|UNIT|Unit)/i
  ];

  // Store-specific patterns
  const storePatterns = {
    'WHOLE_FOODS': [
      // Whole Foods specific patterns
      /(\d+(?:\.\d+)?)\s*(?:ea|EA|EACH|each)\s*withPrime\$\d+\.?\d+$/i,
      /(\d+(?:\.\d+)?)\s*(?:lb|LB|LBS|lbs)\s*Reg\$\d+\.?\d+$/i,
      /(\d+(?:\.\d+)?)\s*(?:ea|EA|EACH|each)\s*Reg\$\d+\.?\d+$/i
    ],
    'TRADER_JOES': [
      // Trader Joe's specific patterns
      /(\d+(?:\.\d+)?)\s*(?:G|EA)\$\d+\.?\d+$/i,
      /(\d+(?:\.\d+)?)\s*(?:DOUBLE|ROLL|PK|CT|OZ|LB|EA)/i,
      /(\d+(?:\.\d+)?)\s*(?:G|EA)\s*EACH/i
    ],
    'GENERIC': []
  };

  // Combine base patterns with store-specific patterns
  return [...basePatterns, ...(storePatterns[storeType] || [])];
}

/**
 * Group receipt lines that belong to the same item
 * @param {string[]} lines - Array of receipt lines
 * @param {string} storeType - The type of store (WHOLE_FOODS, TRADER_JOES, or GENERIC)
 * @returns {Array} - Array of line groups
 */
function groupReceiptLines(lines, storeType) {
  const groups = [];
  let currentGroup = [];
  
  // Store-specific item line detection
  const storeItemPatterns = {
    'WHOLE_FOODS': [
      // Keep all existing Whole Foods patterns exactly as they are
      /^[A-Z0-9\s]+\s+\$?\d+\.?\d+\s*F[T]?$/i,
      /^[0-9]+WFM[A-Z0-9\s]+\s+\$?\d+\.?\d+$/i,
      /^[A-Z0-9\s]+\s+Reg\$\d+\.?\d+$/i,
      /^[A-Z0-9\s]+\s+SavingswithPrime\$\d+\.?\d+$/i,
      /^Qty\d+\s+\$?\d+\.?\d+\s*ea$/i,
      /^[A-Z0-9\s]+\s+\$?\d+\.?\d+$/i,
      /^[A-Z0-9\s]+\s+lb\$\d+\.?\d+$/i,
      /^[A-Z0-9\s]+\s+ea\$\d+\.?\d+$/i
    ],
    'TRADER_JOES': [
      // Updated Trader Joe's patterns to be more strict
      /^T[A-Z0-9\s]+(?:\s+\$?\d+\.?\d+)?$/i,  // Trader Joe's branded items
      /^R[A-Z0-9\s]+(?:\s+\$?\d+\.?\d+)?$/i,  // Refrigerated items
      /^[A-Z0-9\s]+\d+(?:DOUBLE|ROLL|PK|CT|OZ|LB|EA)(?:\s+\$?\d+\.?\d+)?$/i,  // Items with quantity
      /^[A-Z0-9\s]+\d+(?:G|EA)\$?\d+\.?\d+$/i,  // Items with G/EA price
      /^[A-Z0-9\s]+(?:EACH|\d+(?:G|EA))(?:\s+\$?\d+\.?\d+)?$/i,  // Items with EACH or quantity
      /^[A-Z0-9\s]+\s+\$?\d+\.?\d+$/i  // Standard price format
    ],
    'GENERIC': [
      /\$?\d+\.?\d+$/
    ]
  };
  
  // Store-specific modifier line detection
  const storeModifierPatterns = {
    'WHOLE_FOODS': [
      // Keep all existing Whole Foods patterns exactly as they are
      /^Reg\$\d+\.?\d+$/i,
      /^SavingswithPrime\$\d+\.?\d+$/i,
      /^Qty\d+\s+\$?\d+\.?\d+\s*ea$/i,
      /^withPrime\$\d+\.?\d+$/i,
      /^lb\$\d+\.?\d+$/i,
      /^ea\$\d+\.?\d+$/i,
      /^Reg\$/i,
      /^SavingswithPrime\$/i,
      /^withPrime\$/i,
      /^lb$/i,
      /^ea$/i,
      /^Qty\d+$/i
    ],
    'TRADER_JOES': [
      // Updated Trader Joe's patterns to be more strict
      /^@/i,
      /^lb$/i,
      /^ea$/i,
      /^oz$/i,
      /^G$/i,
      /^\d+(?:G|EA)\$?\d+\.?\d+$/i,
      /^EACH$/i,
      /^\d+(?:G|EA)$/i,
      /^\$?\d+\.?\d+$/i
    ],
    'GENERIC': [
      /^Qty/i,
      /^lb$/i,
      /^ea$/i
    ]
  };
  
  // Get the patterns for this store
  const itemPatterns = storeItemPatterns[storeType] || storeItemPatterns['GENERIC'];
  const modifierPatterns = storeModifierPatterns[storeType] || storeModifierPatterns['GENERIC'];
  
  const isItemLine = (line) => {
    // Skip lines that are clearly not items
    if (line.toLowerCase().includes('total') ||
        line.toLowerCase().includes('subtotal') ||
        line.toLowerCase().includes('tax') ||
        line.toLowerCase().includes('balance') ||
        line.toLowerCase().includes('change') ||
        line.toLowerCase().includes('card') ||
        line.toLowerCase().includes('deposit') ||
        line.match(/^\d{5}/) || // Skip zip codes
        line.match(/^[A-Z]{2}\s*\d{5}/) || // Skip state + zip
        line.match(/^\d{10,}/)) { // Skip long numbers (likely transaction IDs)
      return false;
    }
    
    // For Trader Joe's, be more strict with item detection
    if (storeType === 'TRADER_JOES') {
      // Skip lines that are clearly not items
      if (line.match(/^@/) || // Skip standalone @ symbols
          line.match(/^lb$/) || // Skip standalone lb
          line.match(/^ea$/) || // Skip standalone ea
          line.match(/^oz$/) || // Skip standalone oz
          line.match(/^G$/) || // Skip standalone G
          line.match(/^EACH$/) || // Skip standalone EACH
          line.match(/^[A-Z]{2}\s*\d{5}/) || // Skip addresses
          line.match(/^\d{10,}/)) { // Skip long numbers
        return false;
      }
      
      // Must match one of the Trader Joe's patterns
      return itemPatterns.some(pattern => pattern.test(line));
    }
    
    // For Whole Foods, keep existing logic
    if (storeType === 'WHOLE_FOODS') {
      // Skip lines that are clearly not items
      if (line.match(/^Reg\$/i) ||
          line.match(/^SavingswithPrime\$/i) ||
          line.match(/^withPrime\$/i) ||
          line.match(/^ea\$/i) ||
          line.match(/^lb\$/i) ||
          line.match(/^Qty\d+$/i)) {
        return false;
      }
      
      // Skip lines that don't look like Whole Foods items
      if (!line.match(/^[A-Z0-9\s]+/) || // Must start with uppercase letters or numbers
          line.match(/^[A-Z]{2}\s*\d{5}/) || // Skip addresses
          line.match(/^\d{10,}/)) { // Skip long numbers
        return false;
      }
    }
    
    // Check if line matches any item pattern
    return itemPatterns.some(pattern => pattern.test(line));
  };
  
  const isModifierLine = (line) => {
    // Skip lines that are clearly not modifiers
    if (line.length < 2 || // Too short
        line.match(/^\d{10,}/) || // Transaction IDs
        line.match(/^[A-Z]{2}\s*\d{5}/)) { // Addresses
      return false;
    }
    
    // Check if line matches any modifier pattern
    return modifierPatterns.some(pattern => pattern.test(line));
  };
  
  // Process lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (isItemLine(line)) {
      // If we were building a group, finish it
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      
      // Start a new group with this item
      currentGroup = [line];
      
      // Look ahead for modifiers
      let j = i + 1;
      while (j < lines.length && isModifierLine(lines[j].trim())) {
        currentGroup.push(lines[j].trim());
        i = j; // Skip these lines in the main loop
        j++;
      }
    } else if (currentGroup.length > 0 && isModifierLine(line)) {
      // Add modifiers to current group
      currentGroup.push(line);
    } else if (currentGroup.length > 0) {
      // This line doesn't belong in the current group
      groups.push(currentGroup);
      currentGroup = [];
    }
  }
  
  // Add the last group if it exists
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}

/**
 * Extract item details from a line using various patterns
 * @param {string} line - The line to parse
 * @param {string} storeType - The type of store (WHOLE_FOODS, TRADER_JOES, or GENERIC)
 * @returns {Object|null} - Item details or null if no match
 */
function extractItemDetails(line, storeType) {
  // Store-specific item patterns
  const storePatterns = {
    'WHOLE_FOODS': [
      // Keep all existing Whole Foods patterns exactly as they are
      { pattern: /^(.+?)\s+\$?(\d+\.?\d+)\s*F[T]?$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^([0-9]+WFM[A-Z0-9\s]+)\s+\$?(\d+\.?\d+)$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)\s+Reg\$\d+\.?\d+$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)\s+SavingswithPrime\$\d+\.?\d+$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)\s+Qty\d+\s+\$?(\d+\.?\d+)\s*ea$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)\s+lb\$\d+\.?\d+$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)\s+ea\$\d+\.?\d+$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)\s+\$?(\d+\.?\d+)\s*$/i, nameIndex: 1, priceIndex: 2 }
    ],
    'TRADER_JOES': [
      // Updated Trader Joe's patterns to be more strict and accurate
      { pattern: /^T\s*(.+?)\s+\$?(\d+\.?\d+)$/i, nameIndex: 1, priceIndex: 2 },  // Trader Joe's branded items with price
      { pattern: /^R\s*(.+?)\s+\$?(\d+\.?\d+)$/i, nameIndex: 1, priceIndex: 2 },  // Refrigerated items with price
      { pattern: /^(.+?)\s+\d+(?:G|EA)\s+\$?(\d+\.?\d+)$/i, nameIndex: 1, priceIndex: 2 },  // Items with quantity and price
      { pattern: /^(.+?)\s+\$?(\d+\.?\d+)$/i, nameIndex: 1, priceIndex: 2 },  // Standard price format
      { pattern: /^(.+?)\s+EACH\s+\$?(\d+\.?\d+)$/i, nameIndex: 1, priceIndex: 2 }  // Items with EACH and price
    ],
    'GENERIC': [
      { pattern: /^(.+?)(?:\s+\$?(\d+\.?\d*))?$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)(?:\s+\$?(\d+[A-Za-z]?\d+))?$/i, nameIndex: 1, priceIndex: 2 },
      { pattern: /^(.+?)(?:\$(\d+\.?\d*))?$/i, nameIndex: 1, priceIndex: 2 }
    ]
  };
  
  // Get the patterns for this store
  const patternsToUse = [
    ...(storePatterns[storeType] || []),
    ...storePatterns['GENERIC']
  ];
  
  // Try each pattern
  for (const { pattern, nameIndex, priceIndex } of patternsToUse) {
    const match = line.match(pattern);
    if (match) {
      const rawName = match[nameIndex];
      let rawPrice = match[priceIndex];
      
      // Process the price if available
      let price = 0;
      if (rawPrice) {
        let priceStr = rawPrice.replace(/[A-Za-z]/g, '.'); // Replace letters with decimal
        price = parseFloat(priceStr);
        
        // Price validation
        if (price > 100) {
          console.log(`Fixing likely price error: ${price}`);
          // Check if it looks like it's missing a decimal point
          if (price > 100 && price < 10000) {
            price = price / 100; // Convert 1234 to 12.34
          } else {
            price = price / 10000; // For really large numbers
          }
        }
        
        // Additional price sanity check
        if (price < 0.10 || price > 50.00) {
          console.log(`Skipping item with unreasonable price: ${price}`);
          continue;
        }
      }
      
      // For Trader Joe's, be more strict with item validation
      if (storeType === 'TRADER_JOES') {
        // Skip items without prices
        if (!price) {
          console.log(`Skipping Trader Joe's item without price: ${rawName}`);
          continue;
        }
        
        // Skip items that look like non-items
        if (rawName.match(/^(TOTAL|SUBTOTAL|TAX|BALANCE|DUE|PAID|CHANGE|CARD|CREDIT|DEBIT|PAYMENT|TRANSACTION|COPY|CHIP|VERIFICATION|DEPOSIT|BOTTLE|ITEMS|SOLD|NET|SALES|CUSTOMER)$/i)) {
          console.log(`Skipping Trader Joe's non-item: ${rawName}`);
          continue;
        }
      }
      
      return {
        name: rawName.trim(),
        price: price,
        confidence: price > 0 ? 'medium' : 'low'
      };
    }
  }
  
  return null;
}

/**
 * Determine if a line should be skipped during parsing
 * @param {string} line - The line to check
 * @param {string} storeType - The type of store (WHOLE_FOODS, TRADER_JOES, or GENERIC)
 * @returns {boolean} - Whether to skip the line
 */
function shouldSkipLine(line, storeType) {
  // Common words to ignore across all stores
  const commonIgnoredWords = [
    'total', 'subtotal', 'tax', 'balance', 'change', 'card', 'credit', 'debit', 
    'payment', 'paid', 'due', 'receipt', 'store', 'thank', 'welcome', 'date', 
    'time', 'order', 'loyalty', 'points', 'rewards', 'prime', 'reg',
    'market', 'sold', 'items', 'net', 'sales', 'customer', 'copy', 'chip',
    'visa', 'mastercard', 'amex', 'returns', 'require', 'proof'
  ];
  
  // Store-specific words to ignore
  const storeIgnoredWords = {
    'WHOLE_FOODS': ['savings', 'prime', 'whole foods', 'market'],
    'TRADER_JOES': [
      'transaction', 'trader', 'purchase', 'contactless', 'type', 'bottle',
      'deposit', 'items', 'sold', 'net', 'sales', 'customer', 'copy', 'chip',
      'verification', 'balance', 'due', 'paid', 'change', 'card', 'credit',
      'debit', 'payment', 'receipt', 'store', 'thank', 'welcome', 'date',
      'time', 'order', 'loyalty', 'points', 'rewards'
    ],
    'GENERIC': []
  };
  
  // Combine common and store-specific words
  const ignoredWords = [
    ...commonIgnoredWords,
    ...(storeIgnoredWords[storeType] || [])
  ];
  
  // Pattern to detect addresses
  const addressPattern = /.*,\s*[A-Z]{2}\s*\d{5}.*$/i;
  
  const lowerLine = line.toLowerCase();
  
  // Skip lines with ignored words
  if (ignoredWords.some(word => lowerLine.includes(word.toLowerCase()))) {
    console.log(`Skipping line with ignored words: ${line}`);
    return true;
  }
  
  // Skip lines that look like addresses
  if (line.match(addressPattern)) {
    console.log(`Skipping address line: ${line}`);
    return true;
  }
  
  // Skip tax lines
  if (line.match(/tax|te\s+\d+\.\d+/i)) {
    console.log(`Skipping tax line: ${line}`);
    return true;
  }
  
  // For Trader Joe's, be more strict with line skipping
  if (storeType === 'TRADER_JOES') {
    // Skip lines that are just numbers or very short
    if (line.match(/^\d+$/) || line.length < 3) {
      console.log(`Skipping short/numeric line: ${line}`);
      return true;
    }
    
    // Skip lines that look like transaction IDs
    if (line.match(/^\d{10,}/)) {
      console.log(`Skipping transaction ID line: ${line}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate confidence level for parsed item
 * @param {string} name - Cleaned item name
 * @param {number} price - Extracted price
 * @returns {string} - Confidence level (high, medium, low)
 */
function calculateConfidence(name, price) {
  let score = 0;
  
  // Name quality checks
  if (name && name.length > 3) score += 1;
  if (name && name.includes(' ')) score += 1; // Contains spaces (likely properly parsed)
  if (!/^\d+$/.test(name)) score += 1; // Not just numbers
  
  // Price checks
  if (price && price > 0.10) score += 1; // Reasonable minimum price
  if (price && price < 50.00) score += 1; // Reasonable maximum price
  
  // Apply confidence rating
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

/**
 * Parse receipt items using LLM as primary parser
 * @param {string} text - The receipt text
 * @returns {Promise<Array>} - Array of parsed items
 */
async function parseReceiptItems(text) {
  try {
    console.log('Starting receipt parsing with text:', text);
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.error('Invalid input: receipt text is required and must not be empty');
      return [];
    }

    // Clean the text
    text = text.replace(/\r\n/g, '\n').trim();
    
    // Identify store type (still useful for context)
    const storeType = identifyStore(text);
    console.log(`Identified store type: ${storeType}`);
    
    // Try LLM parsing first
    console.log('\nAttempting primary LLM parsing...');
    const llmItems = await parseWithLLM(text, storeType);
    
    if (llmItems && llmItems.length > 0) {
      console.log(`LLM parsing found ${llmItems.length} items`);
      console.log('LLM parsed items:', JSON.stringify(llmItems, null, 2));
      
      // Validate and clean LLM results
      const validatedItems = llmItems
        .map(item => ({
          name: cleanItemName(item.name || '', storeType),
          quantity: parseFloat(item.quantity) || 1,
          unit: (item.unit || 'ea').toLowerCase(),
          price: parseFloat(item.price) || 0,
          category: categorizeItem(item.name || ''),
          confidence: 'high'
        }))
        .filter(item => 
          item.name && 
          item.name.length > 0 && 
          item.quantity > 0 && 
          item.price > 0
        );
      
      console.log('Validated LLM items:', JSON.stringify(validatedItems, null, 2));
      
      if (validatedItems.length >= 3) {
        console.log('LLM parsing successful, returning validated items');
        return validatedItems;
      }
    }
    
    // If LLM parsing failed or found too few items, try regex as fallback
    console.log('\nFalling back to regex parsing...');
    const lines = text.split('\n').filter(line => line.trim());
    console.log('Total lines to process:', lines.length);
    
    const lineGroups = groupReceiptLines(lines, storeType);
    console.log('Found line groups:', lineGroups.length);
    
    const regexItems = [];
    const processedItems = new Set();
    
    for (const group of lineGroups) {
      console.log('\nProcessing group:', group);
      const item = extractItemDetails(group[0], storeType);
      
      if (item) {
        console.log('Extracted item details:', item);
        const cleanedName = cleanItemName(item.name, storeType);
        
        if (!processedItems.has(cleanedName)) {
          processedItems.add(cleanedName);
          
          let quantity = 1;
          let unit = 'ea';
          
          for (const line of group.slice(1)) {
            console.log('Processing modifier line:', line);
            const extracted = extractQuantityAndUnit(line, storeType);
            if (extracted.quantity) {
              quantity = extracted.quantity;
              unit = extracted.unit || 'ea';
              console.log('Found quantity/unit:', extracted);
              break;
            }
          }
          
          const confidence = calculateConfidence(cleanedName, item.price);
          console.log('Calculated confidence:', confidence);
          
          if (confidence !== 'low') {
            regexItems.push({
              name: cleanedName,
              price: item.price,
              quantity: quantity,
              unit: unit,
              category: categorizeItem(cleanedName),
              confidence: confidence
            });
          }
        }
      }
    }
    
    console.log(`Regex fallback found ${regexItems.length} items`);
    console.log('Regex parsed items:', JSON.stringify(regexItems, null, 2));
    
    // If both methods found items, merge them
    if (llmItems && llmItems.length > 0 && regexItems.length > 0) {
      const mergedItems = [...regexItems];
      const processedNames = new Set(regexItems.map(item => item.name));
      
      for (const llmItem of llmItems) {
        if (!processedNames.has(llmItem.name)) {
          mergedItems.push(llmItem);
          processedNames.add(llmItem.name);
        }
      }
      
      console.log(`Merged ${regexItems.length} regex items with ${llmItems.length} LLM items`);
      return mergedItems;
    }
    
    // Return whichever method found more items
    return regexItems.length > 0 ? regexItems : llmItems;
    
  } catch (error) {
    console.error('Error parsing receipt:', error);
    return [];
  }
}

/**
 * Parse receipt items using LLM
 * @param {string} text - The receipt text
 * @param {string} storeType - The type of store
 * @returns {Promise<Array>} - Array of parsed items
 */
async function parseWithLLM(text, storeType) {
  try {
    const storeSpecificRules = {
      'WHOLE_FOODS': `
   - Look for items with F or FT suffix (e.g., "LONGGRAINRICE $4.49F")
   - Look for 365 brand items (e.g., "365WFMOGBABYSPINACH")
   - Look for items with Reg$ price (e.g., "Reg$3.99")
   - Look for items with SavingswithPrime (e.g., "SavingswithPrime$1.00")
   - Look for items with quantity and price (e.g., "Qty2$2.99ea")
   - Look for items with lb$ price (e.g., "lb$2.9971b")
   - Look for items with ea$ price (e.g., "ea$0.89712")
   - Skip standalone Reg$, SavingswithPrime, or quantity lines
   - Skip lines that are clearly not items (addresses, transaction IDs, etc.)
   - For items without prices, look for Reg$ or SavingswithPrime lines below
   - Clean up OCR errors in item names (e.g., "PTACHPS" -> "Potato Chips")
   - IMPORTANT: For Whole Foods items, always include the price from the item line or the Reg$ line below it`,
      'TRADER_JOES': `
   - Look for T prefix for Trader Joe's branded items
   - Look for R prefix for refrigerated items
   - Prices are often at the end of the receipt
   - Some items may have quantities in the name (e.g., "6 DOUBLE ROLL")
   - Items with "EACH" or "G" suffix often have quantity information
   - Skip bottle deposits and other non-item lines
   - For items without prices, estimate reasonable prices based on typical values`,
      'GENERIC': `
   - Look for standard price formats
   - Skip tax lines, totals, and other non-item lines
   - Handle OCR errors intelligently`
    };

    const prompt = `Parse the following receipt text into a list of items. For each item, extract:
1. Name (clean and normalize the name)
2. Quantity (number)
3. Unit (e.g., ea, lb, oz, etc.)
4. Price (number)

Receipt text:
${text}

Store type: ${storeType}

Rules:
1. Clean and normalize item names to be readable
2. Extract quantities and units where available
3. Skip tax lines, totals, and other non-item lines
4. Handle OCR errors intelligently
5. Skip duplicate items
6. Store-specific rules:${storeSpecificRules[storeType] || storeSpecificRules['GENERIC']}
7. Return ONLY a JSON array, no explanatory text
8. For Whole Foods items, ALWAYS include the price from the item line or the Reg$ line below it

Format the response as a JSON array of objects with these fields:
{
  "name": "string",
  "quantity": number,
  "unit": "string",
  "price": number
}`;

    console.log('Sending prompt to LLM:', prompt);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a receipt parsing assistant. Parse the receipt text into a list of items with their quantities, units, and prices. Clean and normalize item names. Only include actual items, not subtotals or taxes. Handle OCR errors intelligently. Return ONLY a JSON array, no explanatory text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const result = response.choices[0].message.content.trim();
    console.log('Raw LLM response:', result);
    
    try {
      // Extract just the JSON array from the response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in response');
        return [];
      }
      
      const parsedItems = JSON.parse(jsonMatch[0]);
      console.log('Parsed JSON items:', JSON.stringify(parsedItems, null, 2));
      
      // Validate and clean the parsed items
      const cleanedItems = parsedItems.map(item => ({
        name: cleanItemName(item.name || '', storeType),
        quantity: parseFloat(item.quantity) || 1,
        unit: (item.unit || 'ea').toLowerCase(),
        price: parseFloat(item.price) || 0
      })).filter(item => 
        item.name && 
        item.name.length > 0 && 
        item.quantity > 0
      );
      
      console.log('Cleaned and filtered items:', JSON.stringify(cleanedItems, null, 2));
      return cleanedItems;
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      console.error('Raw response:', result);
      return [];
    }
  } catch (error) {
    console.error('Error in LLM parsing:', error);
    return [];
  }
}

module.exports = {
  parseReceiptItems,
  cleanItemName,
  extractQuantityAndUnit,
  groupReceiptLines,
  extractItemDetails,
  shouldSkipLine,
  calculateConfidence,
  identifyStore
};
