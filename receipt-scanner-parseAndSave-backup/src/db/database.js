const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../../data/pantry.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
    initializeTables();
});

// Initialize database tables
function initializeTables() {
    db.serialize(() => {
        // Create receipts table
        db.run(`CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_name TEXT NOT NULL,
            receipt_date TEXT NOT NULL,
            receipt_total REAL,
            receipt_image_path TEXT,
            ocr_text TEXT,
            processed_date TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create pantry_items table
        db.run(`CREATE TABLE IF NOT EXISTS pantry_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            quantity REAL,
            unit TEXT,
            price REAL,
            purchase_date TEXT,
            expiry_date TEXT,
            receipt_id INTEGER,
            is_active INTEGER DEFAULT 1,
            notes TEXT,
            FOREIGN KEY (receipt_id) REFERENCES receipts(id)
        )`);
    });
}

// Receipt operations
const receipts = {
    insert: async (receipt) => {
        console.log('Inserting receipt:', receipt);
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO receipts (
                store_name, receipt_date, receipt_total, 
                receipt_image_path, ocr_text
            ) VALUES (?, ?, ?, ?, ?)`;
            
            db.run(sql, [
                receipt.store_name,
                receipt.receipt_date,
                receipt.receipt_total,
                receipt.receipt_image_path,
                receipt.ocr_text
            ], function(err) {
                if (err) {
                    console.error('Error inserting receipt:', err);
                    reject(err);
                } else {
                    console.log('Receipt inserted successfully, ID:', this.lastID);
                    resolve(this.lastID);
                }
            });
        });
    },

    getById: async (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM receipts WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    getAll: async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM receipts ORDER BY receipt_date DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    update: async (id, receipt) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE receipts SET 
                store_name = ?,
                receipt_date = ?,
                receipt_total = ?,
                receipt_image_path = ?,
                ocr_text = ?
                WHERE id = ?`;
            
            db.run(sql, [
                receipt.store_name,
                receipt.receipt_date,
                receipt.receipt_total,
                receipt.receipt_image_path,
                receipt.ocr_text,
                id
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    delete: async (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM receipts WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
};

// Pantry item operations
const pantryItems = {
    insert: async (item) => {
        console.log('Inserting pantry item:', item);
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO pantry_items (
                name, category, quantity, unit, price,
                purchase_date, expiry_date, receipt_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [
                item.name,
                item.category,
                item.quantity,
                item.unit,
                item.price,
                item.purchase_date,
                item.expiry_date,
                item.receipt_id,
                item.notes
            ], function(err) {
                if (err) {
                    console.error('Error inserting pantry item:', err);
                    reject(err);
                } else {
                    console.log('Pantry item inserted successfully, ID:', this.lastID);
                    resolve(this.lastID);
                }
            });
        });
    },

    getById: async (id) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM pantry_items WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    getAll: async (activeOnly = true) => {
        return new Promise((resolve, reject) => {
            const sql = activeOnly 
                ? 'SELECT * FROM pantry_items WHERE is_active = 1 ORDER BY purchase_date DESC'
                : 'SELECT * FROM pantry_items ORDER BY purchase_date DESC';
            
            db.all(sql, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    update: async (id, item) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE pantry_items SET 
                name = ?,
                category = ?,
                quantity = ?,
                unit = ?,
                price = ?,
                purchase_date = ?,
                expiry_date = ?,
                receipt_id = ?,
                notes = ?
                WHERE id = ?`;
            
            db.run(sql, [
                item.name,
                item.category,
                item.quantity,
                item.unit,
                item.price,
                item.purchase_date,
                item.expiry_date,
                item.receipt_id,
                item.notes,
                id
            ], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    delete: async (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM pantry_items WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    deactivate: async (id) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE pantry_items SET is_active = 0 WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },
    
    deactivateAll: async () => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE pantry_items SET is_active = 0 WHERE is_active = 1', function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }
};

// Close database connection on process exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = {
    db,
    receipts,
    pantryItems
}; 