PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK(price >= 0),
  stock INTEGER NOT NULL CHECK(stock >= 0),
  category TEXT,
  min_stock INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_type TEXT DEFAULT 'regular'  -- can be used for discount tiers
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  type TEXT NOT NULL CHECK(type IN ('purchase','sale')),
  customer_id TEXT,
  supplier_id TEXT,
  price_at_time REAL NOT NULL CHECK(price_at_time >= 0),
  discount REAL DEFAULT 0,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS transaction_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT,
  message TEXT,
  timestamp TEXT
);

CREATE TABLE IF NOT EXISTS discounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  category TEXT,        -- apply to category if set
  min_qty INTEGER,      -- apply when purchase qty >= min_qty
  percent REAL,         -- discount percent (0-100)
  customer_group TEXT   -- optional: only apply to customers of this group
);
