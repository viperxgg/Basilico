# Basilico Final Handover

Internal delivery document for the Basilico Nord Menu deployment. Do not store real passwords, database credentials, or secret values in this file.

## 1. Project Summary

Basilico is a dedicated one-restaurant Nord Menu deployment for Basilico in Tomelilla, Sweden.

- Stack: Next.js App Router, TypeScript, Prisma, PostgreSQL, Vercel.
- Public experience: mobile-first Swedish menu for QR access.
- Operations: protected admin, kitchen, and portal surfaces.
- Data model: restaurant profile, opening hours, menu releases, categories, dishes, prices, allergens, dietary flags, gallery references, users, roles, sessions, orders, assistance requests, and audit records.
- Production rule: PostgreSQL only. No SQLite, local temporary order storage, or frontend secrets.

## 2. Live URL Placeholders

Replace `https://BASILICO_DEPLOYMENT_URL` after production deployment.

- Public site: `https://BASILICO_DEPLOYMENT_URL/`
- Public menu: `https://BASILICO_DEPLOYMENT_URL/menu`
- Admin: `https://BASILICO_DEPLOYMENT_URL/admin`
- Kitchen: `https://BASILICO_DEPLOYMENT_URL/kitchen`
- Login: `https://BASILICO_DEPLOYMENT_URL/login`

## 3. Current Status

- Browsing menu is active for public customers.
- Online ordering is disabled.
- Public menu does not require login.
- Admin, kitchen, portal, admin APIs, kitchen APIs, and internal APIs are protected.
- PostgreSQL is required for production and production-like testing.
- Alcohol/dryck content is informational only unless later approved for compliant ordering.
- Gallery images are general Basilico atmosphere images and are not attached to specific dishes.

## 4. How To Update Menu Data

Preferred source files for static/menu seed updates:

- `data/restaurants/basilico.ts` for Basilico profile, address, phone, opening hours, gallery references, and ordering mode.
- `data/categories.ts` for menu categories, labels, sort order, and descriptions.
- `data/dishes.ts` for dish names, descriptions, ingredients, allergens, dietary flags, prices, availability, and sort order.
- `scripts/seed-basilico-menu.mjs` for database seeding behavior.

Operational menu updates after database setup:

- Use `/admin/menu`, `/admin/menu/categories`, and `/admin/menu/dishes` after admin login.
- Publish changes through menu releases.
- Do not attach photos directly to menu items unless Basilico explicitly approves the mapping.
- After data file changes, run `npm run seed:menu` against the target PostgreSQL database.

## 5. How To Deploy

Local preflight:

```powershell
npm ci
npm run prisma:validate
npm run typecheck
npm run lint
npm run build
```

Vercel setup:

```powershell
vercel link --project nord-basilico
vercel env add DATABASE_URL production
vercel env add RESTAURANT_NAME production
vercel env add RESTAURANT_SLUG production
vercel env add RESTAURANT_DOMAIN production
vercel env add FALLBACK_DOMAIN production
vercel env add DOMAIN_MODE production
vercel env add VERCEL_PROJECT_NAME production
vercel env add AUTH_PASSWORD_PEPPER production
vercel env add AUTH_BOOTSTRAP_ADMIN_USERNAME production
vercel env add AUTH_BOOTSTRAP_ADMIN_PASSWORD production
vercel env add AUTH_BOOTSTRAP_ADMIN_DISPLAY_NAME production
vercel env add AUTH_BOOTSTRAP_KITCHEN_USERNAME production
vercel env add AUTH_BOOTSTRAP_KITCHEN_PASSWORD production
vercel env add AUTH_BOOTSTRAP_KITCHEN_DISPLAY_NAME production
vercel env add SESSION_COOKIE_NAME production
vercel env add SESSION_TTL_HOURS production
vercel env add INTERNAL_ENVIRONMENT_LABEL production
```

Deploy:

```powershell
vercel --prod
```

Do not run `prisma db push` in production. Do not reset production data.

## 6. Required Environment Variables

Required production variables:

- `DATABASE_URL`: PostgreSQL connection string only.
- `RESTAURANT_NAME`: `Basilico`.
- `RESTAURANT_SLUG`: `basilico`.
- `RESTAURANT_DOMAIN`: production domain if available.
- `FALLBACK_DOMAIN`: fallback production domain.
- `DOMAIN_MODE`: deployment domain mode.
- `VERCEL_PROJECT_NAME`: Vercel project identifier.
- `AUTH_PASSWORD_PEPPER`: strong server-side secret.
- `AUTH_BOOTSTRAP_ADMIN_USERNAME`: bootstrap admin username.
- `AUTH_BOOTSTRAP_ADMIN_PASSWORD`: strong bootstrap admin password.
- `AUTH_BOOTSTRAP_ADMIN_DISPLAY_NAME`: admin display name.
- `AUTH_BOOTSTRAP_KITCHEN_USERNAME`: bootstrap kitchen username.
- `AUTH_BOOTSTRAP_KITCHEN_PASSWORD`: strong bootstrap kitchen password.
- `AUTH_BOOTSTRAP_KITCHEN_DISPLAY_NAME`: kitchen display name.
- `SESSION_COOKIE_NAME`: Basilico session cookie name.
- `SESSION_TTL_HOURS`: session duration.
- `INTERNAL_ENVIRONMENT_LABEL`: `production` for production.

