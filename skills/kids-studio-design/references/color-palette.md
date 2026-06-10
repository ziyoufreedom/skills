# Color Palette

HSL tokens and where each one shines. Keep the *structure* the same across brand adaptations; swap only the hue values.

## Base palette (One Grain default)

| Token | HSL | Where to use |
|-------|-----|--------------|
| `--background` | `38 55% 95%` | Full-page cream paper — never pure white, never grey |
| `--foreground` | `20 22% 13%` | Body text, dark CTAs, footer panel background |
| `--card` | `38 50% 97%` | Slightly lighter than background, for polaroid mats and sticker backings |
| `--primary` | `8 72% 52%` | Tomato red — headline emphasis, CTA panel, chapter-II chip |
| `--secondary` | `204 65% 53%` | Ocean blue — "world" accent, chapter-III chip, secondary CTAs |
| `--accent` | `45 92% 55%` | Honey yellow — sparkle doodles, chapter-I chip, sticker taglines |
| `--mint` | `158 42% 55%` | Mint — fourth-chip color, "now open" status, blob-3 fill |
| `--ink` | `20 22% 13%` | Footer panel, dark pills. Same hue as `--foreground` |
| `--muted` | `35 25% 88%` | Info card backgrounds, secondary text |
| `--muted-foreground` | `20 10% 40%` | Label text, kickers, small hints |

## Section backgrounds

| Context | Recommended value |
|---------|------------------|
| Default light section | `bg-background` |
| Card/dots pattern section | `bg-card` + `.bg-dots` |
| Manifesto / dark panel | Inline `style={{ background: "hsl(196 42% 24%)" }}` — warm deep ocean teal |
| Primary red CTA panel | `bg-primary text-primary-foreground` |
| Footer | `bg-foreground text-background` |

**Avoid:** Pure black (`#000`), pure grey section backgrounds, dark brown (`--foreground` as a hero backdrop feels oppressive on children's sites — owner rejected this on One Grain Philosophy page). Deep ocean teal solves it.

## Chip color cycle

When you have a list of items needing numbered/lettered chips, cycle colors in this order so no two adjacent siblings share a chip:

```ts
const chipColors = [
  "bg-primary text-primary-foreground",       // tomato
  "bg-accent text-foreground",                // honey
  "bg-secondary text-secondary-foreground",   // ocean
  "bg-mint text-foreground",                  // mint
  "bg-foreground text-background",            // ink
];

const tintColors = [
  "bg-primary/10",
  "bg-accent/20",   // honey reads thin at 10%, bump to 20%
  "bg-secondary/10",
  "bg-mint/20",     // same — mint needs 20%
  "bg-foreground/10",
];
```

Use `chipColors[i % 5]` for the chip, `tintColors[i % 5]` for the offset backing.

## When to accent on italic-wonk

One per title. Pick based on semantic weight:

- Titles about children, creativity, energy → `text-primary` (tomato)
- Titles about the world, exploration, connection → `text-secondary` (ocean)
- Titles about warmth, care, nurture → `text-foreground` (keep it subtle) or `text-accent` (careful — honey is hard to read on cream; only use on darker sections)
- Titles about nature, growth → `text-mint`

The crayon underline uses the same color logic:
`.crayon-underline-red` for tomato, `.crayon-underline-blue` for ocean, `.crayon-underline-mint` for mint. Default `.crayon-underline` is honey.

## Palette swaps for adaptation

### Baby / 0–3 brand (pastel soft)

```css
--primary: 340 45% 72%;          /* dusty rose */
--primary-foreground: 30 50% 98%;
--secondary: 195 35% 68%;        /* dusty sky */
--secondary-foreground: 30 50% 98%;
--accent: 45 55% 78%;            /* buttercream */
--accent-foreground: 20 25% 20%;
--mint: 140 25% 75%;             /* sage */
--ink: 20 15% 22%;               /* slightly lighter ink */
```

Dark panel: `hsl(195 25% 30%)` (misty blue instead of ocean teal).

### Tween / 8–12 brand (saturated, electric)

```css
--primary: 10 80% 58%;           /* vivid coral */
--secondary: 220 80% 55%;        /* cobalt */
--accent: 48 95% 58%;             /* lemon */
--mint: 165 55% 50%;              /* turquoise */
--ink: 220 30% 18%;               /* cool dark blue-black */
```

Dark panel: `hsl(220 40% 22%)` (deep cobalt).

### Family café / playspace (warm pumpkin)

```css
--primary: 18 75% 55%;            /* pumpkin */
--secondary: 200 40% 55%;         /* denim */
--accent: 40 80% 58%;             /* mustard */
--mint: 135 35% 50%;              /* leaf */
--ink: 15 30% 20%;                /* warm dark brown */
```

Dark panel: `hsl(18 40% 22%)` (burnt terracotta).
