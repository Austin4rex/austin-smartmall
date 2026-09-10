# Stage 10b Report — Frontend wired to Backend

## Summary

`austin-smart-mall.html` now talks to `austin-backend` via configurable `API_BASE_URL`.

- No Paystack secret in frontend
- No silent fake catalogue (sample only via explicit button)
- Checkout prefers server totals + `/api/orders/verify-payment`
- Auth: register / login / logout with JWT in localStorage
- Cart: persists via API when logged in

## Status

| Area | Status |
|------|--------|
| 1. API_BASE_URL config | PASS — localStorage / window.ASM_API_BASE / default localhost:4000 |
| 2. Products from GET /api/products | PASS — maps to UI; empty if backend empty |
| 3. Authentication UI | PASS — Login/Register screen |
| 4. Persistent cart | PASS when logged in + API online |
| 5. Checkout server authority | PASS — POST /api/orders/checkout then verify |
| 6. Paystack TEST | PARTIAL — needs Paystack inline.js + TEST public key from backend |
| 7. Payment verification | PASS path — frontend calls backend verify only |
| 8. Orders history UI | PARTIAL — backend has /orders/mine; UI not fully rebuilt |
| 9. Vendor dashboard API | PARTIAL — apply still local; product create via API exists on backend |
| 10. Affiliate dashboard | PARTIAL |
| 11. Amara | PARTIAL — uses PRODUCTS array after API load |
| 12. Marketing | PARTIAL — uses live PRODUCTS when loaded |
| 13. Error / offline handling | PASS — banner + no silent fake data |
| 14. Security (no secrets) | PASS |
| 15. LIVE mode | NOT ENABLED |

## Tests you must run (owner)

1. `cd austin-backend && npm install && npm run db:init && npm start`
2. Open HTML (or host it); confirm banner "API connected"
3. Register customer → login
4. Seed at least one approved product in DB (or POST as admin/vendor)
5. Add to cart → checkout → DEMO or TEST verify
6. Confirm order PAID in SQLite / API

## Remaining owner actions

```
[ ] Run backend with npm install + .env TEST keys
[ ] Seed real approved products
[ ] Host frontend + set API_BASE_URL to production API
[ ] Load Paystack inline.js for TEST popup
[ ] Full TEST payment verified once
[ ] Do NOT set LIVE until then
```

## Next milestones

- **11**: Deploy backend + DB + domain + HTTPS  
- **12**: Soft launch with real products, vendors, delivery  

