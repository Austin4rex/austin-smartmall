# Stage 11 — Deployment Report

## Deployment audit (existing project)

| Item | Finding |
|------|---------|
| Frontend | Single file `austin-smart-mall.html` — static host OK |
| Backend | Node 18+, Express, `npm start`, listens on `PORT` |
| DB today | **SQLite** via better-sqlite3 (`data/austin.db`) |
| SQLite safe for production? | **Only** on hosts with **persistent disk** (VPS). **Not** safe on ephemeral serverless deploys |
| Recommended before scale LIVE | **PostgreSQL / Supabase** |
| Health | `GET /health` → `{status:ok}` ; `GET /api/health` |
| Webhook route | `POST /api/webhooks/paystack` |
| Secrets in frontend | **None** (by design) |
| LIVE Paystack | **Not activated** |

## Final status

| Area | Status |
|------|--------|
| FRONTEND | **PASS** (static deployable; set API_BASE to production URL) |
| BACKEND | **PASS** (deployable Node app; PORT/CORS/helmet/rate-limit) |
| DATABASE | **PARTIAL** — SQLite OK for early TEST on VPS; Postgres recommended for multi-user LIVE |
| HTTPS | **NEEDS OWNER ACTION** — enable TLS on host |
| DOMAIN | **NEEDS OWNER ACTION** — purchase + DNS |
| PAYSTACK TEST | **NEEDS OWNER ACTION** — your TEST keys + one online verified payment |
| WEBHOOK | **PARTIAL** — route ready; register URL in Paystack dashboard |
| SECURITY | **PASS** with correct env (CORS, no secrets in FE, server verify) |
| BACKUPS | **NEEDS OWNER ACTION** — schedule file or Postgres backups |

## What the builder completed

- Production-oriented `server.js` (`/health`, CORS from env, rate limits, PORT)
- Updated `.env.example` and `package.json` dependencies list
- Full **DEPLOYMENT.md** (install, env, domain DNS, HTTPS, webhook, backups, TEST sequence)
- Clear SQLite vs PostgreSQL guidance
- No LIVE switch, no invented domain/credentials

## What you must personally configure

```
[ ] Choose host (VPS with disk, or Railway/Render + managed Postgres)
[ ] npm install && set .env on the server
[ ] Deploy backend; confirm https://api…/health
[ ] Host frontend on HTTPS; set ASM_API_BASE / localStorage API URL
[ ] Create/buy domain (optional for first TEST on provider URLs)
[ ] DNS A/CNAME for site + api
[ ] Paystack account → TEST keys in server .env only
[ ] Register webhook URL in Paystack (TEST)
[ ] Complete one phone TEST order → PAID in DB
[ ] Enable automated backups
```

## Accounts you need (external)

1. **Hosting** (VPS or PaaS)  
2. **Paystack** (TEST keys free to start; business verification for LIVE later)  
3. **Domain registrar** (optional at first)  
4. **PostgreSQL provider** (when leaving single-server SQLite)  

## What will cost money (typical)

| Item | When |
|------|------|
| Domain (.com / .ng) | When you want a branded URL |
| VPS or PaaS | When API is online 24/7 |
| Postgres managed | When scaling beyond single SQLite file |
| Paystack | Transaction fees on real charges (TEST is free to verify flow) |

No charge is required just to keep developing locally.

## Exact deployment sequence

1. Create hosting account with **persistent storage** (or Postgres)  
2. Deploy `austin-backend`, set env, `npm start`, check `/health`  
3. Deploy frontend HTML on HTTPS  
4. Point `API_BASE` at API HTTPS URL  
5. Paystack TEST keys + webhook  
6. Phone: full TEST checkout → server verify → order in DB  
7. Backups  
8. **Only then** plan LIVE + business verification  

## Important

Austin SmartMall is **not live** merely because deployment docs exist.  
It becomes a real online TEST system when **your** host, HTTPS, and a **verified TEST payment** work end-to-end.

**Do not switch Paystack to LIVE in this stage.**

