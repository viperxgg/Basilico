import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts", "product-poster");
const screenshotDir = path.join(projectRoot, "artifacts", "product-brochure", "screenshots");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const screenshots = {
  menu: "menu-mobile.png",
  review: "review-page.png",
  dashboard: "admin-dashboard.png",
  waiter: "admin-feed.png",
  kitchen: "kitchen-board.png"
};

const variants = [
  {
    key: "en",
    slug: "restaurant-system-a4-poster",
    lang: "en",
    dir: "ltr",
    brand: "Premium Restaurant System",
    headline: "Run Your Restaurant With Less Chaos",
    subheadline: "Digital ordering, live dashboard, and kitchen control in one system.",
    kicker:
      "Help guests order faster, keep staff aligned, and move every order from table to kitchen with less confusion.",
    valueHero: "Faster service. Clearer workflow. Better control.",
    labels: {
      menu: "Customer Menu",
      dashboard: "Live Dashboard",
      review: "Instant Orders",
      waiter: "Call Waiter",
      kitchen: "Kitchen Mode"
    },
    features: [
      "QR Code Ordering",
      "Live Dashboard",
      "Instant Orders",
      "Kitchen Display",
      "Call Waiter",
      "Real-Time Updates"
    ],
    valuesTitle: "Why owners choose it",
    values: [
      "Faster service",
      "Less confusion",
      "Better workflow",
      "Modern guest experience"
    ],
    bottomLead:
      "One connected operating system for guest ordering, staff coordination, and kitchen execution.",
    impactTitle: "What changes immediately",
    impactBody:
      "Guests start ordering without waiting. Staff see orders and requests instantly. The kitchen works from a clear live board instead of disconnected handoffs.",
    cta: "Book a Demo",
    footer: "See it live and give your restaurant a faster, more organized service flow.",
    tag: "Digital Menu &bull; Dashboard &bull; Kitchen Mode"
  },
  {
    key: "de",
    slug: "restaurant-system-a4-poster-germany",
    lang: "de",
    dir: "ltr",
    brand: "Premium Restaurant System",
    headline: "Weniger Chaos. Mehr Kontrolle im Restaurant.",
    subheadline: "Digitale Bestellungen, Live-Dashboard und klare Küchensteuerung in einem System.",
    kicker:
      "Beschleunigen Sie den Service, entlasten Sie Ihr Team und führen Sie jede Bestellung sauber vom Tisch bis in die Küche.",
    valueHero: "Schnellerer Service. Klarere Abläufe. Mehr Kontrolle.",
    labels: {
      menu: "Digitale Speisekarte",
      dashboard: "Live-Dashboard",
      review: "Sofortige Bestellungen",
      waiter: "Service rufen",
      kitchen: "Küchenmodus"
    },
    features: [
      "QR-Bestellung",
      "Live-Dashboard",
      "Sofortige Aufträge",
      "Küchenanzeige",
      "Service rufen",
      "Echtzeit-Updates"
    ],
    valuesTitle: "Warum sich Betreiber dafür entscheiden",
    values: [
      "Schnellerer Service",
      "Weniger Abstimmungsfehler",
      "Bessere Abläufe",
      "Moderner Gästeweg"
    ],
    bottomLead:
      "Ein verbundenes Betriebssystem für Gästebestellung, Servicekoordination und Küchenablauf.",
    impactTitle: "Was sich sofort verbessert",
    impactBody:
      "Gäste bestellen ohne Warten. Das Team sieht Bestellungen und Anfragen sofort. Die Küche arbeitet mit einem klaren Live-Board statt mit verstreuten Übergaben.",
    cta: "Demo buchen",
    footer: "Live ansehen und den Service in Ihrem Restaurant schneller und strukturierter machen.",
    tag: "Digitale Speisekarte &bull; Dashboard &bull; Küchenmodus"
  },
  {
    key: "sv",
    slug: "restaurant-system-a4-poster-sweden",
    lang: "sv",
    dir: "ltr",
    brand: "Premium Restaurant System",
    headline: "Mindre stress. Mer kontroll i restaurangen.",
    subheadline: "Digital beställning, live-dashboard och tydligt köksflöde i ett och samma system.",
    kicker:
      "Hjälp gäster att beställa snabbare, ge personalen bättre överblick och få varje order från bord till kök utan onödig förvirring.",
    valueHero: "Snabbare service. Tydligare flöde. Bättre kontroll.",
    labels: {
      menu: "Digital Meny",
      dashboard: "Live-Dashboard",
      review: "Direkta Ordrar",
      waiter: "Tillkalla Personal",
      kitchen: "Köksläge"
    },
    features: [
      "QR-beställning",
      "Live-dashboard",
      "Direkta ordrar",
      "Köksdisplay",
      "Tillkalla personal",
      "Realtidsuppdateringar"
    ],
    valuesTitle: "Därför väljer restauranger systemet",
    values: [
      "Snabbare service",
      "Mindre förvirring",
      "Bättre arbetsflöde",
      "Modern gästupplevelse"
    ],
    bottomLead:
      "Ett samlat operativt system för gästbeställning, servicekoordination och kökets arbetsflöde.",
    impactTitle: "Det som förändras direkt",
    impactBody:
      "Gäster kan beställa utan att vänta. Personalen ser beställningar och förfrågningar direkt. Köket arbetar i ett tydligt liveflöde istället för splittrade överlämningar.",
    cta: "Boka demo",
    footer: "Se det live och ge restaurangen ett snabbare och mer organiserat serviceflöde.",
    tag: "Digital meny &bull; Dashboard &bull; Köksläge"
  },
  {
    key: "ar",
    slug: "restaurant-system-a4-poster-arabic",
    lang: "ar",
    dir: "rtl",
    brand: "نظام مطاعم متميز",
    headline: "تحكم أكبر. فوضى أقل داخل المطعم.",
    subheadline: "طلب رقمي ولوحة مباشرة وتحكم واضح بالمطبخ ضمن نظام واحد.",
    kicker:
      "ساعد الزبائن على الطلب بسرعة، وامنح فريقك رؤية أوضح، وانقل كل طلب من الطاولة إلى المطبخ بدون أخطاء أو ارتباك.",
    valueHero: "خدمة أسرع. سير عمل أوضح. تحكم أفضل.",
    labels: {
      menu: "قائمة الزبون",
      dashboard: "اللوحة المباشرة",
      review: "طلبات فورية",
      waiter: "استدعاء النادل",
      kitchen: "وضع المطبخ"
    },
    features: [
      "طلب عبر QR",
      "لوحة مباشرة",
      "طلبات فورية",
      "شاشة المطبخ",
      "استدعاء النادل",
      "تحديثات لحظية"
    ],
    valuesTitle: "لماذا يختاره أصحاب المطاعم",
    values: [
      "خدمة أسرع",
      "ارتباك أقل",
      "سير عمل أفضل",
      "تجربة عميل أحدث"
    ],
    bottomLead:
      "نظام تشغيلي موحد لطلبات الزبائن وتنسيق الخدمة وتنفيذ العمل داخل المطبخ.",
    impactTitle: "ما الذي يتغير فورًا",
    impactBody:
      "يبدأ الزبون الطلب بدون انتظار. يرى الفريق الطلبات والتنبيهات مباشرة. ويعمل المطبخ من خلال لوحة حية واضحة بدل الاعتماد على تسليمات متفرقة.",
    cta: "احجز عرضًا تجريبيًا",
    footer: "شاهده مباشرة وامنح مطعمك خدمة أسرع وتنظيمًا أوضح.",
    tag: "قائمة رقمية &bull; لوحة مباشرة &bull; وضع المطبخ"
  }
];

