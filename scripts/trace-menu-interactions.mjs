import { chromium, devices } from "playwright";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectPath(page, expectedPath) {
  const current = new URL(page.url());
  assert(
    current.pathname === expectedPath,
    `Expected path "${expectedPath}" but received "${current.pathname}".`
  );
}

async function expectVisible(locator, message) {
  await locator.waitFor({ state: "visible" });
  assert(await locator.isVisible(), message);
}

async function runDesktopTrace(browser) {
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/menu?table=Bord%207`, { waitUntil: "networkidle" });
  await expectPath(page, "/menu");
  await expectVisible(
    page.getByRole("heading", { name: "Basilico", exact: true }),
    "Public menu did not render Basilico heading."
  );
  await expectVisible(
    page.getByRole("heading", { name: "Förrätter", exact: true }),
    "Menu page did not render the starters section."
  );

  await page.getByRole("searchbox").fill("schnitzel");
  await expectVisible(
    page.getByRole("heading", { name: "Schnitzel Dorato", exact: true }),
    "Search did not reveal Schnitzel Dorato."
  );

  await page
    .getByRole("link", { name: /Öppna detaljer för Schnitzel Dorato/i })
    .click();
  await expectPath(page, "/dish/schnitzel-dorato");
  await expectVisible(
    page.getByRole("heading", { name: "Schnitzel Dorato", exact: true }),
    "Dish details page did not render Schnitzel Dorato."
  );

  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" });
  await expectVisible(
    page.getByRole("heading", { name: "Onlinebeställning kommer snart", exact: true }),
    "Review page did not show the ordering-disabled state."
  );
}

async function runMobileTrace(browser) {
  const context = await browser.newContext(devices["iPhone 13"]);
  const page = await context.newPage();

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await expectVisible(
    page.getByRole("link", { name: "Ring och beställ", exact: true }),
    "Mobile menu did not show the call-to-order CTA."
  );
  await expectVisible(
    page.getByText("Onlinebeställning kommer snart", { exact: false }),
    "Mobile menu did not show the ordering-disabled notice."
  );

  await context.close();
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath
  });

  try {
    await runDesktopTrace(browser);
    await runMobileTrace(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
