# Homepage Composition

The homepage is the one page that deviates from the subpage rhythm — it needs to carry the full brand first-impression in one scroll. Eight sections in a loose but consistent order.

## A. Navbar (fixed, scroll-aware)

Transparent over cream hero initially; on scroll past 40px, fades to `bg-background/85 backdrop-blur` with a subtle bottom border. Logo image + two-line wordmark stack ("One Grain / by Yili Art"). Desktop: pill nav with underline hover. Always-visible "Book a Trial" CTA with the rotating-arrow circle.

## B. Hero (polaroid-collage variant)

Two-column layout with top meta row, then grid:

**Left (7-col):**
- Top row: 4 small color dots + kicker label left; handwritten "hi, welcome in ♡" at -3° right
- Handwritten annotation "yes, you ✿" with a tiny curly arrow pointing at the italic-wonk accent word
- Massive display headline (`clamp(2.75rem, 9vw, 8.5rem)`), 4 lines, one italic-wonk word per line ("Where / *children* / become artists / of their own *world.*")
- `<Squiggle>` divider
- Subtitle paragraph (≤2 lines desktop)
- CTA button + secondary underline link + ages sticker pill
- Social proof row at bottom: 4 overlapping colored dots + handwritten "loved by 300+ little artists..."

**Right (5-col), 58–74vh tall:**
- Big polaroid (72% × 56%) of studio photo, yellow tape top-center at -6°, caption "studio day · 01 ♡"
- Medium polaroid (52% × 44%) bottom-left, red tape at -10°, caption "sensation ✿"
- Small polaroid (36% × 32%) bottom-right, blue tape at 12°
- Circular `.blob-1` ocean-peek image left-middle with 4px ring-background
- Brand-wheat illustration stamp top-left
- Mint "est. 2024" sticker top-right at +8°
- Handwritten "come make something ✧" caption bottom-right

**Floating decorations (hidden md:block):**
- Sun top-left, Cloud top-middle, Heart mid-left, Sparkle upper-middle, Star lower-middle, Flower bottom-left — each with a different animation (float-y / drift-x / bounce-soft / wobble)

**Marquee stripe under the hero:** `panel-ink` (warm charcoal) with 4px primary-red top+bottom borders. Contains rotating stats: "EST. Delaware · AGES 2–8 · 3 Program Tiers · 6 Themes · A.P.S.U.L." Each stat `italic-wonk` in accent-yellow with an ✦ separator.

## C. Brand Intro

Two-column layout introducing the brand by name.

**Left (5-col):**
- "Hello, we're" kicker + handwritten ✿
- Massive `<BrandName>` display headline
- Short squiggle divider
- Big polaroid of a child at work, mint tape, brand-wheat stamp top-right, large orange "01" chapter badge bottom-left

**Right (7-col):**
- "A Manifesto, Quietly" kicker
- ~40-word manifesto statement as the h2 itself. Key nouns are italic-wonk in brand colors ("art academy" red, "original thinkers" blue). The ages "2–8" gets a tiny handwritten "yay!" annotation floating off the top-right.
- One short paragraph
- 3 value cards inline: "We respect · Individuality" / "We nurture · Originality" / "We connect · World Views" — each rotated -1.5° / +1° / +1.5°

## D. Philosophy (dark panel)

`hsl(196 42% 24%)` deep ocean teal. Top and bottom have a 4-color rainbow stripe (`flex h-2` with primary / accent / mint / secondary).

Content: 2-line massive headline "We believe *every child* / is born *creative*." (italic-wonk accent words in honey and tomato). Below, two-column supporting content:

**Left:** handwritten "our role, in one line ↓" then paragraph: "Not to make children *copy* — but to help them *observe*, *imagine*, *feel*, and *create*." Each action verb italic-wonk in a brand color.

**Right:** 2×2 grid of small belief cards, rotated alternately. "I BELIEVE / in every child's voice" (honey), "I CREATE / from what I see" (tomato), "I FEEL / before I figure out" (ocean), "I QUESTION / not to be taught" (mint).

## E. Programs

Three chapters, alternating photo side (image left → text right → image right → text left → image left → text right). Each chapter uses the polaroid-image card pattern with a distinct color accent:

