/**
 * Austin Smart Mall — database initializer (SQLite via better-sqlite3)
 * Persistent, survives restarts. Swap to PostgreSQL later by changing this layer.
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/austin.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer','vendor','affiliate','admin')),
  name TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  business_name TEXT NOT NULL,
  city TEXT,
  category TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','pro')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','suspended')),
  balance_kobo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendor_applications (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  category TEXT,
  plan TEXT DEFAULT 'free',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  vendor_id TEXT REFERENCES vendors(id),
  name TEXT NOT NULL,
  description TEXT,
  price_kobo INTEGER NOT NULL CHECK(price_kobo >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  category TEXT,
  emoji TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','active','inactive')),
  is_affiliate INTEGER NOT NULL DEFAULT 0,
  affiliate_link TEXT,
  commission_pct REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK(status IN ('PENDING_PAYMENT','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED','FAILED')),
  total_kobo INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_ref TEXT UNIQUE,
  fulfilment_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price_kobo INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  vendor_id TEXT,
  is_affiliate INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  paystack_ref TEXT UNIQUE,
  amount_kobo INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','success','failed','abandoned')),
  mode TEXT NOT NULL DEFAULT 'test' CHECK(mode IN ('demo','test','live')),
  raw_json TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  product_id TEXT,
  vendor_id TEXT,
  affiliate_user_id TEXT,
  gross_kobo INTEGER NOT NULL,
  platform_kobo INTEGER NOT NULL DEFAULT 0,
  vendor_kobo INTEGER NOT NULL DEFAULT 0,
  affiliate_kobo INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'estimated' CHECK(status IN ('estimated','confirmed','paid')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  affiliate_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(paystack_ref);
`);

console.log('Database initialized at', dbPath);
db.close();
