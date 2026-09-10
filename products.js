const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public catalogue — approved + active + in stock preferred for Amara
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, v.business_name as vendor_name
    FROM products p
    LEFT JOIN vendors v ON v.id = p.vendor_id
    WHERE p.status IN ('approved','active')
    ORDER BY p.created_at DESC
  `).all();
  res.json({ products: rows.map(formatProduct) });
});

router.get('/:id', (req, res) => {
  const p = db.prepare(`
    SELECT p.*, v.business_name as vendor_name FROM products p
    LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ?
  `).get(req.params.id);
  if (!p || !['approved','active'].includes(p.status)) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product: formatProduct(p) });
});

// Vendor creates product (pending approval)
router.post('/', authRequired, requireRole('vendor', 'admin'), (req, res) => {
  const { name, description, price_naira, category, stock, emoji } = req.body || {};
  if (!name || price_naira == null || price_naira < 0) {
    return res.status(400).json({ error: 'Name and non-negative price required' });
  }
  const vendor = db.prepare('SELECT id FROM vendors WHERE user_id = ? AND status = ?').get(req.user.id, 'approved');
  if (!vendor && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Approved vendor profile required' });
  }
  const id = uuid();
  const price_kobo = Math.round(Number(price_naira) * 100);
  db.prepare(`
    INSERT INTO products (id, vendor_id, name, description, price_kobo, category, stock, emoji, status)
    VALUES (?,?,?,?,?,?,?,?, 'pending')
  `).run(id, vendor ? vendor.id : null, name, description || '', price_kobo, category || null, stock || 0, emoji || '📦');
  res.status(201).json({ id, status: 'pending' });
});

router.patch('/:id/approve', authRequired, requireRole('admin'), (req, res) => {
  db.prepare(`UPDATE products SET status = 'active', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

function formatProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price_kobo / 100,
    price_kobo: p.price_kobo,
    currency: p.currency || 'NGN',
    category: p.category,
    emoji: p.emoji,
    stock: p.stock,
    status: p.status,
    vendor: p.vendor_name,
    vendor_id: p.vendor_id,
    is_affiliate: !!p.is_affiliate,
    commission_pct: p.commission_pct
  };
}

module.exports = router;
