export const validationReport = {
  title: "Operational Readiness Report",
  subtitle: "Nord Menu - Basilico",
  statement:
    "This report tracks internal technical readiness for Basilico. It is not an external certification.",
  issuer: "Smart Art AI Solutions",
  validationDate: "25 April 2026",
  readinessScore: 7.4,
  readinessLabel: "Browsing-ready, ordering disabled pending production verification",
  readinessNote:
    "Ordering must remain disabled until PostgreSQL, auth, role protection, persistence, and end-to-end kitchen flow are verified.",
  summary: {
    product: "Nord Menu",
    client: "Basilico",
    liveUrl: "https://basilico.nordapp.se/menu",
    deployment: "Prepared for Vercel",
    database: "PostgreSQL required",
    orderingFlow: "Disabled",
    adminKitchenAccess: "Protected"
  },
  capabilities: [
    "Public QR menu works without login",
    "Menu browsing, search, categories, prices, and allergen visibility are implemented",
    "Admin, kitchen, and portal pages require login",
    "Internal APIs reject unauthenticated access",
    "PostgreSQL schema and migrations are prepared",
    "Ordering remains disabled until production checks pass",
    "Swedish customer copy is implemented"
  ],
  securityPoints: [
    "Public guests only access the menu and approved assistance flow.",
    "Staff areas stay protected behind login before operational access is granted.",
    "Role-based access is enforced for admin and kitchen workflows.",
    "Internal APIs require valid sessions and reject unauthorized requests.",
    "Secrets must remain in Vercel environment variables and never in source code."
  ],
  recommendations: [
    "Provision a dedicated PostgreSQL database for Basilico",
    "Run migrations and seed the published menu",
    "Rotate admin and kitchen passwords before handover",
    "Test admin login, kitchen login, and protected APIs before enabling orders",
    "Generate final QR after the production domain is confirmed"
  ],
  footer: {
    line1: "Smart Art AI Solutions",
    line2: "System Architecture & Deployment",
    line3: "Jämtland, Sweden",
    email: "hello@smartartai.se",
    copyright: "© 2026 Smart Art AI. All rights reserved."
  }
} as const;
