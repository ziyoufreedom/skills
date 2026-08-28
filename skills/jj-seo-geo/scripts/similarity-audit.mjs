// Content-similarity audit — flags near-duplicate page pairs (Google folds near-dupes
// and picks one canonical, so a keyword-swap twin can silently lose its rankings).
// Ported from d4-season-astro; geo mask + walk adapted for Ten Toes (Lawrence, KS).
// Method: strip shared chrome (head/header/footer/nav/scripts), tokenize the remaining
// body text, build 5-word shingles, and compute Jaccard similarity for every page pair.
// Thresholds (rule of thumb for local landing pages that share real NAP/menu facts):
//   >= 0.70  CRITICAL — reads as the same page with the keyword swapped
//   >= 0.50  HIGH     — too much shared copy; differentiate the body sections
//   >= 0.35  WATCH    — acceptable only if the overlap is menus/NAP, not prose
// Usage: node scripts/audit/similarity-audit.mjs [--all] (default: only pairs >= 0.35)
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const SHOW_ALL = process.argv.includes("--all");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "_astro") out.push(...walk(full));
    else if (e.isFile() && e.name === "index.html") out.push(full);
  }
  return out;
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"')
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

function bodyText(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<head[\s\S]*?<\/head>/g, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

// Geo/service tokens are masked so "in Lawrence" vs "near KU campus" counts as the
// SAME shingle — we're measuring whether the surrounding prose is a swap template.
const GEO = /\b(lawrence|kansas|douglas|eudora|baldwin|lecompton|topeka|clinton|parkway|iowa|massachusetts|mass|ku|jayhawk|kck|kcmo|shawnee|olathe|overland)\b/gi;

function shingles(text, n = 5) {
  const toks = text.toLowerCase().replace(GEO, "GEO").match(/[a-zGEO'$-]+/g) || [];
  const set = new Set();
  for (let i = 0; i + n <= toks.length; i++) set.add(toks.slice(i, i + n).join(" "));
  return set;
}

const jaccard = (a, b) => {
  let inter = 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  for (const s of small) if (big.has(s)) inter++;
  return inter / (a.size + b.size - inter);
};

const pages = walk(DIST).map((f) => {
  const route = "/" + path.relative(DIST, f).replace(/\\/g, "/").replace(/index\.html$/, "");
  const text = bodyText(fs.readFileSync(f, "utf8"));
  return { route: route || "/", words: text.split(" ").length, sh: shingles(text) };
});

const pairs = [];
for (let i = 0; i < pages.length; i++)
  for (let j = i + 1; j < pages.length; j++) {
    const sim = jaccard(pages[i].sh, pages[j].sh);
    if (SHOW_ALL || sim >= 0.35) pairs.push({ a: pages[i], b: pages[j], sim });
  }
pairs.sort((x, y) => y.sim - x.sim);

console.log(`Pages: ${pages.length} · pairs >= 0.35 similarity: ${pairs.filter((p) => p.sim >= 0.35).length}\n`);
console.log("Sim    Level     Pair");
console.log("-".repeat(110));
for (const p of pairs.slice(0, SHOW_ALL ? 60 : 999)) {
  const lvl = p.sim >= 0.7 ? "CRITICAL" : p.sim >= 0.5 ? "HIGH    " : p.sim >= 0.35 ? "WATCH   " : "ok      ";
  console.log(`${p.sim.toFixed(2)}   ${lvl}  ${p.a.route}  <->  ${p.b.route}`);
}
if (pairs.filter((p) => p.sim >= 0.35).length === 0) console.log("(no pairs above 0.35 — clean)");
