// init_db.js
// Inisialisasi SQLite DB dan masukkan sample data:
// - products
// - discounts
// - customers
// - suppliers
// - transactions
// - transaction_logs
//
// Jalankan: node init_db.js  (atau npm run init-db jika package.json diset)

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SQL_FILE = path.join(__dirname, 'init_db.sql');
const DB_FILE = path.join(__dirname, 'inventory.db');

if (!fs.existsSync(SQL_FILE)) {
  console.error('File init_db.sql tidak ditemukan di folder yang sama.');
  process.exit(1);
}

const sql = fs.readFileSync(SQL_FILE, 'utf8');
const db = new Database(DB_FILE);

// Eksekusi schema
db.exec(sql);

// Helper insert dengan 'INSERT OR IGNORE' untuk idempotency
const pInsert = db.prepare(
  `INSERT OR IGNORE INTO products (id,name,price,stock,category,min_stock) VALUES (@id,@name,@price,@stock,@category,@min_stock)`
);
const dInsert = db.prepare(
  `INSERT OR IGNORE INTO discounts (name,category,min_qty,percent,customer_group) VALUES (@name,@category,@min_qty,@percent,@customer_group)`
);
const cInsert = db.prepare(
  `INSERT OR IGNORE INTO customers (id,name,group_type) VALUES (@id,@name,@group_type)`
);
const sInsert = db.prepare(
  `INSERT OR IGNORE INTO suppliers (id,name) VALUES (@id,@name)`
);
const tInsert = db.prepare(
  `INSERT OR IGNORE INTO transactions (id,product_id,quantity,type,customer_id,supplier_id,price_at_time,discount,timestamp) VALUES (@id,@product_id,@quantity,@type,@customer_id,@supplier_id,@price_at_time,@discount,@timestamp)`
);
const logInsert = db.prepare(
  `INSERT INTO transaction_logs (transaction_id,message,timestamp) VALUES (@transaction_id,@message,@timestamp)`
);

