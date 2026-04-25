# Basilico Production Handover

## Client
- Restaurant: Basilico
- Address: Banmästaregatan 2, Tomelilla 273 34, Sweden
- Phone: 0417-13 13 3
- Language: Swedish
- Concept: Italian restaurant with Swedish/local ingredient influence

## Implemented Routes
- Public: `/`, `/menu`, `/menu/basilico`, `/dish/[dishSlug]`, `/login`, `/portal`, `/review`, `/validation`, `/403`, `/404`
- Admin: `/admin`, `/admin/orders`, `/admin/assistance`, `/admin/menu`, `/admin/menu/categories`, `/admin/menu/dishes`, `/admin/tables`, `/admin/users`, `/admin/settings`
- Kitchen: `/kitchen`
- API: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/public/menu`, `/api/orders`, `/api/assistance`, `/api/admin/menu/*`, `/api/kitchen/orders`

## Database
- PostgreSQL is required.
- Prisma schema includes restaurant profile fields, users, roles, sessions, menu releases, categories, dishes, tables, orders, order item snapshots, assistance requests, audit logs, and login events.
- Migrations must be applied with `npm run prisma:migrate:deploy`.
- The Basilico menu seed can be loaded with `npm run seed:menu` after migrations. The runtime also creates an initial published menu on first menu/admin read if no release exists.
- SQLite and local database files are ignored and must not be used.

## Environment Variables
- `DATABASE_URL`
- `RESTAURANT_NAME`
- `RESTAURANT_SLUG`
- `RESTAURANT_DOMAIN`
- `FALLBACK_DOMAIN`
- `DOMAIN_MODE`
- `VERCEL_PROJECT_NAME`
- `AUTH_PASSWORD_PEPPER`
- `SESSION_COOKIE_NAME`
- `SESSION_TTL_HOURS`
- `AUTH_BOOTSTRAP_ADMIN_USERNAME`
- `AUTH_BOOTSTRAP_ADMIN_PASSWORD`
- `AUTH_BOOTSTRAP_ADMIN_DISPLAY_NAME`
- `AUTH_BOOTSTRAP_KITCHEN_USERNAME`
- `AUTH_BOOTSTRAP_KITCHEN_PASSWORD`
- `AUTH_BOOTSTRAP_KITCHEN_DISPLAY_NAME`
- `UPLOADS_BASE_DIR`
- `UPLOADS_PUBLIC_BASE_PATH`
- `UPLOADS_MAX_IMAGE_BYTES`
- `INTERNAL_ENVIRONMENT_LABEL`

## Vercel Deployment
1. Create a dedicated Vercel project for Basilico.
2. Add a dedicated PostgreSQL database and set `DATABASE_URL`.
3. Add all auth and restaurant environment variables from `.env.example`.
4. Use strong non-placeholder bootstrap passwords and a strong `AUTH_PASSWORD_PEPPER`.
5. Run `npm run prisma:migrate:deploy`.
6. Run `npm run seed:menu` against the production database.
7. Deploy with `npm run build`.
8. Verify public menu, login, admin, kitchen, and protected API behavior.

## Exact Deployment Commands
Run locally before deployment:
```bash
npm ci
npm run prisma:validate
npm run typecheck
npm run lint
npm run build
```

Prepare the Vercel project:
```bash
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

Apply schema and seed menu after Vercel env is configured:
```bash
vercel env pull .env.production.local --environment=production
npm run prisma:migrate:deploy
npm run seed:menu
```

Deploy:
```bash
vercel --prod
```

Do not run `prisma db push` against production. Do not reset the production database.

## Production Infrastructure Readiness Checklist
- Create a dedicated Vercel project for Basilico only.
- Create a dedicated PostgreSQL database for Basilico only.
- Set `DATABASE_URL` to a `postgresql://` or `postgres://` URL. SQLite, `file:`, local DB files, and shared client databases are not allowed.
- Set `RESTAURANT_DOMAIN` or `FALLBACK_DOMAIN`; app metadata uses these values for the production base URL.
- Set `INTERNAL_ENVIRONMENT_LABEL=production` for production.
- Set `AUTH_PASSWORD_PEPPER` to a strong secret value before production startup.
- Replace `AUTH_BOOTSTRAP_ADMIN_PASSWORD` and `AUTH_BOOTSTRAP_KITCHEN_PASSWORD` with strong non-placeholder passwords.
- Keep all secret values server-only. Do not create `NEXT_PUBLIC_` variables for database, auth, bootstrap, pepper, or provisioning values.
- Run `npm run prisma:migrate:deploy` against the production PostgreSQL database. Do not use `prisma db push` for production.
- Run `npm run seed:menu` after migrations to load Basilico menu data.
- Keep `siteConfig.orderingMode` and Basilico `orderingMode` as `browsing-only` until the ordering activation checklist is completed.
- Verify `/` and `/api/public/menu` work without login.
- Verify `/portal`, `/admin`, `/kitchen`, `/api/admin/*`, `/api/kitchen/*`, and `/api/internal/*` reject unauthenticated requests.
- Verify `.vercelignore` excludes `.env`, `.env.*`, artifacts, tmp files, and local SQLite/database files.
- Confirm local filesystem uploads are not treated as durable production storage on Vercel before enabling admin image upload workflows.
- Treat `UPLOADS_BASE_DIR` as a non-critical admin upload path. Public menu rendering uses committed assets and does not require runtime local file writes.

## Security Notes
- Public menu is open.
- Portal, admin, kitchen, admin APIs, kitchen APIs, and internal APIs are protected.
- Server-side role checks are required for protected pages and APIs.
- Login is rate-limited through database-backed login events.
- Public order and assistance endpoints are rate-limited.
- Secrets and credentials must stay in environment variables.
- Online ordering is disabled by `siteConfig.orderingMode = "browsing-only"` and Basilico branding `orderingMode = "browsing-only"`.

## Ordering Activation Checklist
- PostgreSQL production database is connected.
- Migrations are deployed.
- Published menu data exists in production.
- Admin login works.
- Kitchen login works.
- Protected pages redirect without session.
- Protected APIs return `401` without session.
- Role enforcement for ADMIN and KITCHEN is verified.
- Public order creation is tested against production database.
- Kitchen receives orders.
- Status updates work end to end.
- Duplicate order prevention works.
- Test order cleanup is safe.
- Mobile QR test is completed.
- Only then switch ordering mode from `browsing-only` to `enabled`.

## Current Limitations
- Online ordering is intentionally disabled.
- Alcohol is informational only.
- Some dessert, child menu, and drink entries are conservative placeholders where the public menu images did not expose a complete price list.
- Gallery images are used as general Basilico atmosphere only and are not tied to exact dishes.
