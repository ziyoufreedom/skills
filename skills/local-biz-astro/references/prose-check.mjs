#!/usr/bin/env node
/**
 * prose-check — does the writing read like a person wrote it?
 *
 * The client's complaint was specific and correct: the /guides/ page "reads too
 * AI". Looking for why turned up something no per-page reading would have
 * caught — the word "actually" appeared 99 times across 30 pages, about three
 * per page. Every single use looked fine in place. The aggregate was the tell.
 *
 * ── Why this reads dist/ and not the source files ───────────────────────────
 * The version of this script in the local-biz-astro skill parses two known
 * source directories. That is how the complaint got shipped: the offending copy
 * was a PageHero subtitle and a lead paragraph in a core .astro page, and the
 * source-reading version does not look at core pages at all.
 *
 * Reading the built HTML cannot miss a page, sees exactly what the reader sees,
 * and strips <header>/<footer>/<nav> the same way seo-geo-score.mjs does — so
 * the nav and footer, which repeat on all 30 pages, do not swamp the density
 * counts.
 *
 * ── The second complaint, and what it added ────────────────────────────────
 * The client came back with one sentence from the homepage: "These are
 * photographs of the actual studio, not stock. It is a modest space in a
 * professional building…". This script passed it, clean, on every check.
 *
 * Two things were missing, and both are now measured.
 *
 *   1. THE SITE TALKING ABOUT ITSELF. That sentence defends the photographs
 *      instead of describing the room. The same reflex was on nine other
 *      pages: "Nothing on this page is a stock image", "the reason this page
 *      exists at all", "That is deliberate", "this page included", "rather
 *      than take our word for it". A studio describes its rooms; only a
 *      machine writing a page about a studio explains why the page is there.
 *      No occurrence of this has a good version, so it is a hard tell.
 *
 *   2. ONE CONNECTIVE DOING ALL THE CONTRASTING. "rather than" appeared 244
 *      times in 81,000 words — one every 330 words, on all 30 pages, 6 to 20
 *      per page. Every single one was defensible in place. Read end to end,
 *      the site defines everything by what it is not, in the same stiff
 *      phrase, and that uniformity is the tell. It is a density check, not a
 *      hard tell, because the construction is ordinary English: the budget
 *      allows a writer with a habit and fails a template.
 *
 * A note for whoever edits copy against this file: do NOT satisfy the "rather
 * than" budget by spelling the same contrast another way. Swapping 60 of them
 * to ", not X" moved the number and changed nothing a reader would feel. Where
 * the contrast earns its place, keep it; where it does not, delete the half
 * that says what the thing is not.
 *
 * Run:  npm run build && node scripts/audit/prose-check.mjs [--all]
 *       --all also lists every individual hit rather than the first three.
 * Exit 1 when a tic is over budget or a hard tell appears.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const DIST = join(ROOT, "dist");
const SHOW_ALL = process.argv.includes("--all");

if (!existsSync(DIST)) {
  console.error("dist/ missing — run `npm run build` first.");
  process.exit(2);
}

/* ── Reading the pages ─────────────────────────────────────────────────────── */

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (e.endsWith(".html")) out.push(full);
  }
  return out;
}

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<head[\s\S]*?<\/head>/g, " ")
    .replace(/<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ");

const decode = (s) =>
  s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "’").replace(/&mdash;/g, "—").replace(/&uarr;/g, "↑");

const route = (p) => {
  const r = p.replace(DIST, "").replace(/\\/g, "/").replace(/\/index\.html$/, "");
  return r === "" ? "/" : r;
};

