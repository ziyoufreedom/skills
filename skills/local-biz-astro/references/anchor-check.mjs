/**
 * Internal #fragment check.
 *
 * link-check.mjs answers "does the target FILE exist" and stops there, so a link
 * to /services#cupping survives it happily after the anchor has been renamed —
 * the visitor just lands at the top of the page with no idea anything is wrong.
 * This walks every internal href that carries a fragment and asserts the id
 * actually exists in the built HTML it points at.
 *
 * Reads dist/, so run `npm run build` first. Exits 1 on a dangling fragment.
 */
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "_astro") out.push(...walk(full));
    else if (e.isFile() && e.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = walk(DIST);

// id="..." and name="..." — both are valid fragment targets.
const idsOf = new Map();
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  const ids = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  for (const m of html.matchAll(/<a[^>]+\sname="([^"]+)"/g)) ids.add(m[1]);
  idsOf.set(f, ids);
}

const routeToFile = (route) => {
  const clean = route.replace(/^\//, "").replace(/\.html$/, "");
  const target = clean === "" ? "index" : clean;
  return path.join(DIST, target + ".html");
};

let checked = 0;
const broken = [];

for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  for (const m of html.matchAll(/href="(\/[^"#]*)?#([^"]+)"/g)) {
    const [, route, frag] = m;
    if (frag === "" || frag === "main") continue;
    // Same-page fragment when no route part is present.
    const targetFile = route ? routeToFile(route) : f;
    checked++;
    if (!idsOf.has(targetFile)) {
      broken.push({ from: path.relative(DIST, f), href: (route || "") + "#" + frag, why: "no such page" });
      continue;
    }
    if (!idsOf.get(targetFile).has(frag)) {
      broken.push({
        from: path.relative(DIST, f),
        href: (route || "") + "#" + frag,
        why: "no id=\"" + frag + '" on ' + path.relative(DIST, targetFile),
      });
    }
  }
}

if (broken.length) {
  // Collapse: the same dangling anchor usually appears on many pages.
  const byHref = new Map();
  for (const b of broken) {
    if (!byHref.has(b.href)) byHref.set(b.href, { why: b.why, pages: [] });
    byHref.get(b.href).pages.push(b.from);
  }
  console.log("DANGLING FRAGMENTS\n");
  for (const [href, v] of byHref) {
    console.log("  " + href + "   " + v.why);
    console.log("    on " + v.pages.length + " page(s): " + v.pages.slice(0, 6).join(", ") + (v.pages.length > 6 ? " ..." : ""));
  }
  console.log("\n" + broken.length + " dangling of " + checked + " fragment links across " + files.length + " files");
  process.exit(1);
}

console.log("OK: all " + checked + " internal #fragment links resolve across " + files.length + " html files");
