import { chromium } from "playwright";

export default async () => {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    return new Response(JSON.stringify({
      ok: true,
      title: await page.title(),
      url: page.url()
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  } finally {
    if (browser) await browser.close();
  }
};
