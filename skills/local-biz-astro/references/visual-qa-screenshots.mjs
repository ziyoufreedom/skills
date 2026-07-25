/**
 * Visual QA screenshot harness — full-page desktop + mobile captures of
 * every route via the SYSTEM Chrome (playwright channel:"chrome", no
 * browser download). Proven on The Agoura Hills Spa QA cycle.
 *
 * Setup:  npm i -D playwright   (system Chrome does the rendering)
 * Run:    npm run build && npm run preview   (note the REAL port!)
 *         SHOT_BASE=http://localhost:4322 node scripts/audit/screenshots.mjs
 *
 * ── Hard-won gotchas encoded below ──────────────────────────────────
 * 1. PORT TRAP: sibling projects often hold :4321, so `astro preview`
 *    silently bumps to :4322/:4323. The per-page BRAND ASSERTION below
 *    turns "captured the wrong site" from a silent QA disaster into an
 *    immediate throw. Never skip it.
 * 2. Scroll-reveal systems ([data-reveal] + IntersectionObserver) leave
 *    below-the-fold sections at opacity 0 in fullPage captures — force
 *    them visible with an injected style tag.
 * 3. loading="lazy" images + iframes don't fetch until scrolled to —
 *    scroll through the page in steps BEFORE the shot.
 * 4. Google Maps iframes NEVER reach network-idle — use a fixed settle
 *    delay, not waitForLoadState("networkidle") (it times out).
 * 5. Sticky headers duplicate/tile in fullPage captures — force
 *    position:static during the shot.
 * 6. Pages taller than ~16,000px hit Chrome's texture cap: the fullPage
 *    stitcher duplicates the page top and DROPS the true bottom. For
 *    those routes, additionally capture the bottom with viewport shots
 *    (scroll to bottom, screenshot, scroll up one viewport, repeat).
 * 7. Map tiles render fine in headless — they just need ~5-6s after
 *    scrollIntoView. Screenshot the iframe ELEMENT to verify the pin.
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.SHOT_BASE || "http://localhost:4321";
const OUT = ".image-source/screenshots";
// EDIT: one [name, route] pair per route in the sitemap + the 404.
const ROUTES = [
  ["home", "/"],
  ["services", "/services/"],
  ["about", "/about/"],
  ["contact", "/contact/"],
  ["faq", "/faq/"],
  ["404", "/404"],
];
// EDIT: a word that appears in every page's title/body for THIS brand.
const BRAND_RE = /agoura/i;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

for (const [w, tag] of [[1440, "desktop"], [390, "mobile"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  for (const [name, route] of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "load" });

    // (1) Guard: never capture a stray sibling-project server.
    const brandOk = await page.evaluate(
      (re) => new RegExp(re, "i").test(document.title) ||
              new RegExp(re, "i").test(document.body.innerText.slice(0, 3000)),
      BRAND_RE.source,
    );
    if (!brandOk) throw new Error(`WRONG SITE at ${BASE + route} — check the port.`);

    // (2)+(5) Force reveals final, unstick header, kill transitions.
    await page.addStyleTag({ content: [
      "[data-reveal],[data-reveal-stagger]{opacity:1!important;transform:none!important}",
      "[data-reveal-stagger]>*{opacity:1!important;transform:none!important}",
      "header{position:static!important}",
      "*{transition:none!important;animation:none!important}",
    ].join(" ") });

    // (3) Scroll through so lazy images/iframes actually fetch.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });

    // (4) Fixed settle — maps never go network-idle.
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

    await page.screenshot({ path: `${OUT}/${name}-${tag}.png`, fullPage: true });
    console.log(`${name}-${tag}.png`);
  }
  await ctx.close();
}
await browser.close();
console.log("done →", OUT);

/* ── Companion spot-checks (separate script or ad-hoc) ──────────────
 * Map pin verification (element shot after long wait):
 *   const frame = page.locator("iframe[src*='google.com/maps']").first();
 *   await frame.scrollIntoViewIfNeeded();
 *   await page.waitForTimeout(6000);
 *   await frame.screenshot({ path: "map.png" });
 *
 * Navbar overflow sweep (run after ANY header change):
 *   for (const w of [390, 640, 768, 900, 1024, 1280, 1366, 1440, 1920]) {
 *     const p = await browser.newPage({ viewport: { width: w, height: 160 } });
 *     await p.goto(BASE + "/", { waitUntil: "load" });
 *     const overflow = await p.evaluate(() =>
 *       document.documentElement.scrollWidth > document.documentElement.clientWidth);
 *     console.log(w, overflow);   // every row must print false
 *   }
 * ──────────────────────────────────────────────────────────────────── */