// Start transaction untuk batch insert
const insertTx = db.transaction(() => {
  // PRODUCTS
  pInsert.run({ id: 'P001', name: 'Tinta Printer', price: 50.0, stock: 100, category: 'Office', min_stock: 10 });
  pInsert.run({ id: 'P002', name: 'Kertas A4', price: 3.0, stock: 500, category: 'Office', min_stock: 50 });
  pInsert.run({ id: 'P003', name: 'Mouse Wireless', price: 120.0, stock: 20, category: 'Electronics', min_stock: 5 });
  pInsert.run({ id: 'P004', name: 'Keyboard Mechanical', price: 350.0, stock: 15, category: 'Electronics', min_stock: 3 });
  pInsert.run({ id: 'P005', name: 'Bolpoin', price: 0.75, stock: 1000, category: 'Office', min_stock: 100 });
  pInsert.run({ id: 'P006', name: 'Stapler', price: 15.0, stock: 80, category: 'Office', min_stock: 10 });
  pInsert.run({ id: 'P007', name: 'Charger USB-C', price: 80.0, stock: 40, category: 'Electronics', min_stock: 5 });
  pInsert.run({ id: 'P008', name: 'Mousepad', price: 25.0, stock: 60, category: 'Accessories', min_stock: 5 });
  pInsert.run({ id: 'P009', name: 'Notebook A5', price: 6.5, stock: 200, category: 'Office', min_stock: 20 });
  pInsert.run({ id: 'P010', name: 'Headset', price: 220.0, stock: 12, category: 'Electronics', min_stock: 3 });

  // DISCOUNTS
  dInsert.run({ name: 'Bulk Office 10%', category: 'Office', min_qty: 100, percent: 10, customer_group: null });
  dInsert.run({ name: 'VIP 5%', category: null, min_qty: 1, percent: 5, customer_group: 'vip' });
  dInsert.run({ name: 'Electronics Promo 7%', category: 'Electronics', min_qty: 5, percent: 7, customer_group: null });

  // CUSTOMERS
  cInsert.run({ id: 'C001', name: 'PT. Sukses Makmur', group_type: 'regular' });
  cInsert.run({ id: 'C002', name: 'CV. Maju Jaya', group_type: 'vip' });
  cInsert.run({ id: 'C003', name: 'Toko Alat Tulis', group_type: 'regular' });

  // SUPPLIERS
  sInsert.run({ id: 'S001', name: 'Distributor OfficeMart' });
  sInsert.run({ id: 'S002', name: 'Distributor Elektronik' });

  // TRANSACTIONS (sample sales & purchases across months in 2025)
  // We'll use static timestamps so dashboard filter (2025-01-01 .. 2025-12-31) dapat menampilkan data
  const txs = [
    // January sales
    { id: 'T001', product_id: 'P001', quantity: 10, type: 'sale', customer_id: 'C001', supplier_id: null, price_at_time: 50.0, discount: 0, timestamp: '2025-01-05T10:15:00.000Z' },
    { id: 'T002', product_id: 'P002', quantity: 200, type: 'sale', customer_id: 'C003', supplier_id: null, price_at_time: 3.0, discount: 0, timestamp: '2025-01-10T09:00:00.000Z' },

    // February sales
    { id: 'T003', product_id: 'P003', quantity: 5, type: 'sale', customer_id: 'C001', supplier_id: null, price_at_time: 120.0, discount: 7, timestamp: '2025-02-14T12:30:00.000Z' },
    { id: 'T004', product_id: 'P004', quantity: 2, type: 'sale', customer_id: 'C002', supplier_id: null, price_at_time: 350.0, discount: 5, timestamp: '2025-02-20T15:45:00.000Z' },

    // March sales
    { id: 'T005', product_id: 'P005', quantity: 300, type: 'sale', customer_id: 'C003', supplier_id: null, price_at_time: 0.75, discount: 0, timestamp: '2025-03-03T08:00:00.000Z' },

    // April purchase (restock)
    { id: 'T006', product_id: 'P003', quantity: 20, type: 'purchase', customer_id: null, supplier_id: 'S002', price_at_time: 100.0, discount: 0, timestamp: '2025-04-01T07:00:00.000Z' },

    // May sales
    { id: 'T007', product_id: 'P007', quantity: 8, type: 'sale', customer_id: 'C001', supplier_id: null, price_at_time: 80.0, discount: 0, timestamp: '2025-05-10T11:20:00.000Z' },

    // June sales
    { id: 'T008', product_id: 'P010', quantity: 4, type: 'sale', customer_id: 'C002', supplier_id: null, price_at_time: 220.0, discount: 5, timestamp: '2025-06-05T13:00:00.000Z' },

    // July sales
    { id: 'T009', product_id: 'P009', quantity: 50, type: 'sale', customer_id: 'C003', supplier_id: null, price_at_time: 6.5, discount: 0, timestamp: '2025-07-12T09:30:00.000Z' },

    // August purchase
    { id: 'T010', product_id: 'P002', quantity: 1000, type: 'purchase', customer_id: null, supplier_id: 'S001', price_at_time: 2.5, discount: 0, timestamp: '2025-08-01T06:00:00.000Z' }
  ];

  for (const t of txs) {
    tInsert.run({
      id: t.id,
      product_id: t.product_id,
      quantity: t.quantity,
      type: t.type,
      customer_id: t.customer_id,
      supplier_id: t.supplier_id,
      price_at_time: t.price_at_time,
      discount: t.discount,
      timestamp: t.timestamp
    });

    // log
    logInsert.run({
      transaction_id: t.id,
      message: `${t.type} ${t.quantity} x ${t.product_id} @${t.price_at_time} discount:${t.discount}%`,
      timestamp: t.timestamp
    });
  }
});

insertTx();

console.log('Database initialized at', DB_FILE);
db.close();
