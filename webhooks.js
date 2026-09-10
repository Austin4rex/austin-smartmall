const express = require('express');
const db = require('../db');
const { verifyWebhookSignature } = require('../services/paystack');

const router = express.Router();

// Raw body needed for signature — mounted with express.raw in server
router.post('/paystack', (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const raw = req.body; // Buffer when using express.raw
  const rawStr = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '');

  if (!verifyWebhookSignature(rawStr, signature)) {
    return res.status(401).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(rawStr);
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  // Idempotent handling
  if (event.event === 'charge.success') {
    const reference = event.data && event.data.reference;
    if (reference) {
      const payment = db.prepare('SELECT * FROM payments WHERE paystack_ref = ?').get(reference);
      if (payment && payment.status !== 'success') {
        // Mark for verification path — full finalize should still match amount
        // Prefer using the same finalize logic as verify-payment in production
        db.prepare(`UPDATE payments SET raw_json = ? WHERE id = ?`).run(rawStr, payment.id);
      }
    }
  }

  res.sendStatus(200);
});

module.exports = router;
