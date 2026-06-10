---
name: kids-studio-design
description: |
  Apply a warm, premium "kids-art-studio" visual language — rotated sticker cards
  with tinted backings, handwritten Caveat annotations, polaroid-with-washi-tape
  photo treatments, organic blob image masks, Fraunces italic-wonk display type,
  scattered Sun/Heart/Cloud/Flower doodles, and soft multi-stop warm gradients.
  Use this skill whenever building or restyling a website for a children's art
  academy, family studio, kids creative brand, preschool, pediatric clinic, toy
  store, children's bookstore, family cafe, playspace, or any warm/playful brand
  that must feel editorial-premium but inviting (not corporate, not generic-AI).
  Triggers on phrases like "kids art studio style", "One Grain style", "make it
  feel like a kids art school", "playful but high-end", "children's brand site",
  "kids-studio aesthetic", "OtherPrograms-style cards", or when the user
  references the One Grain by Yili Art direction and asks to apply it elsewhere.
---

# Kids Studio Design

A Tailwind-based visual language for children's / family / playful-creative brand sites. Distilled from the One Grain by Yili Art build after an owner review rejected both plain shadcn-templates ("太丑") and an editorial Kinfolk direction ("不够吸引人"). This is the third iteration that stuck.

## The core idea

A parent looking at this site for their 2–8 year old should feel **invited in** — as if walking into a sunlit art classroom with paint on the walls and children's work pinned up. Not impressed-from-a-distance (Kinfolk), not AI-generic (every bordered-card template), not corporate (dark flat UI kits).

Five sensory anchors keep the whole site coherent:

1. **Warm cream paper** background with subtle SVG grain
2. **Rotated sticker cards** with tinted offset backings, soft shadows, slight -1.5° / +1.5° wobble
3. **Colored circle chips** (-6° rotated) for numerals, letters, ages
4. **Polaroid + washi-tape** photo treatments
5. **Handwritten Caveat annotations** layered over serif `italic-wonk` titles

Everything else — doodles, blobs, crayon underlines, sparkles — is decoration on top of these five.

## When the style applies

**Strong fit:** children's art school, preschool, kids clothing, family photography studio, pediatric dentistry, toy brand, children's bookstore, family cafe, playspace, creative summer camp.

**Partial fit (use warmer half, skip the doodles):** boutique wedding/event planner, indie cafe, florist, small-batch skincare.

**Wrong fit:** B2B SaaS, law firm, medical device, fintech, enterprise tools. Use `frontend-design` or `local-biz-website` skills instead.

## Tech stack this skill assumes

- Vite + React + TypeScript
- Tailwind CSS with HSL CSS variable tokens (shadcn-style theme)
- Framer Motion for hero animations
- React Router DOM
- Google Fonts (Fraunces + Inter Tight + JetBrains Mono + Caveat)

If the project doesn't use Tailwind, translate the utility classes to plain CSS or styled-components. The *patterns* transfer; the exact classnames don't.

## The three things to do first

Before building any page, install these three foundations. They are what makes everything else look consistent.

### 1. Drop in the CSS primitives

