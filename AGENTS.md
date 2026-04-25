# Basilico Client Workspace

## Inheritance
- Follow root `C:\Users\azzam\Documents\Nord App\AGENTS.md`.
- This file adds client-specific context for Basilico only.

## Scope
- Production-ready Nord Menu workspace for Basilico in Tomelilla, Sweden.
- Public QR menu is open and browsing-only until PostgreSQL, auth, authorization, and order persistence are verified.
- Admin, kitchen, and portal routes are protected.

## Client Identity
- Restaurant: Basilico.
- Address: Banmästaregatan 2, Tomelilla 273 34, Sweden.
- Phone: 0417-13 13 3.
- Concept: Italian food with Swedish/local ingredient influence.
- Language: Swedish.

## Guardrails
- No SQLite or temporary production persistence.
- Do not commit `.env*`, cookies, generated credentials, or provisioning artifacts.
- Do not bind gallery photos directly to individual menu items without explicit client approval.
- Alcohol is informational only unless compliant online ordering is explicitly approved.
- Keep `restaurant_id` scoping intact and preserve immutable order snapshots.

## Delivery Notes
- Ordering must stay disabled until the activation checklist in `docs/basilico-production-handover.md` is complete.
- Menu content is seeded from the Basilico website and visible menu images, with assumptions kept conservative where prices or ingredients were not visible.
