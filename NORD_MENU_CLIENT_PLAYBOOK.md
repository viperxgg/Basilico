# Nord Menu Client Production Playbook

This playbook captures the operating standard for Basilico's Nord Menu production deployment. Use it as the baseline for maintaining this client-specific restaurant implementation by Smart Art AI.

## 1. Project Philosophy

Every restaurant client must be treated as a real production system, not a demo. A client-facing menu is part of the restaurant's daily operation, so reliability and trust matter as much as visual polish.

Core principles:
- Stability first.
- Security first.
- PostgreSQL persistence before ordering.
- Mobile-first QR experience.
- No broken or unfinished flows.
- Minimal safe changes.
- Client-specific branding.
- Real handover readiness.

## 2. Standard Client Setup Flow

Recommended order for a new restaurant client:

1. Create a separate client project/repo or an isolated client configuration.
2. Add restaurant identity: name, slug, brand colors, language, opening hours, and public route contract.
3. Add structured menu data: categories, dishes, descriptions, prices, variants, tags, and availability.
4. Add images/assets only where they support the experience and do not confuse the menu.
5. Build the public QR menu as the primary customer entry point.
6. Protect admin, kitchen, portal, and internal APIs.
7. Configure PostgreSQL for production.
8. Run Prisma migrations.
9. Seed or publish menu data safely.
10. Enable ordering only after persistence is verified.
11. Run final QA across public, admin, kitchen, API, database, and mobile flows.
12. Prepare the client handover package.

## 3. Required Infrastructure

Every production client should have:
- GitHub repo or a clearly isolated client codebase.
- Vercel project.
- PostgreSQL database.
- `DATABASE_URL` configured in Vercel Production.
- Prisma schema and migrations.
- Production environment variables managed in Vercel, not in Git.
- `.gitignore` excluding `.env*`, `.vercel`, `.next`, `node_modules`, local DB files, generated artifacts, and build output.
- `.vercelignore` excluding local env files, local DB files, and handover/test artifacts.
- No SQLite or `/tmp` dependency for production data.

Production data must be durable across redeploys. Orders, sessions, users, menu releases, categories, dishes, order items, assistance requests, and logs/events must not depend on local serverless filesystem storage.

## 4. Security Standard

Security requirements:
- Public menu does not require login.
- Admin, kitchen, and portal require login.
- Internal APIs return `401` without a valid session.
- Role-based access is enforced for admin and kitchen users.
- Protected actions validate session, role, and restaurant context server-side.
- Public order and assistance APIs validate input server-side.
- Passwords are hashed.
- Logout invalidates the database session.
- Secrets are never exposed in frontend code.
- Secrets are never committed to GitHub.
- Rate limiting is used where appropriate, especially login, order submission, and assistance requests.
- Password rotation is required before handover.

Default client credentials must not live in code. Use environment variables and database-backed users/sessions.

## 5. Ordering Standard

Ordering must not be enabled until all of the following are true:
- PostgreSQL is confirmed in production.
- Prisma migrations are applied.
- Menu data exists in the production database.
- Admin login works.
- Kitchen login works.
- Admin, kitchen, portal, and internal APIs are protected.
- Order creation is tested against production.
- Kitchen receives the new order.
- Order status updates work.
- Duplicate order protection works.
- Test data can be cleaned safely without deleting real orders.

When ordering is enabled:
- Orders must preserve immutable item snapshots.
- `order_items` must preserve dish name, price, quantity, and relevant menu context.
- The customer should see a clear success state.
- Failed submissions must show a safe, non-technical message.
- Duplicate clicks must not create duplicate orders.

## 6. UX Standard

Customer-facing copy should be simple, natural, and suitable for restaurant guests. For Swedish clients, use clear Swedish.

Required customer messages:
- `Din beställning har skickats!`
- `Tack! Köket har mottagit din beställning.`
- `Något gick fel. Försök igen.`
- `Kontakta personalen om problemet kvarstår.`
- `Ange ett giltigt bordsnummer.`
- `Varukorgen är tom.`

