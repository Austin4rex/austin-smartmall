const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function getOrCreateCart(userId) {
  let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
  if (!cart) {
    const id = uuid();
    db.prepare('INSERT INTO carts (id, user_id) VALUES (?,?)').run(id, userId);
    cart = { id, user_id: userId };
  }
  return cart;
}

router.get('/', authRequired, (req, res) => {
  const cart = getOrCreateCart(req.user.id);
  const items = db.prepare(`
    SELECT ci.quantity, p.id as product_id, p.name, p.price_kobo, p.emoji, p.stock
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ?
  `).all(cart.id);
  const total_kobo = items.reduce((s, i) => s + i.price_kobo * i.quantity, 0);
  res.json({
    items: items.map(i => ({ ...i, price: i.price_kobo / 100, line_total: (i.price_kobo * i.quantity) / 100 })),
    total: total_kobo / 100,
    total_kobo
  });
});

router.post('/items', authRequired, (req, res) => {
  const { product_id, quantity = 1 } = req.body || {};
  if (!product_id) return res.status(400).json({ error: 'product_id required' });
  const product = db.prepare(`SELECT * FROM products WHERE id = ? AND status IN ('approved','active')`).get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not available' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  const cart = getOrCreateCart(req.user.id);
  const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cart.id, product_id);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?,?,?,?)')
      .run(uuid(), cart.id, product_id, quantity);
  }
  db.prepare(`UPDATE carts SET updated_at = datetime('now') WHERE id = ?`).run(cart.id);
  res.json({ ok: true });
});

router.delete('/items/:productId', authRequired, (req, res) => {
  const cart = getOrCreateCart(req.user.id);
  db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?').run(cart.id, req.params.productId);
  res.json({ ok: true });
});

module.exports = router;