Copy `references/css-primitives.css` into `src/index.css` (or the project's global stylesheet). This adds:

- Google Fonts `@import` for Fraunces + Inter Tight + JetBrains Mono + Caveat
- HSL color tokens (cream bg, tomato primary, ocean secondary, honey accent, mint, deep ocean-teal)
- Typography classes: `.font-display`, `.font-hand`, `.italic-wonk`, `.numeral`, `.handwritten`, `.label`
- Card primitives: `.polaroid`, `.tape` (+ `.tape-red/blue/mint/yellow`), `.sticker`
- Shape primitives: `.blob-1/2/3/4`
- Panel helpers: `.panel-primary/secondary/accent/mint/ink`
- Decoration: `.crayon-underline`, `.paper-grain`, `.bg-dots`, `.bg-stripes-diagonal`
- Animations: `wobble`, `float-y`, `bounce-soft`, `drift-x`, `animate-marquee`

### 2. Drop in the Doodle library

Copy `references/Doodles.tsx` into `src/components/Doodles.tsx`. It exports ready-made SVG components: `Star`, `Sparkle`, `Heart`, `Sun`, `Cloud`, `Rainbow`, `Drop`, `Smile`, `Flower`, `Squiggle`, `Scribble`, `Circle`, `Dot`, `Arrow`, `ArrowCurly`, `BrandMark`. Use them sprinkled across sections — typically 2–4 per section — with animation classes: `<Sun className="... float-y" />`, `<Heart className="... bounce-soft" />`, `<Flower className="... wobble" />`.

### 3. Drop in `SectionHeader` and (optionally) `PageHero`

Copy `references/SectionHeader.tsx` and `references/PageHero.tsx` into `src/components/`. Every inner section should open with `<SectionHeader>`; every subpage should open with `<PageHero>`. These two components carry 80% of the site's consistency.

## The card recipe

This is the component pattern that drives the whole site. Use it whenever you need to display 2+ items (features, principles, programs, goals, team members, testimonials, FAQs, locations, services).

```tsx
<div
  className="relative"
  style={{ transform: `rotate(${i % 2 === 0 ? -1.2 : 1.2}deg)` }}
>
  {/* Tinted offset backing — the card peeks out from behind it */}
  <span
    aria-hidden
    className="absolute inset-0 bg-primary/10 rounded-3xl translate-x-1.5 translate-y-2 -z-10"
  />

  {/* The card itself */}
  <div className="bg-background border border-foreground/10 rounded-3xl p-6 shadow-sm
                  transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
    {/* Colored circle chip — rotate -6deg so it looks hand-placed */}
    <div
      className="w-14 h-14 rounded-full bg-primary text-primary-foreground
                 flex items-center justify-center mb-5 shadow-lg"
      style={{ transform: "rotate(-6deg)" }}
    >
      <span className="font-display italic-wonk text-xl tabular-nums">01</span>
    </div>

    <h3 className="font-display text-2xl italic-wonk text-foreground mb-3">
      Card Title
    </h3>
    <p className="font-body text-sm text-foreground/70 leading-relaxed">
      Short description, 1–3 sentences.
    </p>
  </div>
</div>
```

**Rules of the recipe:**

- **Alternate rotation** across siblings. Typical range `-1.5°` to `+1.5°`. Never all tilt the same way.
- **Backing tint matches the chip color** at 10–25% opacity. If the chip is `bg-primary`, the backing is `bg-primary/10`. If the chip is `bg-accent`, use `bg-accent/20` (honey yellow reads thin at 10%).
- **Backing offset direction**: for down-right rotated cards, offset backing down-right too (`translate-x-1.5 translate-y-2`). It's a shadow, not a collision.
- **Chip rotation is always `-6deg`**, never varied. This one tiny consistency is what makes the whole system feel hand-placed instead of random.
- **Cycle chip colors** across siblings: tomato → honey → ocean → mint → ink → (repeat). See `references/card-patterns.md` for the full palette cycle constants.
- **Hover**: `-translate-y-1` + shadow bump. Nothing fancier. Over-animation feels AI.

See `references/card-patterns.md` for specific variants: polaroid-image card (with washi tape), letter card (A.P.S.U.L. style), age-pill card (OtherPrograms style), blob-photo card (theme grid), striped-accent card (philosophy principle).

## Section header recipe

Every content section above the fold-break starts with:

```tsx
<SectionHeader
  kicker="Our Principles"
  title={<>What we <span className="italic-wonk text-primary">believe</span>.</>}
  handwritten="three little truths we run on ✿"
  subtitle="One tight paragraph, never more than two lines at desktop."
/>
```

Which renders: colored dot + kicker label + sparkle icon → large Fraunces title with one `italic-wonk` accent word (tomato or ocean) → optional handwritten annotation at -2° rotation → optional subtitle paragraph.

**The italic-wonk accent word is the most visible pattern.** One per title, never two. It should be a noun the reader cares about ("children", "creative", "world", "believe", "chapters") — not a throwaway word.

## Page hero recipe

Subpages use `<PageHero>` with a warm multi-stop gradient background (no photos, no dark overlay by default):

```
linear-gradient(135deg,
  hsl(38 62% 93%) 0%,    ← cream
  hsl(42 78% 82%) 32%,   ← honey
  hsl(20 72% 80%) 66%,   ← peach
  hsl(10 68% 74%) 100%   ← soft coral
)
```

Layered on top:

- 3 large blurred color-glow blobs (`opacity-55 blur-3xl`) at scattered positions — cheap, gorgeous depth
- 4–5 scattered doodles (Sun / Cloud / Heart / Sparkle / Flower) at 5–30% opacity for the faded ones, full opacity for the 1–2 "main" ones
- Dark sticker pill tag (`.sticker` with `bg-foreground text-background`) instead of a uppercase-tracked label
- Large centered title with one `italic-wonk` accent word
- A `<Squiggle>` divider
- Subtitle paragraph

For photo-hero variants (rare — only when a photo strongly carries the page's identity), pass `bgImage` + always also `imagePosition` (e.g. `"center 15%"` for heads-at-top compositions, `"center 70%"` for subjects-at-bottom). Default `object-position: center 30%` is a heads-visible bias that works for most stock kid photos.

## The OtherPrograms pattern (cross-link grid)

The pattern the owner explicitly liked and wants reused anywhere siblings or related items need to be listed side-by-side (other programs, other locations, other services, other chapters, other team members). Two cards max. Three would feel crowded.

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
  {others.map((p, i) => (
    <Link to={p.path} style={{ transform: `rotate(${i === 0 ? -1.2 : 1.2}deg)` }}>
      {/* tinted backing */}
      {/* card:
            - circular colored chip with primary identifier (age, letter, icon)
            - label (kicker: "Chapter II" / "Location" / "Service")
            - italic-wonk title (one word if possible)
            - truncated subtitle
            - dark circle arrow button that rotates 45° on hover
        */}
    </Link>
  ))}
</div>
```

Header for the grid is a handwritten-annotation divider, not a plain h2:

```tsx
<div className="flex items-center justify-center gap-4 mb-8">
  <span className="h-px w-12 sm:w-20 bg-foreground/15" />
  <p className="handwritten text-2xl text-primary/75 -rotate-2">
    explore the other chapters <Sparkle className="w-4 h-4 text-accent inline" />
  </p>
  <span className="h-px w-12 sm:w-20 bg-foreground/15" />
</div>
```

Full reference: `references/OtherPrograms.tsx`.

## CTA button recipe

One button style, used sitewide. Dark pill with a circle that contains a rotating arrow:

```tsx
<Link
  to="/contact"
  className="group inline-flex items-center gap-3
             bg-foreground text-background pl-6 pr-2 py-2 rounded-full
             hover:bg-primary transition-colors"
>
  <span className="font-body text-sm tracking-wide">Book a trial class</span>
  <span className="w-9 h-9 rounded-full bg-background text-foreground
                   flex items-center justify-center
                   group-hover:rotate-45 transition-transform">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M7 3l4 4-4 4"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
</Link>
```

On the primary-red CTA panel, invert: `bg-primary-foreground text-primary` for the outer pill, `bg-primary text-primary-foreground` for the inner arrow circle.

For secondary actions, use a text link with an underline — not a second button style. Too many button shapes breaks the rhythm.

## The dark panel problem

At least one section per page benefits from being dark to give the eye a rest. Two traps to avoid:

- **Pure black or dark brown** feels corporate and oppressive on a kids' site. The owner rejected it outright on the One Grain Philosophy page.
- **Bright primary red** is exciting but exhausting if it occupies a full-viewport section.

The working move: **deep warm teal `hsl(196 42% 24%)`**. Kid-friendly, harmonizes with the secondary blue, keeps big Fraunces type legible in cream `text-background`. Optionally frame top and bottom with a 4-color stripe (`flex h-2` with `bg-primary / bg-accent / bg-mint / bg-secondary`).

Use it as `style={{ background: "hsl(196 42% 24%)" }}` rather than extending the Tailwind theme unless you'll reuse the color elsewhere.

## Decoration rules (what not to overdo)

The whole system lives or dies on restraint. A children's art site loves color and play, but the viewer still needs a resting eye every 800 pixels.

- **Doodles**: 2–4 per section, never more. Bias toward `hidden md:block` so mobile stays calm.
- **Rotations**: keep cards in `[-2°, +2°]`. The chip inside is `-6°`. Going bigger turns cute into chaotic.
- **Handwritten annotations**: one per section header, maybe one more at section end. More than that reads like a scrapbook.
- **Stickers**: cluster them at CTA sections or alongside a hero button (3 stickers max). Don't use them as a general card style.
- **Tape strips on polaroids**: one tape per photo, not two. The tape color should match the photo's dominant hue or the program's accent.
- **Crayon underline**: one word per page max. Overusing it weakens the effect.

## Tailwind + theme setup

If starting from a fresh shadcn-vite template, edit `tailwind.config.ts` to add the `mint` and `ink` colors (others are standard shadcn):

```ts
extend: {
  colors: {
    // ...existing shadcn tokens
    mint: "hsl(var(--mint))",
    ink: "hsl(var(--ink))",
  },
  fontFamily: {
    display: ["Fraunces", "DM Serif Display", "serif"],
    body: ["Inter Tight", "DM Sans", "sans-serif"],
    mono: ["JetBrains Mono", "ui-monospace", "monospace"],
    hand: ["Caveat", "cursive"],
  },
}
```

The HSL values for `--mint`, `--ink`, and the rest live in `references/css-primitives.css`.

## Bringing it all together — page composition order

A typical subpage on a kids-studio site:

1. `<Navbar>` — scroll-aware, cream-to-cream on scroll, wordmark + logo
2. `<PageHero>` — warm gradient + doodles + sticker tag + italic-wonk headline
3. First content section — `<SectionHeader>` + card grid (the card recipe)
4. Second content section — `<SectionHeader>` (different accent) + different pattern (e.g., rows of icon cards)
5. One dark / colored-panel section — big Fraunces headline, often a manifesto or pull-quote
6. `<OtherPrograms>` or similar cross-link grid
7. `<BookingCTA>` — primary red panel with the big arrow button
8. `<Footer>` — dark ink, multi-column link grid, wordmark

Homepage is more elaborate (polaroid hero collage, marquee stats stripe, program preview, theme grid, collaboration wall) but follows the same grammar.

## Reference files

Read these on demand — you don't need all of them for every task.

- `references/css-primitives.css` — full CSS (colors, utilities, animations)
- `references/Doodles.tsx` — all SVG doodle components
- `references/SectionHeader.tsx` — reusable section header
- `references/PageHero.tsx` — warm-gradient subpage hero
- `references/OtherPrograms.tsx` — cross-link sticker-card pair pattern
- `references/ProgramFeatures.tsx` — 5-card feature grid + method panel (generalizable)
- `references/card-patterns.md` — detailed card variants with sample code
- `references/color-palette.md` — HSL values, usage guidelines, dark-panel picks
- `references/homepage-recipe.md` — full homepage composition (hero collage, marquee, themes grid)

## Adapting for other brands

The One Grain build is ages 2–8, so its tokens lean toward tomato red, honey yellow, ocean blue, mint — saturated but not neon. For adaptations:

- **Baby / 0–3 brand:** shift accents to dusty pastels (muted pink `hsl(340 40% 80%)`, sage `hsl(140 25% 75%)`, buttercream `hsl(45 60% 88%)`). Keep all utility classes, swap only the `--primary` / `--secondary` / `--accent` HSL values.
- **Tween / 8–12 brand:** pull saturation up, lean into electric secondary (cobalt `hsl(220 80% 55%)`) and add one cool color. Reduce blob opacity — the tween eye tolerates more contrast.
- **Family café / playspace:** warmer overall (pumpkin primary `hsl(18 75% 55%)`, mustard accent), drop some of the children's scribble doodles, keep polaroid/tape treatment for food photography.

In every case, **keep the structural system** — rotated cards with tinted backings, -6° chips, italic-wonk accent words, handwritten annotations, polaroid + tape. Just swap the palette.