Optional/admin variables:

- `AUTH_BOOTSTRAP_ADMIN_EMAIL`
- `UPLOADS_BASE_DIR`
- `UPLOADS_PUBLIC_BASE_PATH`
- `UPLOADS_MAX_IMAGE_BYTES`
- `DIRECT_URL` when a direct migration connection is required.
- `POSTGRES_ADMIN_URL` for controlled database provisioning only.

Never expose secrets through `NEXT_PUBLIC_*` variables.

## 7. How To Run Migrations

After Vercel env values are configured:

```powershell
vercel env pull .env.production.local --environment=production
npm run prisma:migrate:deploy
```

Rules:

- Use PostgreSQL only.
- Use migration deploy, not `db push`.
- Do not run destructive resets.
- Confirm migration status before client demo.

## 8. How To Seed Menu

After migrations:

```powershell
npm run seed:menu
```

Seed expectations:

- Creates or updates Basilico restaurant profile/menu data.
- Keeps ordering mode as `browsing-only`.
- Repeated runs must not duplicate menu data.
- Public menu should show Basilico categories, prices in SEK, opening hours, allergens, and phone CTA.

## 9. How To Test Login

Manual checks:

- Open `/login`.
- Log in with the production admin account from the approved secret manager.
- Confirm admin can access `/admin` and admin menu pages.
- Log out.
- Log in with the production kitchen account from the approved secret manager.
- Confirm kitchen can access `/kitchen`.
- Confirm kitchen cannot access `/admin`; expected result is `403` or a safe redirect.
- Confirm unauthenticated `/portal`, `/admin`, and `/kitchen` do not expose protected content.
- Confirm invalid login shows a generic error only.

Do not write real passwords into docs, chat, tickets, screenshots, or source code.

## 10. Smoke Test Checklist

Use the full smoke test document:

- `docs/basilico-production-smoke-test.md`

Minimum checks before handover:

- `/` loads without login.
- `/menu` loads without login.
- `/403` and `/404` render safely.
- `/admin`, `/kitchen`, and `/portal` reject unauthenticated access.
- `/api/admin/*`, `/api/kitchen/*`, and `/api/internal/*` reject unauthenticated access.
- `/api/public/menu` returns safe public data only.
- `/api/public/orders` returns `403` while ordering is disabled.
- Mobile QR flow opens `/menu` and remains usable.
- Browser console shows no hydration or runtime errors.

## 11. Before Enabling Ordering

Use the full readiness document:

- `docs/basilico-ordering-readiness.md`

Ordering must stay disabled until all of these are verified:

- PostgreSQL production database is live.
- Prisma migrations are deployed.
- Basilico seed is complete.
- Admin login is verified.
- Kitchen login is verified.
- Protected route and role checks pass.
- A controlled test order reaches the kitchen.
- Kitchen status updates work.
- Duplicate prevention works.
- Table labels and QR parameters match the restaurant layout.
- Mobile QR flow is tested on real devices.
- Basilico gives explicit client approval.

Only after this checklist passes, change both ordering gates from `browsing-only` to `enabled`:

- `lib/config/site.ts`
- `data/restaurants/basilico.ts`

## 12. Known Risks And Recommendations

- Live PostgreSQL connectivity must be verified before any production demo involving admin/kitchen state.
- Bootstrap passwords must be rotated to strong client-approved values before production use.
- Local upload storage is not durable on Vercel; do not rely on it for production-critical image management without external storage.
- Brochure/preview pages are not part of the customer route contract and should not be shared as client URLs.
- Alcohol remains informational only unless legal/compliance approval is provided for ordering.
- Ordering activation should not happen during restaurant service hours without rollback ownership.
- Keep backups and recovery planning in place before accepting real orders.

## 13. Client-Friendly Swedish Summary

Basilico har nu en digital meny som gäster kan öppna direkt via QR-kod utan inloggning. Menyn visar rätter, priser, allergener, öppettider, kontaktuppgifter och en tydlig knapp för att ringa restaurangen.

Onlinebeställning är inte aktiverad ännu. Det är ett medvetet säkerhetsval tills databas, inloggning, behörigheter, köksvy och hela orderflödet är testat i produktion.

Admin- och köksytor är skyddade med inloggning. När Basilico vill aktivera onlinebeställning krävs en separat godkänd genomgång där testorder, köksstatus, bordsetiketter och mobil QR-användning verifieras.
