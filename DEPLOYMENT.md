# Austin Smart Mall — Deployment Guide (Stage 11)

**Do not put secrets in this file or in the frontend.**  
**Do not activate Paystack LIVE until a verified TEST payment succeeds online.**

---

## 1. Prerequisites

| Item | Requirement |
|------|-------------|
| Node.js | **18+** (20 LTS recommended) |
| npm | 9+ |
| Backend code | `austin-backend/` |
| Frontend | `austin-smart-mall.html` |
| Accounts (you create) | Hosting, domain (optional at first), Paystack TEST |

---

## 2. Architecture recommendation

```
Phone / browser
  → Frontend (static HTTPS host)
  → Backend API (Node on HTTPS)
  → Database
  → Paystack (TEST first)
```

### SQLite vs PostgreSQL

| | SQLite (current) | PostgreSQL / Supabase |
|--|------------------|------------------------|
| Best for | Single VPS, early TEST | Multi-instance, real production |
| Persistent disk | Required (not ephemeral container FS) | Managed |
| Concurrent writes | Limited | Strong |

**Recommendation:**  
- **Early online TEST:** SQLite on a **VPS with persistent disk** (e.g. DigitalOcean droplet, Linode, Hetzner) is acceptable.  
- **Before multi-user LIVE scale:** migrate to **PostgreSQL** (Supabase, Neon, Railway Postgres, or managed Postgres on the same VPS).  
Do **not** deploy SQLite on hosts that wipe the filesystem on every deploy (many serverless/ephemeral platforms).

---

## 3. Install & run backend (any host)

```bash
cd austin-backend
npm install
cp .env.example .env
# Edit .env — JWT_SECRET, Paystack TEST keys, CORS_ORIGIN
npm run db:init
npm start
```

Health checks:

- `GET /health` → `{ "status": "ok" }`
- `GET /api/health` → status, mode, has_paystack_secret (boolean only)

The process **must** listen on `process.env.PORT` (hosting providers inject this).

---

## 4. Environment variables (backend only)

| Variable | Required | Notes |
|----------|----------|-------|
| `PORT` | Auto on most hosts | Do not hard-code in production |
| `NODE_ENV` | Yes | `production` |
| `JWT_SECRET` | Yes | Long random; never commit |
| `DATABASE_PATH` | SQLite only | Persistent path |
| `DATABASE_URL` | Postgres later | When you migrate |
| `CORS_ORIGIN` | Yes in prod | Your frontend HTTPS origin |
| `PAYSTACK_PUBLIC_KEY` | Yes | `pk_test_…` first |
| `PAYSTACK_SECRET_KEY` | Yes | `sk_test_…` **server only** |
| `PAYSTACK_MODE` | Yes | `test` until verified |
| `PAYSTACK_WEBHOOK_SECRET` | Optional | If you set one |

**Never** put `PAYSTACK_SECRET_KEY` or `JWT_SECRET` in HTML/JS frontend.

---

## 5. Frontend production configuration

1. Host `austin-smart-mall.html` on any static HTTPS host (Netlify, Cloudflare Pages, S3+CloudFront, same VPS nginx, etc.).
2. Set API base to your **deployed** backend:

```js
// In browser console once, or build a small config:
localStorage.setItem('ASM_API_BASE', 'https://api.yourdomain.com');
location.reload();
```

Or before load:

```html
<script>window.ASM_API_BASE = 'https://api.yourdomain.com';</script>
```

3. Confirm banner shows **API connected** (not localhost).

---

## 6. Domain (owner action)

Example names (you choose and purchase):

- Marketing site: `austinsmartmall.com` or `austinsmartmall.ng`
- API subdomain: `api.austinsmartmall.com`

**DNS (typical):**

| Record | Name | Value |
|--------|------|--------|
| A / CNAME | `@` or `www` | Frontend host IP or provider target |
| A / CNAME | `api` | Backend host IP or provider target |

The builder **cannot** purchase the domain for you.

---

## 7. HTTPS

- Frontend and API must both be **HTTPS**.
- Browsers block mixed content (HTTPS page → HTTP API).
- Use Let’s Encrypt (Certbot on VPS) or the host’s free TLS (Netlify, Cloudflare, Railway, Render).

**Do not** take card payments over plain HTTP.

---

## 8. Paystack webhook (TEST)

After backend is on HTTPS:

1. Paystack Dashboard → Settings → API Keys & Webhooks  
2. Webhook URL:  
   `https://api.yourdomain.com/api/webhooks/paystack`  
3. Keep **TEST** mode.  
4. Signature verification uses `PAYSTACK_SECRET_KEY` (HMAC SHA512) in `src/services/paystack.js`.

Path matches Stage 10 route: `/api/webhooks/paystack`.

---

## 9. CORS & security

- Set `CORS_ORIGIN` to exact frontend origin(s).  
- Helmet + rate limit enabled.  
- JWT in `Authorization: Bearer` header.  
- Order totals and stock only trusted from server.  
- Errors return generic messages to clients.

---

## 10. Staging / TEST sequence (mandatory before LIVE)

1. Deploy backend + frontend on HTTPS  
2. `PAYSTACK_MODE=test` + TEST keys only  
3. Phone: register → login → product → cart → checkout → Paystack TEST  
4. Server `verify-payment` succeeds  
5. Order `PAID` in database; stock reduced  
6. Refresh page — order still present  

Only then consider LIVE keys + business verification with Paystack.

---

## 11. Backups

### SQLite (single VPS)

```bash
# While app is running (WAL mode):
cp data/austin.db backups/austin-$(date +%Y%m%d).db
# Or use sqlite3 .backup
```

Automate daily copy off-box (S3, another server).

### PostgreSQL / Supabase (recommended later)

- Provider dashboard → Backups / Point-in-time recovery  
- Or `pg_dump` on a schedule  

Export important tables: users, products, orders, payments, vendors, commissions.

---

## 12. Troubleshooting

| Symptom | Check |
|---------|--------|
| API banner offline | CORS_ORIGIN, HTTPS, firewall, correct API URL |
| Login fails | JWT_SECRET set, DB initialized |
| Checkout fails | Logged in, product approved+active, stock > 0 |
| Verify fails | SECRET key, reference, amount/NGN match |
| Data lost on redeploy | Ephemeral disk — move to VPS volume or Postgres |

---

## 13. Production launch procedure (checklist)

```
[ ] Backend deployed, /health returns ok
[ ] Frontend on HTTPS, API_BASE points to API
[ ] CORS_ORIGIN set
[ ] Paystack TEST keys only
[ ] Webhook URL registered (TEST)
[ ] Full phone TEST order verified and persisted
[ ] Backup job configured
[ ] Legal pages reviewed by you/lawyer
[ ] Support WhatsApp/email real
[ ] Paystack business verification (for LIVE later)
[ ] LIVE keys only after all above
```