function rel(from) {
  return path.relative(outputDir, path.join(screenshotDir, from)).split(path.sep).join("/");
}

function posterHtml(copy) {
  const isRtl = copy.dir === "rtl";
  const alignStart = isRtl ? "right" : "left";
  const footerJustify = isRtl ? "space-between" : "space-between";

  return `<!doctype html>
<html lang="${copy.lang}" dir="${copy.dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${copy.headline}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }

      :root {
        --paper: #f4efe8;
        --ink: #151515;
        --muted: #5a5751;
        --panel: rgba(255, 255, 255, 0.76);
        --line: rgba(21, 21, 21, 0.08);
        --accent: #173632;
        --gold: #b7925d;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        background: var(--paper);
        color: var(--ink);
        display: flex;
        justify-content: center;
      }

      .poster {
        width: 210mm;
        height: 297mm;
        padding: 14mm 14mm 12mm;
        display: grid;
        grid-template-rows: auto auto auto auto auto 1fr auto;
        gap: 4mm;
        background:
          radial-gradient(circle at top left, rgba(183, 146, 93, 0.18), transparent 26%),
          linear-gradient(180deg, #f8f5ef 0%, #f3eee7 100%);
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .brand {
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--gold);
        font-weight: 700;
      }

      .headline-wrap {
        display: grid;
        gap: 2.4mm;
        max-width: 178mm;
        text-align: ${alignStart};
      }

      h1 {
        margin: 0;
        font-size: ${isRtl ? "28pt" : "31pt"};
        line-height: 0.94;
        letter-spacing: -0.05em;
      }

      .subheadline {
        margin: 0;
        font-size: ${isRtl ? "12.2pt" : "12.8pt"};
        font-weight: 700;
        color: var(--accent);
      }

      .kicker {
        margin: 0;
        font-size: ${isRtl ? "9.7pt" : "10.1pt"};
        line-height: 1.42;
        color: var(--muted);
      }

      .value-hero {
        padding: 4.2mm 5mm;
        border-radius: 6mm;
        background: linear-gradient(135deg, rgba(23, 54, 50, 0.95), rgba(21, 21, 21, 0.96));
        color: white;
        font-size: ${isRtl ? "13.1pt" : "14pt"};
        font-weight: 800;
        letter-spacing: -0.03em;
        text-align: ${alignStart};
      }

      .hero-grid {
        display: grid;
        grid-template-columns: 0.55fr 1.45fr;
        gap: 4mm;
      }

      .shot {
        position: relative;
        overflow: hidden;
        border-radius: 7mm;
        padding: 2.4mm;
        background: #121212;
        box-shadow: 0 14px 34px rgba(12, 12, 12, 0.14);
      }

      .shot img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        object-position: top center;
        border-radius: 4.5mm;
      }

      .main-shot {
        height: 78mm;
      }

      .medium-shot {
        height: 78mm;
      }

      .small-shot {
        height: 31mm;
      }

      .support-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4mm;
      }

      .label {
        margin-top: 2mm;
        color: var(--accent);
        font-size: 7.7pt;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        font-weight: 700;
        text-align: center;
      }

      .feature-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3mm;
      }

      .feature {
        padding: 3.4mm 3.2mm;
        border-radius: 5mm;
        background: var(--panel);
        border: 1px solid var(--line);
        text-align: center;
        font-size: ${isRtl ? "8.6pt" : "9pt"};
        font-weight: 700;
        color: var(--accent);
      }

      .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 1.15fr;
        gap: 5mm;
        align-items: stretch;
      }

      .card {
        border-radius: 7mm;
        background: var(--panel);
        border: 1px solid var(--line);
        padding: 5mm;
        text-align: ${alignStart};
      }

      .card.dark {
        background: linear-gradient(135deg, rgba(20, 20, 20, 0.98), rgba(24, 54, 50, 0.96));
        color: white;
      }

      .card.dark p,
      .card.dark li,
      .card.dark .body-muted {
        color: rgba(255, 255, 255, 0.84);
      }

      h2 {
        margin: 0 0 3mm;
        font-size: ${isRtl ? "12.3pt" : "13pt"};
        letter-spacing: -0.03em;
      }

      .value-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2.6mm;
        margin-top: 3mm;
      }

      .value {
        padding: 3.2mm;
        border-radius: 4mm;
        background: rgba(23, 54, 50, 0.06);
        border: 1px solid rgba(23, 54, 50, 0.08);
        font-size: ${isRtl ? "9pt" : "9.4pt"};
        font-weight: 700;
      }

      .body-muted {
        margin: 0;
        font-size: ${isRtl ? "9.2pt" : "9.6pt"};
        line-height: 1.5;
        color: var(--muted);
      }

      .cta {
        display: inline-block;
        margin-top: 4mm;
        padding: 3.4mm 6mm;
        border-radius: 999px;
        background: white;
        color: var(--ink);
        font-size: ${isRtl ? "9.4pt" : "10pt"};
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .footer {
        display: flex;
        align-items: center;
        justify-content: ${footerJustify};
        gap: 4mm;
        padding-top: 2mm;
        border-top: 1px solid rgba(21, 21, 21, 0.08);
        flex-direction: ${isRtl ? "row-reverse" : "row"};
      }

      .footer-copy {
        font-size: ${isRtl ? "8.4pt" : "8.7pt"};
        line-height: 1.4;
        color: var(--muted);
        text-align: ${alignStart};
      }

      .tag {
        padding: 2.4mm 3.4mm;
        border-radius: 999px;
        border: 1px solid rgba(21, 21, 21, 0.08);
        background: rgba(255, 255, 255, 0.72);
        font-size: ${isRtl ? "7pt" : "7.4pt"};
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 700;
        white-space: nowrap;
      }

      @media print {
        body {
          background: white;
        }
      }
    </style>
  </head>
  <body>
    <main class="poster">
      <section class="topbar">
        <div class="brand">${copy.brand}</div>
      </section>

      <section class="headline-wrap">
        <h1>${copy.headline}</h1>
        <p class="subheadline">${copy.subheadline}</p>
        <p class="kicker">${copy.kicker}</p>
      </section>

      <section class="value-hero">${copy.valueHero}</section>

      <section class="hero-grid">
        <div>
          <div class="shot medium-shot">
            <img src="${rel(screenshots.menu)}" alt="${copy.labels.menu}" />
          </div>
          <div class="label">${copy.labels.menu}</div>
        </div>
        <div>
          <div class="shot main-shot">
            <img src="${rel(screenshots.dashboard)}" alt="${copy.labels.dashboard}" />
          </div>
          <div class="label">${copy.labels.dashboard}</div>
        </div>
      </section>

      <section class="support-grid">
        <div>
          <div class="shot small-shot">
            <img src="${rel(screenshots.review)}" alt="${copy.labels.review}" />
          </div>
          <div class="label">${copy.labels.review}</div>
        </div>
        <div>
          <div class="shot small-shot">
            <img src="${rel(screenshots.waiter)}" alt="${copy.labels.waiter}" />
          </div>
          <div class="label">${copy.labels.waiter}</div>
        </div>
        <div>
          <div class="shot small-shot">
            <img src="${rel(screenshots.kitchen)}" alt="${copy.labels.kitchen}" />
          </div>
          <div class="label">${copy.labels.kitchen}</div>
        </div>
      </section>

      <section class="feature-row">
        ${copy.features.map((feature) => `<div class="feature">${feature}</div>`).join("")}
      </section>

      <section class="bottom-grid">
        <div class="card">
          <h2>${copy.valuesTitle}</h2>
          <p class="body-muted">${copy.bottomLead}</p>
          <div class="value-list">
            ${copy.values.map((value) => `<div class="value">${value}</div>`).join("")}
          </div>
        </div>

        <div class="card dark">
          <h2>${copy.impactTitle}</h2>
          <p class="body-muted">${copy.impactBody}</p>
          <span class="cta">${copy.cta}</span>
        </div>
      </section>

      <footer class="footer">
        <div class="footer-copy">${copy.footer}</div>
        <div class="tag">${copy.tag}</div>
      </footer>
    </main>
  </body>
</html>`;
}

async function renderVariant(browser, copy) {
  const htmlPath = path.join(outputDir, `${copy.slug}.html`);
  const pdfPath = path.join(outputDir, `${copy.slug}.pdf`);
  const previewPath = path.join(outputDir, `${copy.slug}-preview.png`);

  await fs.writeFile(htmlPath, posterHtml(copy), "utf8");

  const page = await browser.newPage({
    viewport: { width: 1240, height: 1754, deviceScaleFactor: 1.5 }
  });

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.pdf({
    path: pdfPath,
    printBackground: true,
    preferCSSPageSize: true
  });
  await page.screenshot({
    path: previewPath,
    fullPage: true
  });
  await page.close();

  console.log(`Poster HTML (${copy.key}): ${htmlPath}`);
  console.log(`Poster PDF (${copy.key}): ${pdfPath}`);
  console.log(`Poster Preview (${copy.key}): ${previewPath}`);
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });

  for (const variant of variants) {
    await renderVariant(browser, variant);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