/*
  TWO extractions, and the difference is the whole reason the first run of this
  script reported 47 aphorisms.

  `text`  — everything. Used for DENSITY only. A tic in a heading is still a
            tic, and counting words needs the whole page.

  `prose` — the contents of <p> and <li> ONLY. Used for every structural tell.
            Flattening a whole page turns a comparison table into one long
            "sentence" and jams an H1 into the byline beneath it, and the
            sentence-shape detectors then fire on the wreckage: a table row
            reading "Cupping mark | Impact bruise | Cause" was reported as an
            "X is not Y" antithesis, and the FAQ question "Is gratuity
            included?" was reported as a clipped aphorism. Neither is prose.
            The skill's own note on this script says a miscalibrated detector
            will direct an agent to delete good writing — this is that, and the
            fix is to feed it only the elements that hold sentences.
*/
const textOf = (html) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const pages = walk(DIST)
  // /seo-guide/ is a noindex sales page for the agency, written in a different
  // register on purpose. It is not customer copy and should not be graded.
  .filter((p) => !route(p).startsWith("/seo-guide"))
  .map((p) => {
    const stripped = strip(readFileSync(p, "utf8"));
    // Table cells hold fragments, never sentences — drop tables before pulling
    // paragraphs, so a <p> nested in a cell cannot leak in either.
    const noTables = stripped.replace(/<table[\s\S]*?<\/table>/gi, " ");
    const blocks = [...noTables.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map((m) => textOf(m[2]))
      .filter((s) => s.split(/\s+/).length >= 4);
    return { route: route(p), text: textOf(stripped), prose: blocks };
  });

const totalWords = pages.reduce((n, p) => n + p.text.split(/\s+/).length, 0);

/* ── 1. Tics measured by DENSITY, not per page ─────────────────────────────
   This is the detector the complaint needed and the per-file version lacks.
   A filler word is invisible one at a time; what makes copy read as generated
   is the same crutch reappearing every few hundred words for thirty pages.

   Budget is per 10,000 words of body copy. "actually" was running at ~5.4 per
   10k when the client complained. One or two per 10k reads as a person with a
   habit; five reads as a machine with a template.

   A tic may carry its own `budget` where the default would be nonsense. Two
   per 10k is right for a filler adverb nobody needs. It is not right for an
   ordinary connective like "rather than", which at that budget would fail a
   site that used it sixteen times in total — and an editor told to hit that
   number would start bending good sentences to avoid a phrase. The budgets
   below are set where the writing stops sounding like one hand. */
const TIC_BUDGET_PER_10K = 2.0;
const TICS = [
  { re: /\bactually\b/gi, name: '"actually"' },
  { re: /\bactual\b/gi, name: '"actual"' },
  { re: /\bsimply put\b|\bessentially\b|\bneedless to say\b/gi, name: "throat-clearing adverbs" },
  { re: /\bit is worth noting\b|\bat the end of the day\b|\bwhen it comes to\b/gi, name: "stock connectives" },
  { re: /\bthe whole (?:point|reason)\b/gi, name: '"the whole point/reason"' },
  { re: /\bthat is exactly\b/gi, name: '"that is exactly"' },
  /* The contrastive connective. 30.0 per 10k at the second complaint; 12.6
     after the edit, which is a writer who likes the phrase. 16 leaves room to
     use it and fails a return to the template. */
  { re: /\brather than\b/gi, name: '"rather than"', budget: 16 },
  /* "Walk-ins are genuinely accepted" appeared, near word for word, on eight
     pages. The word is fine; the reflex of reaching for it to prove a claim is
     what repeated. */
  { re: /\bgenuinely\b/gi, name: '"genuinely"', budget: 3 },
  { re: /\b(?:which|that) is exactly\b/gi, name: '"which/that is exactly"', budget: 2 },
];

/* ── 2. Tells ──────────────────────────────────────────────────────────────
   Two classes, and conflating them is how a gate starts lying.

   `perPage: n` — a rhetorical move that a real writer uses occasionally. One
   antithesis on a page whose whole subject IS a comparison is good writing;
   three on that page is a tic. Fails only when a single page exceeds n.

   No `perPage` — a construction with no good version. Announcing the page,
   reciting the search query, boasting a word count, claiming a virtue. Any
   occurrence is a finding. */
const TELLS = [
  {
    key: "announce",
    label: "announcing the page instead of writing it",
    // "Here is what we actually do", "These six guides answer...", "There are
    // three ways to book:" — all of them describe the thing the reader is
    // already looking at. On /guides/ the enumeration named six titles that
    // were set in bold twenty pixels below it.
    re: /\b(?:Here is (?:what|the|how|why)\b|These (?:two|three|four|five|six|seven|eight|nine|ten|\d+) \w+ (?:answer|cover|explain|are)\b|There are (?:two|three|four|five|\d+) ways\b|In this (?:guide|article|section),)/g,
  },
  {
    key: "page-about-itself",
    label: "the site explaining itself instead of describing the studio",
    /*
      The second complaint, in one detector. Every branch below was live copy.

        "These are photographs of the actual studio, not stock."   (home)
        "Nothing on this page is a stock image of somewhere else." (/about)
        "The hours are the reason this page exists at all."        (3 pages)
        "That is deliberate rather than an oversight."             (/cupping)
        "…worth more than anything a massage studio says about
         itself, this page included."                              (a guide)
        "…so you can read the evidence yourself rather than take
         our word for it."                                         (12 pages)

      What they share is a narrator standing beside the page describing its
      construction. A reader wants to know what the room looks like and
      whether the door is open at seven; none of them asked why the page was
      written or whether the pictures are real. Claiming the photographs are
      real is also self-defeating — nobody who trusted them was wondering.

      Deliberately NOT matched: "our FAQ page covers the rest", "the sources
      at the bottom of this page", "the guide on how often answers that one".
      Pointing at another page is navigation and it helps. The tell is a page
      justifying ITSELF.
    */
    re: new RegExp(
      [
        // why the page exists, or what it deliberately does
        /\b(?:this|the)\s+(?:page|site|article|guide)\s+(?:exists|is here|is built around|deliberately)\b/
          .source,
        /\b(?:reason|why)\s+(?:this|the)\s+page\s+(?:exists|is here)\b/.source,
        /\breason for this page\b/.source,
        // the page vouching for its own contents
        /\bnothing on this (?:page|site)\b/.source,
        /\bthis (?:page|article|one) included\b/.source,
        /\bours included\b/.source,
        // the photographs defending themselves
        /\bphotographs? of the actual\b/.source,
        /\bnot stock\b/.source,
        /\bstock (?:image|photo)/.source,
        // a choice announced as a choice
        /\bthat is deliberate\b/.source,
        /\bis (?:deliberate|on purpose)\b/.source,
        // virtue asserted about the writing itself
        /\btake our word for it\b/.source,
        /\bwith nothing to sell\b/.source,
        /\bnot merely tolerated\b/.source,
      ].join("|"),
      "gi",
    ),
  },
  {
    key: "seo-opener",
    label: '"If you are looking for X" — a search query, not a sentence',
    /*
      Anchored to the START of a block. That is the tell: a page that opens by
      reciting the query it hopes to rank for, back at the person who typed it.

      Mid-paragraph the same words can be ordinary English doing real work —
      "If you are searching for a massage near Hillsboro at half past six on a
      Thursday because the week has finally let go of you…" earns its
      conditional with a scene, and flagging it would push an editor to flatten
      a good sentence. What does not survive is the version with no scene, which
      just re-reads the keyword and answers itself.
    */
    // `g` is required by matchAll. Without `m`, `^` still anchors to the start
    // of the block, which is the intent.
    re: /^If you(?:'re| are) (?:looking for|searching for|after)\b/gi,
  },
  {
    key: "self-praise",
    label: "claiming a virtue the copy should demonstrate",
    // "honest about where the evidence is thin" is a claim of honesty. Showing
    // it means writing the limitation down. The one is worth pages of the other.
    re: /\b(?:honest about|we (?:are|pride ourselves on being) (?:honest|transparent|upfront)|no (?:fluff|nonsense|BS)|straight talk)\b/gi,
  },
  {
    key: "self-sabotage",
    label: "copy arguing the reader out of buying",
    /*
      The client's words, 2026-08-28: "像这些 negative 的为啥要往网站里写呢?"
      Twenty-eight instances across six guides, the FAQ, an area page and a
      service page — a table headed "The claim you will see online" whose five
      rows ran to four consecutive "No."s, a heading accent reading "including
      us", and a sentence telling the reader to "stop booking massages and go
      get a diagnosis. That is a better use of the same money."

      None of it was inaccurate. It was the same accurate sources reported
      backwards: NCCIH's finding is that massage MAY IMPROVE pain and function
      in chronic low-back pain, and the draft filed that as a disappointment.

      ⚠️ SCOPE. This catches copy that argues against the sale. It must NOT
      catch the licence-law boundary ("does not diagnose, treat or cure") or a
      safety contraindication or a referral. Those protect the business, and an
      earlier draft of this rule included /does not treat/, which matched the
      required disclaimer on the foot-massage page. Deleting that would have
      created the legal exposure the copy exists to prevent.
    */
    re: /\b(?:including us|includes this one|we will not pretend|not going to pretend|the honest (?:version|answer|part|pitch)|stated at the strength|evidence is thin|might not help|not worth a promise|(?:most |other )?spa websites|is (?:just )?guessing|lab coat|stop booking|better use of the same money|gets cheaper over time)\b/gi,
  },
  {
    key: "vanity-metric",
    label: "a number about the writing rather than about the business",
    // Word counts framed as volume. The reader is not buying words.
    //
    // It must be a COUNT OF PIECES beside a COUNT OF WORDS inside one clause —
    // "Six articles, 15,275 words". The "2,494 words" printed under each guide
    // card is a useful label on one item, and the first version of this rule
    // flagged all six of them, which would have argued for deleting the most
    // informative thing on the card.
    re: /\b(?:two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:articles?|guides?|pieces?|posts?)\b[^.]{0,30}?\b[\d,]{3,}\s+words\b/gi,
  },
  {
    key: "aphorism",
    perPage: 1,
    label: "long sentence → clipped copular aphorism (the loudest tell)",
    /*
      The move is a short copular sentence that RESTATES the long one before it
      — "…a long explanation of pressure… More force is not more benefit."
      Length and a copula alone are not enough to identify it, and the first
      version of this rule proved it by reporting "Parking is free.",
      "The lot is free.", "A 60-minute Body Massage is $80." and "Study sizes
      are small." Every one of those is a short sentence carrying a NEW fact,
      which is good plain writing and exactly what this site is trying to do.
      Flagging them would have argued for padding them back out.

      Two extra conditions, both cheap:
        - it must share a content word with the sentence before it, which is
          what "restating" looks like mechanically; and
        - it must not carry a digit, because a number is a new fact by
          definition, never a crystallisation of the previous sentence.
    */
    find: (t) => {
      const STOP = new Set(["about", "after", "again", "against", "because", "before", "being",
        "between", "could", "every", "first", "their", "there", "these", "thing", "think", "those",
        "through", "under", "where", "which", "while", "would", "your", "that", "this", "with",
        "from", "into", "than", "then", "they", "them", "what", "when", "have", "here"]);
      const content = (s) =>
        new Set(
          s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/)
            .filter((w) => w.length > 4 && !STOP.has(w)),
        );
      const sents = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
      const hits = [];
      for (let i = 1; i < sents.length; i++) {
        const prevWords = sents[i - 1].split(/\s+/).length;
        const cur = sents[i];
        if (prevWords < 22) continue;
        if (cur.split(/\s+/).length > 6) continue;
        if (!/\b(is|are|was|were)\b/i.test(cur)) continue;
        if (/\d/.test(cur)) continue;
        const prevSet = content(sents[i - 1]);
        const restates = [...content(cur)].some((w) => prevSet.has(w));
        if (restates) hits.push(cur);
      }
      return hits;
    },
  },
  {
    key: "not-x-but-y",
    perPage: 1,
    label: '"X is not Y. It is Z." antithesis',
    re: /[^.]*\b(?:is|are|was|were)\s+not\b[^.]{0,90}\.\s+(?:It|That|They|This)\s+(?:is|are)\b[^.]{0,90}\./g,
  },
  {
    key: "presumptuous",
    label: "narrating the reader's feelings back at them",
    re: /\b(?:which sounds like|you already know|we have all|if you are like most|let us be honest|sounds like a small thing)\b[^.]{0,80}/gi,
  },
];

/* ── Report ────────────────────────────────────────────────────────────────── */

const bar = "=".repeat(78);
console.log(`\n${bar}`);
console.log(` PROSE CHECK — ${pages.length} pages, ${totalWords.toLocaleString()} words of body copy`);
console.log(bar);

let failures = 0;

console.log("\n  TIC DENSITY  (budget " + TIC_BUDGET_PER_10K.toFixed(1) + " per 10,000 words)\n");
for (const tic of TICS) {
  let total = 0;
  const byPage = [];
  for (const p of pages) {
    const n = (p.text.match(tic.re) || []).length;
    if (n) { total += n; byPage.push([p.route, n]); }
  }
  const per10k = (total / totalWords) * 10000;
  const budget = tic.budget ?? TIC_BUDGET_PER_10K;
  const over = per10k > budget;
  if (over) failures++;
  if (!total) continue;
  console.log(
    `  ${over ? "OVER" : "ok  "}  ${per10k.toFixed(2)} per 10k  (${total} total, budget ${budget.toFixed(1)})  ${tic.name}`,
  );
  if (over || SHOW_ALL) {
    byPage.sort((a, b) => b[1] - a[1]);
    console.log(`          worst: ${byPage.slice(0, 5).map(([r, n]) => `${r} ${n}x`).join(", ")}`);
  }
}

console.log("\n  HARD TELLS  (any occurrence is a finding)\n");
let tellCount = 0;
for (const tell of TELLS) {
  const hits = [];
  for (const p of pages) {
    // Per block. Sentence-shape tells describe how one paragraph is written;
    // running them across a concatenated page invents pairs no reader ever
    // sees, because the two sentences sit in different parts of the page.
    for (const block of p.prose) {
      const found = tell.find
        ? tell.find(block)
        : [...block.matchAll(tell.re)].map((m) => m[0].trim());
      for (const h of found) hits.push([p.route, h.replace(/\s+/g, " ").slice(0, 96)]);
    }
  }
  if (!hits.length) continue;
  tellCount += hits.length;

  // Per-page allowance, where the tell names a move rather than a mistake.
  const byPage = new Map();
  for (const [r] of hits) byPage.set(r, (byPage.get(r) || 0) + 1);
  const worst = Math.max(...byPage.values());
  const over = tell.perPage ? worst > tell.perPage : true;
  if (over) failures++;

  const budget = tell.perPage ? `  (allowance ${tell.perPage}/page, worst page has ${worst})` : "";
  console.log(`  ${over ? "OVER" : "ok  "}  ${hits.length}x  ${tell.label}${budget}`);
  for (const [r, h] of hits.slice(0, SHOW_ALL ? hits.length : 3)) {
    console.log(`        ${r}\n          …${h}…`);
  }
  if (!SHOW_ALL && hits.length > 3) console.log(`        (+${hits.length - 3} more — rerun with --all)`);
  console.log("");
}
if (!tellCount) console.log("  none\n");

console.log(bar);
console.log(
  failures === 0
    ? " prose-check: clean"
    : ` prose-check: ${failures} categor${failures === 1 ? "y" : "ies"} over budget or tripped`,
);
console.log(bar + "\n");

process.exit(failures === 0 ? 0 : 1);
