/**
 * Hero images — desktop + mobile, art-directed separately.
 *
 * TEMPLATE. The two JOBS below are a worked example from a real build; the
 * crop rectangles are specific to those source photographs. Keep the structure,
 * re-derive `crop` for your own images (the maths is in hero-fullbleed-playbook
 * §1), and always leave the derivation in the comment so the next person can
 * re-cut when a higher-resolution original arrives.
 *
 * These are two different photographs on purpose, not two sizes of one file.
 *
 * WHY: on a phone the hero is a tall narrow box, so `object-cover` is
 * HEIGHT-constrained — the full height of a landscape frame is always shown and
 * only its width is cropped. That means `object-position`'s Y component does
 * nothing, and a subject sitting low in the source frame is pinned behind the
 * CTA block forever. The phone therefore gets its own portrait crop, positioned
 * so the foot lands in the open band of the mobile scrim.
 *
 *   desktop → gal-reflexology-c  (wide treatment-room scene, reads spacious)
 *   mobile  → gal-reflexology-a  (close foot on a rolled towel, toes legible)
 *
 * Both are reflexology frames, so the two breakpoints stay on-message.
 *
 * Run: node scripts/make-hero-images.mjs
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = "public/images/home";

const JOBS = [
  {
    name: "desktop",
    src: ".image-source/gal-reflexology-c.jpg",
    out: `${OUT_DIR}/hero.webp`,
    /* 1024x1024 source. 16:9 window at top=290 keeps the reclining client, the
       therapist and the foot all in frame; higher clips the bolster, lower eats
       the heads. */
    crop: { left: 0, top: 290, width: 1024, height: 576 },
    width: 1600,
    quality: 80,
  },
  {
    name: "mobile",
    src: ".image-source/gal-reflexology-c.jpg",
    out: `${OUT_DIR}/hero-mobile.webp`,
    /* Same treatment room as desktop, cut to the phone's 0.49 aspect (390/795).
       Cropping from y=300 rather than the top is what lifts the foot: at full
       height it sat at 58-75% of the hero, i.e. directly behind the Book/Call
       buttons. From y=300 it lands at ~40-65%, so the toes read in the open band
       of the scrim. The cost is a tighter crop and a ~1.7x upscale, which is
       invisible under a 30-96% scrim.
       Tried the soak-bowl still life here first — at 441px wide the bowl loses
       its shape and reads as abstract texture. */
    crop: { left: 473, top: 300, width: 355, height: 724 },
    width: 620,
    quality: 82,
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const job of JOBS) {
  if (!fs.existsSync(job.src)) {
    console.error(`[hero] source missing: ${job.src}`);
    console.error("  Run `node scripts/fetch-images.mjs` first to populate .image-source/.");
    process.exitCode = 1;
    continue;
  }

  const meta = await sharp(job.src).metadata();
  const { left, top, width, height } = job.crop;
  if (left + width > meta.width || top + height > meta.height) {
    console.error(`[hero] ${job.name}: crop exceeds source ${meta.width}x${meta.height}`);
    process.exitCode = 1;
    continue;
  }

  const outHeight = Math.round((height / width) * job.width);
  await sharp(job.src)
    .extract(job.crop)
    .resize({ width: job.width, height: outHeight, kernel: "lanczos3" })
    /* Both crops are upscaled (~1.5x). They sit under a scrim at 25-95% opacity,
       where that softness is invisible. Drop in a higher-resolution original and
       this becomes a straight downscale. */
    .sharpen({ sigma: 0.6 })
    .webp({ quality: job.quality, effort: 6 })
    .toFile(job.out);

  const kb = (fs.statSync(job.out).size / 1024).toFixed(1);
  console.log(
    `[hero] ${job.name.padEnd(7)} ${meta.width}x${meta.height} → crop ${width}x${height} → ${job.width}x${outHeight}  ${kb} KB  ${job.out}`,
  );
}
