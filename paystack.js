/**
 * Paystack server-side helpers.
 * SECRET KEY must only live in process.env — never sent to clients.
 */
const PAYSTACK_BASE = 'https://api.paystack.co';

function getSecret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || key.includes('xxxxxxxx')) {
    return null;
  }
  return key;
}

async function verifyTransaction(reference) {
  const secret = getSecret();
  if (!secret) {
    return { ok: false, error: 'PAYSTACK_SECRET_KEY not configured on server' };
  }
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` }
  });
  const data = await res.json();
  if (!data.status) {
    return { ok: false, error: data.message || 'Verification failed', raw: data };
  }
  return { ok: true, data: data.data };
}

function verifyWebhookSignature(rawBody, signature) {
  // Paystack signs with HMAC SHA512 of body using secret key
  const crypto = require('crypto');
  const secret = getSecret();
  if (!secret || !signature) return false;
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  return hash === signature;
}

module.exports = { verifyTransaction, verifyWebhookSignature, getSecret };
