# Basilico Ordering Readiness Plan

This document defines the checks that must pass before Basilico online ordering can be activated. Ordering is intentionally disabled today.

## Current Ordering State

- `siteConfig.orderingMode` is `browsing-only`.
- `basilicoBranding.orderingMode` is `browsing-only`.
- Public menu pages present the menu, search, categories, prices, allergens, opening hours, and phone CTA without enabling cart checkout.
- `/review` renders an ordering-disabled notice while browsing-only mode is active.
- `/api/orders` and `/api/public/orders` return `403` before payload parsing or persistence while browsing-only mode is active.
- No payment feature is present or planned for this activation gate.

## Current Blocked Paths

- Config gate: `lib/config/site.ts` keeps ordering disabled globally.
- Restaurant profile gate: `data/restaurants/basilico.ts` keeps Basilico browsing-only.
- Public API gate: `app/api/orders/route.ts` blocks order creation when ordering is disabled.
- Public API alias: `app/api/public/orders/route.ts` reuses the same blocked order creation handler.
- Cart gate: `components/cart/cart-provider.tsx` hides the cart UI unless ordering is enabled.
- Review gate: `app/review/page.tsx` does not render the live review client unless ordering is enabled.
- Dish detail gate: `components/menu/dish-detail-order-panel.tsx` disables quantity, variant, and add controls while ordering is disabled.
- Menu card gate: `components/menu/menu-template-home.tsx` only passes add-to-cart behavior when ordering is enabled.

## Activation Checklist

- PostgreSQL production database is live and reachable from Vercel.
- `DATABASE_URL` points to PostgreSQL only, not SQLite or a local database.
- Prisma migrations have been deployed with `npm run prisma:migrate:deploy`.
- Basilico menu seed has completed with `npm run seed:menu`.
- Re-running `npm run seed:menu` does not duplicate menu data.
- Admin login is verified with a production ADMIN user.
- Kitchen login is verified with a production KITCHEN or allowed staff user.
- `/admin`, `/kitchen`, and `/portal` reject unauthenticated access.
- Admin can view order history without cross-restaurant data exposure.
- Kitchen can view the live order board.
- A test order can be created from the public flow after enabling ordering in a controlled test environment.
- The test order reaches the kitchen board.
- Kitchen status updates work for `new`, `accepted`, `preparing`, `ready`, `completed`, and `cancelled`.
- Duplicate prevention works for repeated submissions using the same `clientRequestId`.
- Table labels and QR table parameters are verified against the physical restaurant layout.
- Mobile QR flow is tested on iOS and Android phone viewports.
- Public UI copy is approved by Basilico.
- Client approval is received before changing ordering mode to `enabled`.

## Activation Risks

- Enabling ordering before live PostgreSQL verification can create lost or rejected orders.
- Enabling ordering before auth and role verification can expose operational order data.
- Test-only or preview copy must not be used on production table signage.
- Duplicate prevention is implemented in the order store but still needs an end-to-end production-like test.
- Table label mistakes can route orders to the wrong service context.
- Kitchen workflow must be tested on the actual tablet/mobile devices used by staff.
- Ordering should not be activated during service hours without rollback ownership.

## Required Activation Change

Only after every checklist item passes, change both ordering gates from `browsing-only` to `enabled`:

- `lib/config/site.ts`
- `data/restaurants/basilico.ts`

Then run the production smoke checklist in `docs/basilico-production-smoke-test.md`.
