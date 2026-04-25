# Basilico Production Smoke Test

Use this checklist after every production deployment.

Placeholder deployment URL:

```powershell
$BASE_URL = "https://BASILICO_DEPLOYMENT_URL"
```

Do not paste real passwords into this document. Use the production credentials stored in the approved secret manager.

## 1. Public Pages

These pages must work without login.

```powershell
curl.exe -i "$BASE_URL/"
curl.exe -i "$BASE_URL/menu"
curl.exe -i "$BASE_URL/403"
curl.exe -i "$BASE_URL/404"
```

Expected:
- `/` returns `200`.
- `/menu` returns `200`.
- `/403` returns `200`.
- `/404` returns `404` or a rendered not-found response.
- Pages do not expose stack traces, secrets, or internal deployment details.

## 2. Protected Pages Without Login

These pages must not show protected content without a valid session.

```powershell
curl.exe -i "$BASE_URL/admin"
curl.exe -i "$BASE_URL/kitchen"
curl.exe -i "$BASE_URL/portal"
```

Expected:
- Each request redirects to `/login?next=...` or returns an equivalent unauthenticated response.
- No admin, kitchen, order, assistance, or user data appears in the response body.

## 3. Internal APIs Without Session

These APIs must return `401` without a valid session.

```powershell
curl.exe -i "$BASE_URL/api/internal/activities"
curl.exe -i "$BASE_URL/api/internal/observability"
curl.exe -i "$BASE_URL/api/admin/menu/draft"
curl.exe -i "$BASE_URL/api/admin/menu/releases"
curl.exe -i "$BASE_URL/api/kitchen/orders"
curl.exe -i "$BASE_URL/api/activities"
```

Expected:
- Each request returns `401 Unauthorized`.
- No operational data is returned.

## 4. Public APIs

Public APIs must expose only safe public data.

```powershell
curl.exe -i "$BASE_URL/api/public/menu"
curl.exe -i "$BASE_URL/api/live"
```

Expected:
- `/api/public/menu` returns `200` and public Basilico menu/profile data.
- Public menu payload must not include secrets, user records, sessions, password hashes, audit logs, login events, internal order records, or kitchen/admin state.
- `/api/live` returns `404` and does not expose internal streams.

Optional quick content check:

```powershell
$menuResponse = curl.exe -s "$BASE_URL/api/public/menu"
$menuResponse | Select-String "Basilico"
$menuResponse | Select-String "passwordHash|sessionToken|AUTH_|DATABASE_URL|loginEvents|auditLogs|orders"
```

Expected:
- First command finds `Basilico`.
- Second command returns no matches.

## 5. Ordering Disabled

Online ordering must remain blocked while ordering mode is disabled.

```powershell
curl.exe -i -X POST "$BASE_URL/api/public/orders" -H "Content-Type: application/json" -d "{}"
curl.exe -i -X POST "$BASE_URL/api/orders" -H "Content-Type: application/json" -d "{}"
```

Expected:
- Requests return `403 Forbidden`.
- Response explains that online ordering is not active.
- No order is created in admin or kitchen views.

## 6. Login And Role Checks

Use real production credentials from the approved secret manager. Do not write them in this file.

Manual browser checks:
- Open `$BASE_URL/login`.
- Log in as admin.
- Confirm admin user can access `$BASE_URL/admin`.
- Confirm admin user can access admin menu pages.
- Confirm admin user can access or safely redirect from `$BASE_URL/portal`.
- Log out.
- Log in as kitchen user.
- Confirm kitchen user can access `$BASE_URL/kitchen`.
- Confirm kitchen user cannot access `$BASE_URL/admin`; it should return `403` or safely redirect away from admin content.
- Confirm disabled users cannot log in.
- Confirm invalid credentials show a generic login error and do not expose internal errors.

Optional session-cookie API checks after browser login:

```powershell
curl.exe -i "$BASE_URL/api/auth/me"
```

Expected:
- Without a browser session/cookie, returns `401`.
- With a valid authenticated session/cookie, returns only safe current-user session data.

## 7. Mobile QR Flow

Manual mobile checks:
- Scan the production QR code or open `$BASE_URL/menu` on a phone.
- Confirm the menu opens without login.
- Confirm Basilico identity, address, phone CTA, opening hours, category tabs, search, prices, and allergens are visible.
- Search for `schnitzel`; confirm `Schnitzel Dorato` is shown.
- Tap a category; confirm scrolling/navigation works.
- Open a dish page; confirm details render and the back link works.
- Confirm gallery images are general restaurant/menu visuals and are not presented as exact dish photos.
- Confirm ordering-disabled notice is visible but not shown as an error.
- Confirm no add-to-cart/order submission path is available while ordering is disabled.

Browser console checks:
- Open DevTools Console on desktop and mobile emulation.
- Reload `/menu`.
- Confirm there are no hydration errors.
- Confirm there are no runtime console errors.
- Confirm no failed requests for required public assets.

## 8. Final Sign-Off

Record:
- Deployment URL:
- Deployment date/time:
- Git revision or deployment ID:
- PostgreSQL migration status:
- Seed status:
- Admin login checked by:
- Kitchen login checked by:
- Mobile QR checked by:
- Ordering disabled confirmed by:
- Notes or follow-up actions:
