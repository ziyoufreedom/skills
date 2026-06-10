# Card Patterns

Ready-to-paste card variants. All share the same foundation: rotated wrapper + tinted offset backing + `bg-background` border-card + `-6°` chip. Differences are in what goes inside.

## 1. Numbered sticker card — "principle" / "feature" card

The workhorse. Use for 3–6 items in a grid: principles, goals, benefits, features.

```tsx
<div
  className="relative h-full"
  style={{ transform: `rotate(${i % 2 === 0 ? -1.2 : 1.2}deg)` }}
>
  <span
    aria-hidden
    className={`absolute inset-0 ${tintColors[i % 5]} rounded-2xl translate-x-1.5 translate-y-2 -z-10`}
  />
  <div className="bg-background border border-foreground/10 rounded-2xl p-6 shadow-sm h-full">
    <div
      className={`w-11 h-11 rounded-full ${chipColors[i % 5]} flex items-center justify-center mb-4 shadow-md`}
      style={{ transform: "rotate(-6deg)" }}
    >
      <span className="font-display italic-wonk text-lg tabular-nums">
        {String(i + 1).padStart(2, "0")}
      </span>
    </div>
    <h3 className="font-display text-xl italic-wonk text-foreground mb-2 leading-tight">
      {item.title}
    </h3>
    <p className="font-body text-sm text-foreground/70 leading-relaxed">
      {item.description}
    </p>
  </div>
</div>
```

Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6`.

Rotation formula variants worth trying if `i % 2` feels too regular:
- `((i * 29) % 5) - 2` → values in {-2, -1, 0, 1, 2}, pseudo-random per index

## 2. Letter card — A.P.S.U.L. / big-initial card

For framework pillars. One very large letter, full-width single-column row.

```tsx
<div
  className="relative"
  style={{ transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)` }}
>
  <span
    aria-hidden
    className={`absolute inset-0 ${tint} rounded-3xl translate-x-2 translate-y-2 -z-10`}
  />
  <div className="bg-background border border-foreground/10 rounded-3xl p-6 md:p-8 shadow-sm
                  flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
    <div
      className={`w-24 h-24 md:w-28 md:h-28 rounded-full ${pill}
                  flex items-center justify-center shadow-xl flex-shrink-0`}
      style={{ transform: "rotate(-6deg)" }}
    >
      <span className="font-display italic-wonk text-5xl md:text-6xl leading-none">
        {letter}
      </span>
    </div>
    <div className="flex-1">
      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
        <h3 className="font-display text-3xl md:text-4xl italic-wonk">{title}</h3>
        <span className={`label px-2 py-0.5 rounded-full ${pill}`}>{subtitle}</span>
      </div>
      <p className="font-body text-base text-foreground/75 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
</div>
```

Grid: `space-y-8 md:space-y-10` (stacked rows, not a grid).

## 3. Age-pill cross-link card — "OtherPrograms" pattern

Two-card grid for "explore the other chapters" / related siblings. Compact, with a colored chip showing the defining attribute (age, level, chapter).

See `OtherPrograms.tsx` for the full reference. Key inner structure:

```tsx
<div className="bg-background border border-foreground/10 rounded-3xl p-5 sm:p-6
                flex items-center gap-5 shadow-sm transition-all duration-300
                group-hover:-translate-y-1 group-hover:shadow-xl">
  {/* age/level chip */}
  <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full bg-accent text-foreground
                  flex flex-col items-center justify-center shadow-lg flex-shrink-0"
       style={{ transform: "rotate(-6deg)" }}>
    <span className="font-display italic-wonk text-xl sm:text-2xl leading-none">2–4</span>
    <span className="label text-[0.55rem] opacity-80 mt-1">yrs</span>
  </div>
  {/* text */}
  <div className="flex-1 min-w-0 text-left">
    <p className="label text-muted-foreground mb-1 truncate">Chapter I</p>
    <h3 className="font-display text-2xl sm:text-3xl italic-wonk leading-none mb-1.5">
      Sensation
    </h3>
    <p className="font-body text-xs text-muted-foreground line-clamp-2">
      Body awareness & raw perception
    </p>
  </div>
  {/* arrow */}
  <span className="w-10 h-10 rounded-full bg-foreground text-background
                   flex items-center justify-center flex-shrink-0
                   group-hover:rotate-45 group-hover:bg-primary transition-all">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M7 3l4 4-4 4"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
</div>
```

## 4. Polaroid-image card — photo-first card

For program levels, location showcases, testimonial-with-portrait cards. Image in a white polaroid mat with a washi tape strip peeling off the top edge.

```tsx
<div className="polaroid aspect-[4/5] sm:aspect-[3/2.2]"
     style={{ transform: `rotate(${i % 2 === 1 ? 1.2 : -1.2}deg)` }}>
  <span className={`tape ${tapeColor}`}
        style={{
          top: "-0.6rem",
          left: i % 2 === 1 ? "62%" : "18%",
          transform: `rotate(${i % 2 === 1 ? 8 : -8}deg)`,
        }} />
  <img src={image} alt={alt}
       style={{ objectPosition: imagePosition ?? "center 30%" }}
       className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" />

  {/* Optional corner badge */}
  <div className="absolute top-4 left-4 flex items-center gap-2
                  bg-background/95 px-3 py-1.5 rounded-full shadow-sm">
    <span className="w-2 h-2 rounded-full bg-primary" />
    <span className="label text-foreground/70">Chapter I</span>
  </div>

  {/* Optional age pill in the opposite corner */}
  <div className="absolute bottom-5 right-5 bg-accent text-foreground
                  px-6 py-3 rounded-full flex items-baseline gap-2 shadow-xl"
       style={{ transform: "rotate(-4deg)" }}>
    <span className="font-display text-3xl italic-wonk tabular-nums leading-none">2–4</span>
    <span className="label opacity-75">yrs</span>
  </div>

  <span className="polaroid-caption">tiny hands, big feelings</span>
</div>
```

Pair with a tinted backing `<span>` behind it for extra depth, rotated opposite direction.

## 5. Blob-photo sticker card — theme grid / gallery

For topic/theme grids where the image itself is the primary content. Photo masked with an organic `blob-*` border-radius, wrapped in a tinted sticker card.

```tsx
<Link to={path} className="group block relative"
      style={{ transform: `rotate(${t.rot}deg)` }}>
  {/* backing */}
  <div className={`absolute inset-0 ${t.bg} rounded-[2rem] translate-x-2 translate-y-3 -z-10`} />

  <div className="bg-background rounded-[2rem] p-5 pb-6 shadow-xl border border-foreground/5
                  transition-transform duration-500 group-hover:-translate-y-2">
    {/* blob-masked photo */}
    <div className={`relative overflow-hidden ${t.shape} aspect-[4/3] mb-4`}>
      <img src={t.image} alt={t.title}
           className="w-full h-full object-cover
                      transition-transform duration-[1000ms] group-hover:scale-[1.06]" />
      {/* number bubble in corner */}
      <div className={`absolute top-4 left-4 w-12 h-12 rounded-full ${t.pill}
                       flex items-center justify-center shadow-lg`}>
        <span className="font-display italic-wonk text-lg">{t.n}</span>
      </div>
    </div>

    <div className="flex items-baseline justify-between gap-3">
      <h3 className="font-display text-3xl italic-wonk">{t.title}</h3>
      {/* hover-revealed arrow */}
      <span className="w-8 h-8 rounded-full bg-foreground text-background
                       flex items-center justify-center opacity-0 translate-y-2
                       group-hover:opacity-100 group-hover:translate-y-0 transition-all">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M3 11L11 3M5 3h6v6"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
    <p className="font-body text-sm text-muted-foreground mt-1">{t.sub}</p>
  </div>
</Link>
```

Cycle `blob-1` / `blob-2` / `blob-3` / `blob-4` across siblings.

## 6. Colored-stripe principle card

For philosophy / manifesto principles where the text *is* the main content and each item has a color identity. Vertical colored left stripe + number chip + text.

```tsx
<div
  className="relative"
  style={{ transform: `rotate(${i === 1 ? 0.8 : -0.8}deg)` }}
>
  <span
    aria-hidden
    className={`absolute inset-0 ${tint} rounded-3xl translate-x-2 translate-y-2 -z-10`}
  />
  <div className={`bg-background border-l-[6px] ${stripeColor} border-y border-r border-foreground/10
                   rounded-3xl p-6 md:p-8 shadow-sm
                   flex flex-col md:flex-row gap-5 md:gap-8`}>
    <div
      className={`w-16 h-16 rounded-full ${pill}
                  flex items-center justify-center shadow-lg flex-shrink-0`}
      style={{ transform: "rotate(-6deg)" }}
    >
      <span className="font-display italic-wonk text-xl tabular-nums">{k}</span>
    </div>
    <div className="flex-1">
      <h3 className="font-display text-2xl md:text-3xl italic-wonk mb-3 leading-tight">
        {title}
      </h3>
      <p className="font-body text-base text-foreground/75 leading-relaxed">
        {body}
      </p>
    </div>
  </div>
</div>
```

Each sibling gets a different `stripeColor`: `border-primary` / `border-secondary` / `border-accent` / `border-mint`.

## 7. Inverse CTA panel — primary red section card

For emphasis sections that should look invited-in. Red background, decorative doodles, large white/accent type. Usually the `<BookingCTA>` or major invite sections.

See the CTA recipe in SKILL.md — key pieces:

- `bg-primary text-primary-foreground` on the outer section
- 4–5 absolute-positioned doodles (Sun/Cloud/Heart/Flower/Star/Sparkle) with `float-y`/`bounce-soft`/`wobble`
- Oversized `<div aria-hidden>` with italic-wonk word at `text-primary-foreground/10` as a watermark
- Large centered headline with one `italic-wonk text-accent` word
- Handwritten annotation above the headline ("psst — come say hi ✿")
- Big dark pill CTA with rotating arrow
- Sticker cluster below CTA (3 max): free trial, ages 2–8, small classes

## 8. Glass info card — icon-led contact/info card

For contact info, studio hours, address blocks — short key/value pairs.

```tsx
<div
  className="relative"
  style={{ transform: `rotate(${i % 2 === 0 ? -0.8 : 0.8}deg)` }}
>
  <div className="bg-background border border-foreground/10 rounded-2xl p-5 shadow-sm h-full">
    <div className="flex items-start gap-3">
      <span
        className={`w-10 h-10 rounded-full ${pill}
                    flex items-center justify-center shadow-md flex-shrink-0`}
        style={{ transform: "rotate(-6deg)" }}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="label text-muted-foreground mb-0.5">{label}</p>
        <p className="font-body text-foreground font-medium break-words">{value}</p>
      </div>
    </div>
  </div>
</div>
```

Skip the backing `<span>` here — these cards cluster tight in grids and backings start to overlap ugly. Add them only when cards are spaced apart.
