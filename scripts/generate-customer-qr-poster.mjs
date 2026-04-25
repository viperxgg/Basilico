import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "artifacts", "customer-qr");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const customerUrl = process.env.CUSTOMER_MENU_URL ?? "https://basilico.nordapp.se/menu";

const files = {
  qrSvg: path.join(outputDir, "basilico-customer-menu-qr.svg"),
  qrPng: path.join(outputDir, "basilico-customer-menu-qr.png"),
  posterHtml: path.join(outputDir, "basilico-customer-menu-qr-poster.html"),
  posterPng: path.join(outputDir, "basilico-customer-menu-qr-poster.png"),
  posterPdf: path.join(outputDir, "basilico-customer-menu-qr-poster.pdf"),
  urlText: path.join(outputDir, "basilico-customer-menu-url.txt")
};

async function downloadFile(url, destination) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
}

function posterHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Customer Menu QR</title>
    <style>
      :root {
        --bg: #06121a;
        --bg-soft: #0d1b25;
        --panel: rgba(255, 255, 255, 0.08);
        --panel-strong: rgba(255, 255, 255, 0.12);
        --line: rgba(255, 255, 255, 0.14);
        --text: #f8f5ef;
        --muted: #aac0cc;
        --accent: #c69a63;
        --accent-soft: rgba(198, 154, 99, 0.18);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top left, rgba(198, 154, 99, 0.18), transparent 28%),
          radial-gradient(circle at bottom right, rgba(45, 105, 119, 0.24), transparent 24%),
          linear-gradient(160deg, var(--bg) 0%, #081923 48%, #102432 100%);
        color: var(--text);
        font-family: "Segoe UI", Arial, sans-serif;
      }

      .poster {
        width: 1240px;
        min-height: 1754px;
        padding: 64px;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 28px;
      }

      .hero {
        display: grid;
        gap: 18px;
      }

      .eyebrow {
        width: fit-content;
        padding: 10px 18px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: var(--panel);
        color: var(--accent);
        font-size: 18px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        font-weight: 700;
      }

      h1 {
        margin: 0;
        max-width: 760px;
        font-size: 90px;
        line-height: 0.92;
        letter-spacing: -0.05em;
      }

      .subtitle {
        margin: 0;
        max-width: 780px;
        color: var(--muted);
        font-size: 28px;
        line-height: 1.45;
      }

      .layout {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 26px;
        align-items: stretch;
      }

      .panel {
        border: 1px solid var(--line);
        border-radius: 36px;
        background: var(--panel);
        backdrop-filter: blur(18px);
        box-shadow: 0 28px 90px rgba(0, 0, 0, 0.25);
      }

      .details {
        padding: 34px;
        display: grid;
        gap: 22px;
      }

      .lead {
        margin: 0;
        color: var(--text);
        font-size: 36px;
        font-weight: 700;
        line-height: 1.18;
      }

      .copy {
        margin: 0;
        color: var(--muted);
        font-size: 24px;
        line-height: 1.55;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .chip {
        padding: 12px 18px;
        border-radius: 999px;
        background: var(--accent-soft);
        border: 1px solid rgba(198, 154, 99, 0.24);
        color: #f6d7af;
        font-size: 18px;
        font-weight: 700;
      }

      .linkbox {
        padding: 18px 20px;
        border-radius: 24px;
        background: rgba(0, 0, 0, 0.18);
        border: 1px solid var(--line);
      }

      .link-label {
        margin: 0 0 10px;
        color: var(--accent);
        font-size: 15px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-weight: 700;
      }

      .link-value {
        margin: 0;
        color: var(--text);
        font-size: 24px;
        line-height: 1.35;
        word-break: break-word;
      }

      .notes {
        display: grid;
        gap: 12px;
      }

      .note {
        margin: 0;
        color: var(--muted);
        font-size: 20px;
        line-height: 1.4;
      }

      .qr-card {
        padding: 30px;
        display: grid;
        gap: 18px;
        justify-items: center;
        align-content: center;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 245, 239, 0.98));
        color: #101010;
      }

      .qr-shell {
        width: 100%;
        padding: 22px;
        border-radius: 28px;
        background: white;
        box-shadow: inset 0 0 0 1px rgba(16, 16, 16, 0.08);
      }

      .qr-shell img {
        width: 100%;
        display: block;
        border-radius: 18px;
      }

      .scan-title {
        margin: 0;
        text-align: center;
        font-size: 34px;
        line-height: 1.15;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .scan-copy {
        margin: 0;
        text-align: center;
        color: #46545e;
        font-size: 22px;
        line-height: 1.45;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .footer-copy {
        margin: 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.45;
      }

      .badge {
        padding: 12px 18px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: var(--panel-strong);
        color: var(--text);
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <main class="poster">
      <section class="hero">
        <div class="eyebrow">Basilico</div>
        <h1>Skanna och öppna menyn.</h1>
        <p class="subtitle">
          Öppna Basilicos digitala meny direkt i mobilen. Bläddra bland rätter, priser och allergener utan inloggning.
        </p>
      </section>

      <section class="layout">
        <article class="panel details">
          <p class="lead">Digital meny för gäster vid bordet.</p>

          <div class="chips">
            <span class="chip">Meny</span>
            <span class="chip">Browsing only</span>
            <span class="chip">Service</span>
            <span class="chip">Basilico</span>
          </div>

          <p class="copy">
            Använd mobilkameran, skanna koden och öppna restaurangens gästmeny online.
          </p>

          <div class="linkbox">
            <p class="link-label">Länk</p>
            <p class="link-value">${customerUrl}</p>
          </div>

          <div class="notes">
            <p class="note">Gäster öppnar menyn utan inloggning.</p>
            <p class="note">Placera QR-koden tydligt på bordet eller vid kassan.</p>
          </div>
        </article>

        <aside class="panel qr-card">
          <div class="qr-shell">
            <img src="./basilico-customer-menu-qr.png" alt="QR-kod till Basilicos digitala meny" />
          </div>
          <p class="scan-title">Skanna här</p>
          <p class="scan-copy">Öppna menyn. Onlinebeställning kommer senare.</p>
        </aside>
      </section>

      <footer class="footer">
        <p class="footer-copy">Nord Menu by Smart Art AI Solutions.</p>
        <div class="badge">Live Menu</div>
      </footer>
    </main>
  </body>
</html>`;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const svgUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&format=svg&margin=18&data=" +
    encodeURIComponent(customerUrl);
  const pngUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&format=png&margin=18&data=" +
    encodeURIComponent(customerUrl);

  await downloadFile(svgUrl, files.qrSvg);
  await downloadFile(pngUrl, files.qrPng);
  await fs.writeFile(files.posterHtml, posterHtml(), "utf8");
  await fs.writeFile(files.urlText, `${customerUrl}\n`, "utf8");

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });

  const page = await browser.newPage({
    viewport: { width: 1240, height: 1754, deviceScaleFactor: 2 }
  });

  await page.goto(pathToFileURL(files.posterHtml).href, { waitUntil: "load" });
  await page.screenshot({
    path: files.posterPng,
    fullPage: true
  });
  await page.pdf({
    path: files.posterPdf,
    width: "1240px",
    height: "1754px",
    printBackground: true
  });

  await page.close();
  await browser.close();

  console.log(`QR SVG: ${files.qrSvg}`);
  console.log(`QR PNG: ${files.qrPng}`);
  console.log(`Poster HTML: ${files.posterHtml}`);
  console.log(`Poster PNG: ${files.posterPng}`);
  console.log(`Poster PDF: ${files.posterPdf}`);
  console.log(`Linked URL text: ${files.urlText}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