Required UX behavior:
- Table number validation.
- Empty cart state.
- Loading states for add to cart and submit order.
- Disabled submit state while sending.
- Mobile-first layout.
- No horizontal overflow.
- Accessible contrast and readable text.
- Large touch targets.
- Kitchen cards must be readable, grouped, and action-focused.
- Admin/kitchen labels should be understandable without technical knowledge.

Do not leave preview-only, demo-only, or fake interaction flows in the client-facing production experience.

## 7. Production QA Checklist

Run before handover:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npx prisma validate`
- [ ] `npx prisma migrate deploy`
- [ ] Public routes return `200`.
- [ ] Protected routes redirect to login without session.
- [ ] Internal APIs return `401` without session.
- [ ] Admin login works.
- [ ] Kitchen login works.
- [ ] Logout invalidates session.
- [ ] Public menu opens without login.
- [ ] Order creation works.
- [ ] Kitchen receives the order.
- [ ] Status update works.
- [ ] Duplicate order prevention works.
- [ ] QA/test data cleanup works and does not delete real orders.
- [ ] Redeploy persistence is verified.
- [ ] Real mobile QR test is performed.
- [ ] Certificate/validation page prints correctly if included.
- [ ] Browser console/page errors are checked.
- [ ] Mobile and desktop layouts are checked.

## 8. Handover Package

Client handover should include:
- Public menu URL.
- Admin URL.
- Kitchen URL.
- Validation report URL.
- Final QR PDF.
- Admin/kitchen usernames.
- Rotated passwords.
- Short staff instructions.
- First live order test with the client.
- Clear note about what is enabled and what is not enabled.
- Support/contact path for first live shift.

Never hand over old temporary credentials. Rotate passwords immediately before delivery.

## 9. Validation Report Standard

Create a professional validation report for every serious client handover.

Acceptable titles:
- System Validation Report.
- Operational Readiness Report.

Rules:
- Do not claim official certification.
- Do not use fake ISO, government, or regulatory badges.
- State that the report is an internal technical validation by Smart Art AI Solutions.
- Include deployment status.
- Include database status.
- Include ordering status.
- Include admin/kitchen security status.
- Include API protection status.
- Include production QA status.
- Include remaining operational recommendations.
- Use Smart Art AI visual identity when appropriate.
- Include print/PDF support.

The report should build trust without overstating authority.

## 10. Things To Avoid

Avoid these mistakes:
- Do not enable ordering before PostgreSQL is verified.
- Do not rely on SQLite in Vercel production.
- Do not use `/tmp` for critical production data.
- Do not leave preview/demo copy in the client flow.
- Do not expose technical errors to users.
- Do not commit `.env` files.
- Do not print secrets, passwords, database URLs, tokens, or cookies in reports.
- Do not delete non-QA production orders.
- Do not run `npm audit fix --force` without reviewing the impact.
- Do not over-engineer during handover cleanup.
- Do not rewrite architecture during final QA unless a serious production blocker requires it.
- Do not remove migrations, Prisma files, restaurant data, auth logic, order flow, or validation pages casually.

## 11. Known Future Improvements

Recommended future improvements:
- Durable image uploads via Vercel Blob, Cloudinary, S3, or similar.
- Stronger analytics dashboard.
- Durable metrics instead of in-memory counters.
- Stronger distributed rate limiting.
- MFA for owner/admin users.
- Custom client domain.
- Multi-restaurant SaaS architecture.
- Better staff onboarding screens.
- Automated Playwright smoke tests in CI.
- Production backup and restore runbook.

## 12. Final Golden Rule

A client version is not ready when it only builds.

It is ready when it survives production deploy, PostgreSQL persistence, login/logout, protected APIs, real order flow, kitchen workflow, mobile QR testing, and clean handover.
