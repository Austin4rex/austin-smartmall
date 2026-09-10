require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Ensure DB schema exists on boot
require('./db/init');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.set('trust proxy', 1);
app.use(helmet());

// Production: set CORS_ORIGIN to your frontend origin, e.g. https://austinsmartmall.com
// Do not use * with credentials in production.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(',').map(s => s.trim()) : (NODE_ENV === 'production' ? false : true),
  credentials: true
}));

// Paystack webhook — raw body for signature verification
// Production URL example: https://api.yourdomain.com/api/webhooks/paystack
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 200 : 500,
  standardHeaders: true,
  legacyHeaders: false
}));

// Minimal health (hosting probes) — no secrets
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Detailed health for operators (still no secrets)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'austin-smartmall-backend',
    env: NODE_ENV,
    mode: process.env.PAYSTACK_MODE || 'test',
    has_paystack_secret: !!(process.env.PAYSTACK_SECRET_KEY && !String(process.env.PAYSTACK_SECRET_KEY).includes('xxxxxxxx')),
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Austin Smart Mall API listening on port ${PORT}`);
  console.log(`NODE_ENV=${NODE_ENV} PAYSTACK_MODE=${process.env.PAYSTACK_MODE || 'test'}`);
});