- Chapter I (Ages 2–4, Sensation): accent honey, tape-yellow, heart doodle floating top-right
- Chapter II (Ages 4–6, Imagination): primary tomato, tape-red, flower doodle bottom-left
- Chapter III (Ages 6–8, Design): secondary ocean, tape-blue, sparkle doodle top-left

Each text side has a huge faded `.numeral` "01/02/03", kicker, italic-wonk chapter name, colored subtitle pill, body paragraph, and the dark-pill "Explore this chapter" button.

Section header uses the standard `<SectionHeader>` with handwritten "pick the one that fits — or grow through all three ✿" and a floating Sun doodle top-right.

## F. Themes / Learning Grid

Six-item grid (3 per row on desktop) on `bg-card` + `.bg-dots`. Each theme uses the blob-photo sticker card (pattern #5 in card-patterns.md), cycling blob shapes and chip colors.

Below the grid: the A.P.S.U.L. mnemonic strip — 5 horizontally arranged letters + words ("A / Art" "P / Play" "S / Spirit" "U / Use" "L / Learn") inside a cream pill shadow-lg, introduced by handwritten "our little method ↓". Each letter uses a different brand color.

## G. Collaboration / Gallery wall

Sticky left column + polaroid wall right column.

**Left (5-col, sticky):** standard section header pattern. Title "The *work* speaks / for itself." with crayon-underline-red on "work". Handwritten "(these made our week ✿)" in ocean. CTA + "300+ pieces ♡" sticker.

**Right (7-col):** 4 polaroid photos in a 12-col sub-grid, each rotated differently, different tape colors (yellow / red / blue / mint), each with polaroid captions. Layout:
- Top-left (col-span-8 row-span-2): big portrait polaroid
- Top-right (col-span-4): square polaroid with tape on the right
- Middle (col-span-4): another portrait polaroid
- Bottom (col-span-12): wide landscape polaroid (aspect 21/9)

## H. CTA (primary red panel)

Full-bleed `bg-primary`. Giant italic-wonk watermark "create." at 10% opacity translated up so it bleeds above the fold. Floating decorations: Sun top-left (float-y), Cloud top-right (drift-x), Star mid-right (wobble), Heart bottom-left (bounce-soft), Flower bottom-right (wobble), Sparkle mid-left.

Content centered: kicker "• Come Visit •" flanked by two dots. Handwritten "psst — come say hi ✿" in accent. Huge 3-line headline "Let your child / *discover* / the joy of *creating*." with a hand-drawn SVG swoosh under "creating" and a small curly arrow + handwritten "yes, really!" off the right of "discover". Squiggle divider, subtitle paragraph, dark-pill CTA, "Visit our Delaware studio →" secondary link.

Sticker cluster at the bottom (3 stickers): "free trial ✿" (honey), "ages 2–8" (mint, +3°), "small classes" (background-on-primary, -5°).

## I. Footer

`bg-foreground text-background` dark ink panel. Five-column bottom. Logo + wordmark + short blurb + email + location on the left (5-col); Programs / Studio / Visit / Partners link grids on the right (7-col). Bottom bar with copyright + "Made with care · Delaware" label.

No giant watermark in the background (owner preference — the watermark version was tried and rejected).

---

## Page-composition cheatsheet

| Section | Background | Density | Key element |
|---------|-----------|---------|------------|
| A. Navbar | Transparent → cream | Low | Wordmark + CTA |
| B. Hero | Cream + grain | **Very high** (polaroids, doodles, marquee) | Massive italic-wonk headline |
| C. Brand Intro | Cream + blobs | Medium | Manifesto-as-headline |
| D. Philosophy | Deep teal | Medium-high | 2-line huge headline |
| E. Programs | Cream | High (3 polaroids, alternating) | Italic-wonk chapter names |
| F. Themes | Card + dots | Medium | Sticker grid |
| G. Gallery | Cream | High (4 polaroids) | Work speaks for itself |
| H. CTA | Primary red | **Very high** (doodles + stickers) | Create |
| I. Footer | Dark ink | Low | Columns |

The site breathes by alternating high-density and low-density sections. Two "very high" sections (Hero and CTA) anchor the top and bottom; the middle alternates high-medium-high-medium-high.
