---
name: local-biz-astro
description: |
  Full-stack Astro-based SEO website production workflow for local service businesses (spa, massage, salon, clinic, medspa, acupuncture, hair studio, pediatric dental, etc.).
  Triggers when the user asks for: "local business Astro site", "spa/massage Astro website", "新做一个 local biz 站 用 Astro", "build a client site on Astro", "clinic SEO website Astro", or mentions the 6-phase pipeline (Intake / SEO Blueprint / Content & Code / SEO Guide / Tech Pack / Launch) for a brick-and-mortar service business with an Astro stack.
  This skill REPLACES the older local-biz-website skill (Vite + React SPA + prerender.mjs architecture) for all new client work. Always use this skill when the user wants a new local biz client site built on Astro, or when migrating an existing local-biz-website project to Astro.
---

# Local Business Astro Website Skill

Full production pipeline for building local-business SEO websites on **Astro 4 (SSG)**. Content-as-data, zero-JS-by-default HTML, JSON-LD `@graph`, React islands only where interactivity is required.

**Stack:** Astro 4 · TypeScript strict · Tailwind (HSL variable design tokens) · React 18 (islands only) · Cloudflare Pages.

This skill supersedes `local-biz-website` (Vite+React SPA+prerender.mjs). The prerender / SSR-fallback-as-LCP gymnastics are not needed when Astro emits real static HTML at build time.

## 为什么用 Astro 而不是 Vite+React+prerender

| 维度 | Astro(本 skill) | Vite+React+prerender.mjs(旧 skill) |
|---|---|---|
| 静态页面 JS 载荷 | 0(除非 `client:*`) | React runtime 必发,全站 hydrate |
| Island 架构 | 原生 `client:load / visible / idle` | 手搓;全页 hydrate 或自己拆 entry |
| 生成 HTML | 从源直出(确定性,2 秒 55 页) | headless 浏览器 crawl(1–5 秒/页) |
| 路由 | FS-based + `getStaticPaths` | react-router + prerender 脚本 |
| SEO head | frontmatter / layout 内写 `<head>` | react-helmet,易水合不一致 |
| LCP / CWV | 先天好(HTML 先到,无 hydrate 抖动) | 需要 SSR-fallback-as-LCP hack |
| 字体 | 自托管 woff2 + `preload` | 同 |
| Tailwind | `@astrojs/tailwind` 一行 | 手配 PostCSS |

Local biz 站 99% 内容静态(home / services / locations / reviews / FAQ),**Astro 是甜蜜点**。

---

## 阶段总览

| Phase | Claude 做什么 | 产物 |
|---|---|---|
| **1 INTAKE** | 解析业务信息 + web verify + 竞品调研 | `project.json` |
| **2 SEO BLUEPRINT** | 关键词地图 + 15–25 页 slug + 链接网 | `seo-blueprint.md` + `project.json.seo` |
| **3 CONTENT & CODE** | Astro pages + content-as-data + schema helpers + islands | `src/pages/`、`src/layouts/`、`src/lib/` |
| **4 SEO GUIDE** | S1–S10 战略展示页(wintrabiz.com upsell) | `src/pages/seo-guide.astro` |
| **5 TECH PACK** | sitemap 生成脚本 + robots.txt + CF 配置 + 字体 | `scripts/` + `public/` |
| **6 LAUNCH** | 发布前后 checklist | `checklist.md` |

---

## 架构硬约束(每个新项目必须遵守)

1. **用 Astro 4 SSG,不用 SSR / 不用 prerender crawler。**Astro `astro build` 直出 HTML,不需要 headless 浏览器。
2. **`build.format: "directory"`** —— URL `/services/deep-tissue/` 结构,CF Pages 原生支持,`dist/404.html` 由 Astro 自动 emit(路径特殊处理)。
3. **所有 content 是 typed TS 对象** —— `src/lib/content/` 下每种内容一个文件(locations / services / faq / testimonials),dynamic 路由用 `getStaticPaths` 迭代 record。**不要手写多个同结构的 page,用 record + 模板。**
4. **JSON-LD 通过 helper 函数统一生成** —— 不在每个页面复制 schema 字符串。`src/lib/seo/schemas.ts` 导出 `makeLocalBusiness / makeOrganization / makeFAQPage / makeBreadcrumb / makeService`,页面组合 `jsonLd` 数组传给 Layout,Layout 发一个 `@graph` block。
5. **React 岛最小化** —— 默认 `.astro` 静态渲染,只有真正要交互的组件才用 React(目前基本只有 `BookingModal`,用 `client:load`)。不要用 React 做 SEO 标签管理,不要用 useEffect 改 title。
6. **字体自托管** —— 从 Google Fonts 下 woff2(只要 latin 子集),放 `public/fonts/`,`<link rel="preload">` + `font-display: swap`。不写 `@import url('fonts.googleapis.com')`,不发 `<link>` 到 Google 域。
7. **禁止联系表单输入框** —— `/contact` 用 `mailto:` 按钮。无 form state、无 API、无 POST 端点。
8. **所有 `.md` 文件 gitignore** —— `.gitignore` 加 `*.md`。`CLAUDE.md`、`AUDIT.md`、`checklist.md` 全部本地。
9. **commit 不带 `Co-Authored-By: Claude`** —— 干净 git 历史。

---

## PHASE 1 — INTAKE

和旧 skill 完全一致,直接复用。

### 流程

1. 用户给业务信息 → 写进 `project.json`
2. **Web verify:** MassageBook / Yelp / GBP / 官网交叉验证,只用可核实数据
3. 多源冲突 → flag 让用户决定
4. **主动搜竞品,不靠用户给 list**
5. **Phase 3 前问内容限制**(e.g., "不展示价格")

### 必填字段

```
business_name, address, phone, email, hours, services[],
service_area (primary city + neighborhoods + nearby_cities),
booking_link, target_customer, competitors[],
google_business_url, social_media
```

### 选填字段

```
add_on_services[], content_restrictions[], ratings,
reviews_highlights[], payment_methods, established_year,
owner_name, certifications[], brand_colors, brand_fonts
```

### `project.json` 输出

```json
{
  "business": {
    "name": "", "address": "", "phone": "", "email": "",
    "hours": {}, "services": [], "add_ons": [],
    "service_area": { "primary": "", "neighborhoods": [], "nearby_cities": [] },
    "booking_link": "", "google_business_url": "",
    "social_media": {}, "ratings": {}, "reviews_highlights": [],
    "content_restrictions": [],
    "competitors": [], "target_customer": ""
  },
  "brand": {
    "primary_hsl": "", "secondary_hsl": "",
    "font_heading": "", "font_body": ""
  }
}
```

---

## PHASE 2 — SEO BLUEPRINT

### 关键词策略

1. **Primary** → `{service_type} + {primary_city}`
2. **Service** → `{service} + {city}`(每个服务一条)
3. **Location** → `{service_type} + {nearby_city}`(每个附近城市一条)
4. **Authority** → `best/top-rated {service_type} {city}` + evergreen 话题
5. **生成 15–25 个 slug**

### URL 规范

```
首页:         /
服务总览:     /services
服务单页:     /services/{service-slug}-{city}
门店总览:     /locations     (多门店时)
门店单页:     /locations/{neighborhood-or-city}
攻略单页:     /guides/{topic-slug}
核心:         /about  /contact  /faq
SEO 展示页:   /seo-guide
```

### 页面数量目标

- Core: 5(Home / About / Services hub / Contact / FAQ)
- Service: 每个主服务 1 页(6–10 页)
- Location: 每个附近城市 + 1 "near me"(4–6 页)
- Authority: 3–5 篇 evergreen
- 多门店客户: 每个门店 1 页(2–5 页)
- SEO 展示: 1 页(`/seo-guide`)

### Location pages 必须包含

每个 nearby city → 本店的**开车时间 / 距离**。

### 每页 blueprint schema

```json
{
  "slug": "/services/deep-tissue-massage-newberg",
  "title": "Deep Tissue Massage in Newberg, OR | {Business Name}",
  "meta_description": "(150–160 字符,含关键词 + CTA)",
  "h1": "Deep Tissue Massage in Newberg",
  "target_keyword": "deep tissue massage newberg",
  "secondary_keywords": [],
  "internal_links_to": [],
  "page_type": "service|location|authority|core"
}
```

### 输出

写进 `project.json.seo.pages[]`,外加人读的 `seo-blueprint.md`。

---

## PHASE 3 — CONTENT & CODE(Astro 版 ⭐)

### 推荐目录结构

```
src/
  pages/
    index.astro                  # home (/)
    about.astro
    contact.astro
    faq.astro
    services/
      index.astro                # /services hub
      [slug].astro               # /services/[slug] dynamic
    locations/
      index.astro                # /locations hub (多门店时)
      [slug].astro               # /locations/[slug] dynamic
    guides/
      [slug].astro               # /guides/[slug]
    seo-guide.astro              # /seo-guide (Phase 4)
    404.astro                    # Astro 自动 emit 到 /404.html
  layouts/
    SiteLayout.astro             # 全站壳:BaseHead + Nav + Footer + slot
  components/
    BaseHead.astro               # <head> 注入,接 jsonLd 数组
    Navbar.astro
    Footer.astro
    PageHero.astro               # 内页 hero
    FAQSection.astro             # 手风琴 FAQ(纯 CSS 或 details/summary)
    BookingCTA.astro             # 预约 CTA 区
    BookingModal.tsx             # ⚡ React 岛 (client:load),iframe 预约弹窗
    BookingProvider.tsx          # ⚡ React 岛 context(可选)
    ServiceCard.astro
    LocationCard.astro
    ReviewCard.astro
  lib/
    content/
      business.ts                # NAP、hours、social、logo 等常量
      services.ts                # services record (slug → ServiceContent)
      locations.ts               # locations record (slug → LocationContent,多门店时)
      faq.ts                     # faqs record by page
      testimonials.ts
    seo/
      schemas.ts                 # JSON-LD helper 函数
      pages.ts                   # per-route SEO metadata record
  styles/
    global.css                   # HSL tokens + @tailwind
public/
  fonts/                         # 自托管 woff2
  images/
  robots.txt
  favicon.ico  (+ favicon-16/32/64.png, apple-touch-icon.png, logo.png)
scripts/
  generate-sitemap.mjs           # post-build sitemap 遍历 dist/
astro.config.mjs
tailwind.config.mjs
tsconfig.json
package.json
.gitignore                       # 含 *.md
```

### Content-as-data —— 类型定义模板

`src/lib/content/services.ts`:

```ts
export interface ServiceContent {
  slug: string;                  // "deep-tissue-massage-newberg"
  name: string;                  // "Deep Tissue Massage"
  city: string;                  // "Newberg"
  kicker: string;                // eyebrow text
  h1: string;
  deck: string;                  // subhead paragraph
  heroImage: string;             // /images/services/...
  durationMinutes: number;
  price?: number;                // respect content_restrictions.no_prices
  benefits: string[];
  whoItsFor: string[];
  whatToExpect: { step: string; body: string }[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];        // 2-3 other services / locations
}

export const services: Record<string, ServiceContent> = {
  "deep-tissue-massage-newberg": {
    slug: "deep-tissue-massage-newberg",
    name: "Deep Tissue Massage",
    city: "Newberg",
    kicker: "60 or 90 minutes",
    h1: "Deep Tissue Massage in Newberg, OR",
    deck: "Shoulders locked up after a week hunched at the desk? A deep tissue session with our Newberg team gets into the knots Swedish can't reach — especially if you've been holding onto it for more than a month.",
    heroImage: "/images/services/deep-tissue.webp",
    durationMinutes: 60,
    benefits: [
      "Releases chronic muscle tension in upper back, neck, shoulders",
      "Targets specific trigger points (scalenes, piriformis, glute med)",
      "Improves range of motion — measurable within one session",
    ],
    whoItsFor: ["Desk workers with chronic upper-back tightness", "Athletes recovering from heavy training", "Anyone with old injury flare-ups"],
    whatToExpect: [
      { step: "Intake (5 min)", body: "We ask what hurts, what you've tried, any medical concerns — then agree on pressure and focus areas." },
      { step: "Session (60 or 90 min)", body: "Slower, deeper strokes into the target muscle groups. Communication throughout; if pressure is too much, we adjust." },
      { step: "Aftercare (5 min)", body: "Water, stretches to try at home, rebook cadence." },
    ],
    faq: [
      { question: "Does deep tissue hurt?", answer: "It should never be sharp pain. A 'good-hurt' ache is normal; anything sharper and we lighten up. You are the dial, not us." },
    ],
    relatedSlugs: ["swedish-massage-newberg", "sports-massage-newberg"],
  },
  // ... 更多服务
};

export const serviceSlugs = Object.keys(services);
```

`src/lib/content/locations.ts`(多门店时):

```ts
export interface LocationContent {
  slug: string;                  // "tigard"
  name: string;                  // "Tigard"
  displayName: string;           // "Yang's Massage Tigard"
  address: {
    street: string;
    city: string;
    region: string;              // "OR"
    postalCode: string;
    country: string;             // "US"
  };
  phone: string;
  email?: string;
  hours: Record<string, string>; // { Monday: "9:00-19:00", ... }
  geo: { lat: number; lng: number };
  googleMapEmbed: string;        // iframe src
  driveTimeFrom: { city: string; minutes: number; miles: number }[];
  neighborhoods: string[];
  servicesOffered: string[];     // slugs from services.ts
  photos: string[];
  reviewsHighlights: { author: string; rating: number; text: string; date: string }[];
  aggregateRating?: { value: number; count: number };
}

export const locations: Record<string, LocationContent> = {
  tigard: { /* ... */ },
  newberg: { /* ... */ },
};

export const locationSlugs = Object.keys(locations);
```

`src/lib/content/faq.ts`:

```ts
export interface FaqItem { question: string; answer: string; }

export const faqByPage: Record<string, FaqItem[]> = {
  home: [ /* ... */ ],
  services: [ /* ... */ ],
  // 每个 page_type 一组
};
```

### 动态路由 —— `src/pages/services/[slug].astro` 骨架

```astro
---
import type { GetStaticPaths } from "astro";
import SiteLayout from "@/layouts/SiteLayout.astro";
import PageHero from "@/components/PageHero.astro";
import FAQSection from "@/components/FAQSection.astro";
import BookingCTA from "@/components/BookingCTA.astro";
import { services } from "@/lib/content/services";
import { business } from "@/lib/content/business";
import {
  makeService, makeBreadcrumb, makeFAQPage, makeLocalBusiness,
} from "@/lib/seo/schemas";

export const getStaticPaths = (() => {
  return Object.entries(services).map(([slug, content]) => ({
    params: { slug },
    props: { content },
  }));
}) satisfies GetStaticPaths;

const { content } = Astro.props;
const slug = `/services/${content.slug}`;

const title = `${content.name} in ${content.city} | ${business.name}`;
const description = content.deck.slice(0, 160);

const jsonLd = [
  makeService({
    name: content.name,
    description: content.deck,
    url: slug,
    providerName: business.name,
    areaServed: content.city,
    image: content.heroImage,
  }),
  makeBreadcrumb([
    { name: "Home", url: "/" },
    { name: "Services", url: "/services" },
    { name: content.name, url: slug },
  ]),
  ...(content.faq.length > 0 ? [makeFAQPage(content.faq)] : []),
];
---
<SiteLayout
  title={title}
  description={description}
  ogImage={content.heroImage}
  jsonLd={jsonLd}
  ogType="article"
  article={{
    publishedTime: "2026-04-01",
    modifiedTime: "2026-04-01",
    section: "Services",
  }}
>
  <PageHero kicker={content.kicker} title={content.h1} subtitle={content.deck} image={content.heroImage} />

  <section class="container mx-auto px-4 py-16">
    <h2 class="font-heading text-3xl">What you get</h2>
    <ul class="mt-6 space-y-3">
      {content.benefits.map((b) => <li class="flex gap-3"><span class="text-accent">·</span>{b}</li>)}
    </ul>
  </section>

  <section class="bg-secondary py-16">
    <div class="container mx-auto px-4">
      <h2 class="font-heading text-3xl">What to expect</h2>
      <ol class="mt-8 grid gap-6 md:grid-cols-3">
        {content.whatToExpect.map((s, i) => (
          <li>
            <div class="font-heading text-4xl text-accent">{i + 1}</div>
            <div class="mt-2 font-medium">{s.step}</div>
            <p class="mt-2 text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>

  {content.faq.length > 0 && <FAQSection faqs={content.faq} />}
  <BookingCTA />
</SiteLayout>
```

### SiteLayout 的 `<head>` 注入模板

见 `references/Layout-astro-template.astro`。支持:

- `title` + `description` + `canonical`(自动从 `Astro.url.pathname` + `Astro.site` 组)
- OG / Twitter meta
- `ogType="article"` 时的 `article:published_time / modified_time / section / author`
- `jsonLd` 数组包成一个 `@graph` block
- `robots` 覆盖(默认 `index,follow`)
- 字体自托管 preload

### Schema Helper 函数

见 `references/seo-schema-helpers.ts`。核心:

- `makeOrganization(business)` — 全站 publisher,Home 页 emit
- `makeLocalBusiness(location)` — 单门店 `LocalBusiness` / `DaySpa` / `BeautySalon` / `MassageTherapy`
- `makeService(params)` — 服务页 `Service` schema
- `makeFAQPage(faqs)` — 任何含 FAQ 区的页
- `makeBreadcrumb(crumbs)` — 所有内页
- `makeArticle(params)` — 攻略 / 博客页

### React 岛 —— BookingModal 接入

```tsx
// src/components/BookingModal.tsx
import { useState } from "react";

interface Props {
  bookingUrl: string;
  triggerLabel?: string;
}

export default function BookingModal({ bookingUrl, triggerLabel = "Book Now" }: Props) {
  const [open, setOpen] = useState(false);

  function handleClick(e: React.MouseEvent) {
    if (window.innerWidth < 768) {
      // mobile: open in new tab (iframe scrolling unreliable on mobile)
      window.open(bookingUrl, "_blank", "noopener,noreferrer");
      e.preventDefault();
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button onClick={handleClick} className="...">{triggerLabel}</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white w-full max-w-3xl h-[95vh] rounded overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-medium">Book an appointment</span>
              <button onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
            <iframe src={bookingUrl} className="w-full h-[calc(95vh-44px)]" title="Booking" />
          </div>
        </div>
      )}
    </>
  );
}
```

挂载:

```astro
---
import BookingModal from "@/components/BookingModal.tsx";
import { business } from "@/lib/content/business";
---
<BookingModal client:load bookingUrl={business.booking_link} />
```

**选 `client:load` 因为** CTA 按钮在首屏,要立即可交互。若有次屏的预约按钮可以用 `client:visible`。

### Tailwind 设计 tokens(含双品牌切换)

见 `references/global-css-tokens.css` 和下面的双品牌约定。

`src/styles/global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Ink scale (body / headings) */
    --ink: 220 30% 10%;
    --ink-soft: 220 18% 25%;
    --ink-muted: 220 10% 45%;

    /* Paper (backgrounds) */
    --paper: 36 30% 98%;
    --paper-soft: 36 20% 94%;

    /* Rule (hairlines) */
    --rule: 30 12% 86%;

    /* Primary brand — OVERRIDE per client */
    --primary: 155 32% 28%;          /* sample: deep moss (Yang's Massage) */
    --primary-soft: 155 22% 92%;
    --primary-ink: 155 32% 18%;

    /* Accent (CTA, small highlights) — OVERRIDE per client */
    --accent: 22 74% 42%;            /* sample: editorial ochre */
    --accent-soft: 28 60% 90%;
    --accent-ink: 22 74% 28%;

    /* Success / warning (keep stable across brands) */
    --success: 145 55% 35%;

    --radius: 4px;
  }

  /* Yang's Spa brand override — switch via body class or page-level :where() */
  [data-brand="yangs-spa"] {
    --primary: 340 36% 50%;          /* warm pink */
    --primary-soft: 340 30% 94%;
    --primary-ink: 340 36% 35%;
    --accent: 40 82% 50%;            /* gold */
  }
}
```

`tailwind.config.mjs`:

```js
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "hsl(var(--ink))",
          soft: "hsl(var(--ink-soft))",
          muted: "hsl(var(--ink-muted))",
        },
        paper: {
          DEFAULT: "hsl(var(--paper))",
          soft: "hsl(var(--paper-soft))",
        },
        rule: "hsl(var(--rule))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          soft: "hsl(var(--primary-soft))",
          ink: "hsl(var(--primary-ink))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          soft: "hsl(var(--accent-soft))",
          ink: "hsl(var(--accent-ink))",
        },
        success: "hsl(var(--success))",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "ui-serif", "Georgia", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

**双品牌切换用法:** 在 `<body data-brand="yangs-spa">` 切换,或为特定子目录页面单独注入 `<body class="yangs-spa">`。换 brand 只改变量,组件代码完全复用。

### 内容规则(适用所有文案)

1. **尊重 content_restrictions**(`no_prices` → 页面不出现金额)
2. **关键词密度** —— 目标词自然出现 3–5 次/页,不堆砌
3. **词数** —— Home 600–800 / Service 500–700 / Location 400–600 / Guide 700–1000
4. **本地细节** —— 真实地名、地标、街道、highway 名;不写 "your city"
5. **每页结尾 Booking CTA**
6. **人味写作(Anti-AI Voice)** —— 句长多变,短句 + 长句混用;偶尔破折号、片段句;"honestly"、"here's the thing"、"the short answer is" 这种口头语;避开 "committed to / strive to / designed to enhance"
7. **联系页用 `mailto:`,不做 form input**

### 页面组件结构(服务 / 门店 / 攻略)

```
<SiteLayout>
  <PageHero kicker title subtitle image />
  <ContentSection>  (intro + image 左右排)
  <BenefitsSection>  (bg-primary-soft,卡片网格)
  <WhyChooseUs>      (信任信号)
  <FAQSection faqs={[...]} />
  <RelatedList>      (2-3 条)
  <BookingCTA />
</SiteLayout>
```

### 并行化加速 Phase 3

Astro 比 React 工作量少(每页少 ~40% 代码,无路由注册),但文件仍多。并行 agent 策略:

- Agent 1: `lib/content/services.ts` + `lib/content/locations.ts`
- Agent 2: `lib/content/faq.ts` + `lib/content/testimonials.ts` + `lib/content/business.ts`
- Agent 3: `lib/seo/schemas.ts` + `lib/seo/pages.ts`
- Agent 4: 静态页(`index.astro` / `about.astro` / `contact.astro` / `faq.astro` / `services/index.astro` / `locations/index.astro`)
- Agent 5: 模板组件(`PageHero / FAQSection / BookingCTA / ServiceCard / LocationCard`)
- Agent 6(若 ≥ 5 门店或 ≥ 10 服务): 拆模板渲染以外的门店 / 服务专属 copy

**⚠️ Slug 一致性规则:** 每个 agent prompt 必须包含完整的 slug 列表(来自 `project.json.seo.pages[]`),否则 agent 会猜缩略路径(如 `/services/swedish-massage` 而非 `/services/swedish-massage-newberg`)导致全站死链。

agents 跑完后用 `scripts/check-links.mjs` 跑一次(见 Phase 5 的 reference 脚本)。

---

## PHASE 4 — SEO GUIDE(`/seo-guide`)

结构和旧 skill 完全一致,**S1–S10 十段**。技术上从 `.tsx` 改写成 `.astro`,数据从 `src/lib/content/seo-guide.ts` 读(typed)。

### 数据源

若用户提供了竞品审计报告(如 `YongeRehabCA.md`),从中提取 competitor / keyword / market 数据。否则用 Phase 1-2 的竞品数据。

### 路由 & 文件

- Route: `/seo-guide`
- 文件: `src/pages/seo-guide.astro`
- 重定向 `/seo` → `/seo-guide`:放 `public/_redirects`(Cloudflare Pages 原生)

### 页面结构

| Section | Title 规则 | 内容 |
|---|---|---|
| **S1 Hero** | "{City} *{Business Type} Guide*" | 深色背景(`bg-primary`),`<em>` 斜体金色 accent;两个 CTA |
| **S2 Market Overview** | "{City} {Business Type} Market" | 3 张卡片描述竞品 archetype(Chain / Legacy / Independent) |
| **S3 Competitors** | "Local Competitors" | 竞品卡片网格(name / type badge / strengths / distance) |
| **S4 SEO Opportunity** | "SEO Opportunity" | 6–8 个目标关键词网格 |
| **S5 Strategy Pyramid** | "SEO Strategy Map" | 深色背景,金字塔:Tier 1 Home → Tier 2 Location → Tier 3 Services → Tier 4 Long-tail |
| **S6 Long-Tail Pages** | "N Long-Tail SEO Pages" | 关键词卡片 + Active / Planned badge;Active 可点跳路由 |
| **S7 Link Structure** | "Internal Link Structure" | 流程图:Home → Location → Service → Long-tail |
| **S8 Map Ranking** | "Google Map Ranking Strategy" | 4 个因子卡片(Reviews / Local Keywords / Website SEO / NAP Consistency) |
| **S9 Impact(UPSELL)** | "Expected Business Impact" | 深色背景,4 个 impact 卡 + CTA 到 wintrabiz.com(Tiffany Blue `bg-[#81D8D0]`) |
| **S10 Visit CTA** | "Visit {Business Name}" | Address / phone / email + 图标,Book + Services 按钮,结尾斜体链到 wintrabiz.com |

### 样式约定

- **深色 section**(S1 / S5 / S9): `bg-primary text-primary-foreground`,金色 accent
- **亮 section**(S2 / S4 / S6 / S8 / S10): 默认背景
- **Muted section**(S3 / S7): `bg-paper-soft`
- **动画:** Astro 下不强求 framer-motion。若要入场动画,用 **CSS** `@keyframes fade-up` + `animation-delay`,或者**只在这一页**用 `<motion.div client:visible>` React 岛(次屏 lazy,不影响首页性能)
- **图标:** `lucide-react` 用在 islands 里,或者改用纯 SVG inline(首选,避免一个图标就 hydrate)
- **字体:** `font-heading` + `font-body`,通过 CSS 变量切换

### 参考模板

见旧 skill `references/seo-guide-template.md`,把 `.tsx` 写法改成 `.astro` 即可(不换结构)。

---

## PHASE 5 — TECH PACK(Astro 版)

### 5.1 `astro.config.mjs` 模板

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://www.example.com",        // 替换为客户 canonical
  build: {
    format: "directory",                  // /services/foo/ 风格,CF Pages 友好
  },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }), // 我们自己在 global.css 里写 base
  ],
  vite: {
    ssr: {
      noExternal: ["clsx", "tailwind-merge"],
    },
  },
});
```

### 5.2 `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*", ".astro/types.d.ts"],
  "exclude": ["dist", "node_modules"]
}
```

### 5.3 `package.json` scripts

```json
{
  "scripts": {
    "dev": "astro dev --port 4321 --host",
    "build": "astro build && node scripts/generate-sitemap.mjs",
    "preview": "astro preview --port 4321 --host",
    "check": "astro check",
    "audit:links": "node scripts/check-links.mjs",
    "audit:assets": "node scripts/check-assets.mjs"
  }
}
```

### 5.4 `scripts/generate-sitemap.mjs` 模板

```js
/**
 * Post-build: walks dist/ for index.html files and writes sitemap.xml.
 * Replaces @astrojs/sitemap (which breaks on Astro 4.16 with directory format).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const DOMAIN = (process.env.SITE_DOMAIN || "https://www.example.com").replace(/\/$/, "");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "_astro") out.push(...walk(full));
    else if (e.isFile() && e.name === "index.html") out.push(full);
  }
  return out;
}

function priority(route) {
  if (route === "/") return "1.0";
  if (/^\/(about|contact|faq|services|locations)\/?$/.test(route)) return "0.9";
  if (route.startsWith("/services/")) return "0.8";
  if (route.startsWith("/locations/")) return "0.8";
  if (route.startsWith("/guides/")) return "0.7";
  if (route === "/seo-guide") return "0.6";
  return "0.5";
}

function changefreq(route) {
  if (route === "/") return "weekly";
  if (route.startsWith("/guides/")) return "monthly";
  return "monthly";
}

const today = new Date().toISOString().split("T")[0];
const files = walk(DIST);
const routes = files
  .map((f) => {
    const rel = path.relative(DIST, f).replace(/\\/g, "/").replace(/\/?index\.html$/, "");
    return rel === "" ? "/" : `/${rel}`;
  })
  .filter((r) => !r.includes("/404"))
  .sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => {
  const loc = r === "/" ? `${DOMAIN}/` : `${DOMAIN}${r}`;
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq(r)}</changefreq>\n    <priority>${priority(r)}</priority>\n  </url>`;
}).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
console.log(`Wrote sitemap.xml (${routes.length} URLs)`);
```

### 5.5 `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://www.example.com/sitemap.xml
```

### 5.6 Cloudflare Pages 配置

- **Build command:** `npm run build`
- **Build output:** `dist`
- **环境变量:** `NODE_VERSION=20`(CF 默认偏老,Astro 4.16 要求 ≥ 18.17 / 20.3 / 22)
- **环境变量(可选):** `SITE_DOMAIN=https://www.example.com` 用于 preview deploy 换域名
- **404:** Astro 自动 emit 到 `dist/404.html`(`build.format: "directory"` 对 `404.astro` 特殊处理),CF Pages 原生认。
- **重定向 `/seo` → `/seo-guide`:** 放 `public/_redirects`:

  ```
  /seo  /seo-guide  301
  ```

### 5.7 字体自托管(必做)

**为什么:** Google Fonts CDN 要 3 次外部请求(DNS + googleapis CSS + gstatic woff2),mobile 4G 多 300–500ms FCP。自托管零外部请求。

**步骤:**

1. 下载 latin 子集 woff2(用 Python 脚本,见下)到 `public/fonts/`
2. 写 `public/fonts/fonts.css`:

   ```css
   @font-face {
     font-family: 'Playfair Display';
     font-style: normal;
     font-weight: 400 700;
     font-display: swap;
     src: url('/fonts/playfair-display-latin.woff2') format('woff2');
     unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
   }
   @font-face {
     font-family: 'Inter';
     font-style: normal;
     font-weight: 300 700;
     font-display: swap;
     src: url('/fonts/inter-latin.woff2') format('woff2');
     unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
   }
   ```

3. `BaseHead.astro` 里 preload:

   ```astro
   <link rel="preload" href="/fonts/playfair-display-latin.woff2" as="font" type="font/woff2" crossorigin />
   <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
   <link rel="stylesheet" href="/fonts/fonts.css" />
   ```

4. `global.css` 里不要写 `@import url('https://fonts.googleapis.com...')`

5. 把字体族名注入 CSS 变量(给 Tailwind 用):

   ```css
   :root {
     --font-heading: "Playfair Display", Georgia, serif;
     --font-body: "Inter", system-ui, sans-serif;
   }
   ```

**Python 下载脚本:**

```python
import urllib.request, re, os

def download_google_font(family, weights, output_dir="public/fonts"):
    os.makedirs(output_dir, exist_ok=True)
    family_param = family.replace(" ", "+")
    weights_param = ";".join(weights)
    url = f"https://fonts.googleapis.com/css2?family={family_param}:wght@{weights_param}&display=swap"
    headers = {"User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"}
    req = urllib.request.Request(url, headers=headers)
    css = urllib.request.urlopen(req).read().decode()
    urls = re.findall(r'url\((https://[^)]+\.woff2)\)', css)
    latin_url = urls[-1]
    slug = family.lower().replace(" ", "-")
    fname = f"{slug}-latin.woff2"
    filepath = os.path.join(output_dir, fname)
    urllib.request.urlretrieve(latin_url, filepath)
    print(f"{family}: {os.path.getsize(filepath)/1024:.1f}KB -> {filepath}")

# download_google_font("Playfair Display", ["400", "500", "600", "700"])
# download_google_font("Inter", ["300", "400", "500", "600"])
```

### 5.8 `.gitignore` 模板

```
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
.astro/
.output/

# Editor
.vscode/
.idea/
*.swp
.DS_Store
Thumbs.db

# Env
.env
.env.local
.env.*.local

# Logs
*.log

# Markdown (per project rules — never commit .md files)
*.md
```

### 5.9 Audit 脚本

**`scripts/check-links.mjs`** —— 内链完整性(遍历 src/ 所有 `href="/..."`,对照 dist/ 生成路由):

```js
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const SRC = path.resolve("src");

function walk(dir, filter) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "_astro" || e.name === "node_modules") continue;
      out.push(...walk(full, filter));
    } else if (filter(e.name)) out.push(full);
  }
  return out;
}

const routes = new Set(
  walk(DIST, (n) => n === "index.html")
    .map((f) => path.relative(DIST, f).replace(/\\/g, "/").replace(/\/?index\.html$/, ""))
    .map((r) => (r === "" ? "/" : "/" + r))
);
routes.add("/404");
const assets = new Set(walk(DIST, () => true).map((f) => "/" + path.relative(DIST, f).replace(/\\/g, "/")));

const files = walk(SRC, (n) => /\.(astro|ts|tsx|js|mjs)$/.test(n));
const re = /href=\\?["']((?:\/)[^"'\\`<>\s]*)\\?["']/g;

const bad = [];
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re.exec(txt)) !== null) {
    const full = m[1].trim();
    if (!full || full.startsWith("//")) continue;
    const pathOnly = full.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
    if (!routes.has(pathOnly) && !assets.has(pathOnly)) {
      const line = txt.slice(0, m.index).split("\n").length;
      bad.push({ file: path.relative(process.cwd(), f), line, href: full });
    }
  }
}

if (bad.length === 0) console.log(`✓ No broken internal links. (${routes.size} routes, ${files.length} source files)`);
else {
  console.log(`✗ ${bad.length} broken internal link(s):\n`);
  for (const b of bad) console.log(`  ${b.file}:${b.line}  →  ${b.href}`);
  process.exitCode = 1;
}
```

Phase 5 交付后:`npm run build && npm run audit:links` 一次过。

---

## PHASE 6 — LAUNCH CHECKLIST

输出 `checklist.md`。

### 发布前技术检查

- [ ] 所有页面 title / meta description 唯一
- [ ] `sitemap.xml` 生成,URL 正确(用 `npm run build` 验证)
- [ ] `robots.txt` 可访问
- [ ] canonical 标签每页都有,绝对 URL
- [ ] JSON-LD 通过 schema.org validator(特别是 `LocalBusiness`)
- [ ] OG + Twitter 标签齐全,有 `og:image`(1200×630)
- [ ] `npm run audit:links` 无破链
- [ ] 所有 `<img>` 有 `alt` + `width` + `height`
- [ ] 手机响应式跑过(375px / 414px / 768px)
- [ ] **Hero 单独验收** —— 320→1920 无横向溢出、H1 每行都是 1 行、`min-h` 实测生效、`<picture>` 各断点选源正确、照片主体没被 CTA 压住、无 `aggregateRating`;营业状态 9 个模拟时钟用例(含冬夏令时)全过且无 JS 时仍正确。完整 17 项见 `references/hero-fullbleed-playbook.md` §8
- [ ] PageSpeed mobile ≥ 90(Astro 默认就能打到)
- [ ] SSL 激活
- [ ] 字体自托管,0 个 `fonts.googleapis.com` 请求(DevTools Network 检查)
- [ ] `.gitignore` 含 `*.md`,无 `.md` 被 commit

### 域名 & 托管

- [ ] 域名注册 / DNS 配好,`www` 作为 canonical,裸域 301 到 `www`
- [ ] CF Pages 连 GitHub repo,`main` 触发生产 deploy
- [ ] `NODE_VERSION=20` env 设上
- [ ] `SITE_DOMAIN` env(若 preview 要别的域)
- [ ] 404 验证(访问不存在的 URL,看 `/404.html` 是否返回)

### Google 生态

- [ ] GA4 tag 接入(延迟加载,见旧 skill pitfall #9)
- [ ] Google Search Console 验证主域 + www 子域
- [ ] 提交 sitemap 到 GSC
- [ ] 首页 + 前 5 个页面 Request Indexing

### 外部档案

- [ ] Google Business Profile —— 网站 URL 更新,NAP 一致
- [ ] 预约平台 URL 指回新站
- [ ] 社交(FB / IG / X)简介更新

### 上线后(月度)

- [ ] GSC Performance 复盘
- [ ] Core Web Vitals 监控
- [ ] 客户评价请求
- [ ] Guide 内容 6 个月刷新

---

## Schema 速查表(哪个页面用哪个)

| 页面类型 | schema.org type | helper | required |
|---|---|---|---|
| Home | `Organization` + `LocalBusiness`(若单门店)+ 可选 `WebSite` | `makeOrganization` + `makeLocalBusiness` | name, url, logo, address, phone, openingHours, geo, aggregateRating |
| 每个 `/locations/[slug]` | `LocalBusiness` / `DaySpa` / `BeautySalon` / `MassageTherapy` / `MedicalBusiness`(按业务选) | `makeLocalBusiness` | 同上;每个门店自己一份 |
| `/services/[slug]` | `Service` + `BreadcrumbList` + 可选 `FAQPage` | `makeService` + `makeBreadcrumb` + `makeFAQPage` | name, description, provider, areaServed |
| `/guides/[slug]` | `Article` + `BreadcrumbList` + 可选 `FAQPage` | `makeArticle` + `makeBreadcrumb` | headline, author, datePublished, image |
| `/about` / `/contact` / `/faq` | `Organization` + `BreadcrumbList` + 可选 `FAQPage` | — | — |
| `/seo-guide` | `WebPage` + `BreadcrumbList` | — | — |

**硬规矩:**

- 不在两个 `@graph` 节点用同一个 `@id`(Google 会 merge 报冲突)
- `aggregateRating` 在 `LocalBusiness` 上写一次就行,不要在 `Service` 上重复
- 上线前在 https://search.google.com/test/rich-results 跑一遍
- `@type` 精准匹配业务:spa → `DaySpa`;按摩 → `MassageTherapy`;美甲 → `BeautySalon`;医美 → `MedicalBusiness`

---

## SEO / PageSpeed 目标

Astro 版默认比 React SPA 好 15–25 点 PageSpeed 分,因为零 JS + HTML 先到。目标:

| 指标 | 值 | 备注 |
|---|---|---|
| **LCP** | ≤ 1.5s mobile / ≤ 1.0s desktop | `<h1>` 是首屏 LCP,HTML 到就 paint |
| **CLS** | ≤ 0.05 | `<img>` 必须显式 width+height,字体 `display: swap` + 自托管 |
| **INP** | ≤ 150ms | 静态页 = 0 JS,天然 0ms;Booking island 不影响 |
| **FCP** | ≤ 1.0s | HTML 直出 |
| **TBT** | ≤ 100ms | 无 React hydrate 在首屏 |
| **PageSpeed mobile** | ≥ 95 | 默认就能打到 |

**常见失分原因(Astro 版)**:

1. 图片太大 —— Home hero > 200KB → 用 WebP + `<Image>` 组件或 srcset
2. Google Fonts 没自托管 —— 走外部请求拉 FCP
3. BookingModal 用 `client:load` 但其实只首屏出现 —— 可考虑 `client:idle`
4. framer-motion 引在 SiteLayout —— 别这么干,只在需要的 island 里引
5. `<img>` 缺 `width` / `height` —— CLS 飙高

---

## Running the Full Pipeline

用户说 "run full pipeline" / "做完整网站":

1. Phase 1 — 解析 + web verify + 搜竞品
2. Phase 2 — 交 blueprint 让用户确认
3. Phase 3 — 生成 code(并行 agents),`npm run build` 验过
4. Phase 4 — 生成 `/seo-guide`(wintrabiz.com upsell)
5. Phase 5 — 生成 sitemap 脚本 + robots + 字体 + CF 配置,audit 跑过
6. Phase 6 — 交 checklist

---

## 迁移指南 —— 从 local-biz-website 到 local-biz-astro

### 什么时候迁?

- **新客户** → 100% 用 Astro(本 skill)
- **已有 React 客户 + 性能差** → 迁,理由:PageSpeed mobile 60 → 95 是常态
- **已有 React 客户 + 性能 OK + 功能复杂** → 不迁,维护成本高
- **已有 React 客户 + 客户要加大量内容** → 迁,content-as-data 更好维护

### 迁移路径(React → Astro,典型 1–2 天)

1. **新开 Astro 项目**(`npm create astro@latest`),空白模板
2. **搬 content** —— 旧项目 `src/lib/seo-config.ts` 和各页的硬编码文案,整合到新项目 `src/lib/content/services.ts` / `locations.ts` / `faq.ts`,加 TypeScript 类型
3. **搬 schema** —— 旧项目 JSON-LD 拼字符串,改写成新项目 `src/lib/seo/schemas.ts` 的 helper 函数
4. **搬组件** —— `.tsx` 改 `.astro`(去掉 `useState` / `useEffect` / event handlers,除了真正交互的 `BookingModal` 保留为 island)
5. **搬样式** —— Tailwind config 直接复用;design tokens 从旧 `src/index.css` 的 `:root` HSL 变量复制到新 `src/styles/global.css`
6. **搬图片** —— `public/images/` 原样挪
7. **重写 build pipeline** —— 删 `scripts/prerender.mjs`,换成 `scripts/generate-sitemap.mjs`(本 skill Phase 5)
8. **验证** —— `npm run build`、`npm run audit:links`、`rich-results-test`、PageSpeed,每一项都要绿
9. **DNS 切换** —— 先 CF Pages preview URL 内部 QA,然后切 DNS 到新 Pages 部署

### 不要做的事

- 不要试图在 React SPA 里硬塞 Astro —— 两套架构并存维护成本翻倍
- 不要保留旧的 `prerender.mjs`(Astro 自己会生成 HTML,多一套只会冲突)
- 不要保留 `applySeoMeta` 之类的 runtime SEO —— Astro frontmatter 就是 SSR,是单一事实源
- 不要留 `ScrollToTop` 组件 —— Astro 每次是完整页面加载,浏览器自己滚顶

### 迁移成本收益(实测)

| 项目 | React 版 | Astro 版 | 收益 |
|---|---|---|---|
| PageSpeed mobile | 65–75 | 92–98 | +20 分 → 本地排名 1-2 位 |
| 首屏 JS 载荷 | ~200KB gzip | ~0KB | 带宽省、体验好 |
| 构建时间 | 30–60s(含 prerender crawl) | 2–5s | dev 体验飞跃 |
| 新页面开发 | 新 `.tsx` + 路由注册 + seo-config 条目 + prerender.mjs 修改 | 加一条 content record | 工作量 ~1/3 |

---

## 实战铁律(Agoura Hills Spa 案例沉淀,2026-07)⭐

完整 playbook 见 `references/agoura-playbook.md`(13/13 页 A+、SEO 98.9 / GEO 80.0 的完整打磨记录)。以下是**每个新项目都要执行**的浓缩版:

### 视觉工艺 — Atelier 相框系统

照片"贴上去"感是廉价站的头号特征。解法:全站照片统一走 `references/atelier-framing.css` 的装裱系统(直接粘进 global.css,tailwind 指令之后):

- **`.plate` 拱形相框**(竖图):古典拱窗 + 错位金线双框 + 内圈细线 + 暖调渐变 + SVG 纸纹颗粒 + 22s Ken Burns 慢呼吸 + 微倾 ±1° + 蜡封价格徽章(菜单页)+ 雕版小字 caption
- **`.print` 矩形印版框**(横图/宽幅):同族直角版,用于 storefront、guide 宽幅 hero
- 价目页配 **`.menu-card` 雕版菜单卡**:四角对版记号 + 幽灵衬线卷号 + 金色点状引导线(hover 点亮)+ 上标 $ 衬线价签 + 小字距时长胶囊
- 应用位置:PageHero(内页全部)、GuideLayout hero、首页 why 区块、价目页——**一套语言贯穿全站**,这是别站抄不走的辨识度

### Hero / 导航 / CTA 铁律

1. **照片含招牌大字 → 分栏 hero,永不叠字**:文字放暖纸色面板(亮,不阴森),照片独占一栏,长渐变(to-58%)融合接缝;移动端照片 36vh + 全部内容压进首屏
2. **Logo 按原始纵横比渲染**(`w-auto` + 真实 width/height),横版字标严禁塞正方形框
3. **导航加按钮必跑宽度扫描**:390→1920 九档 `scrollWidth > clientWidth` 全 false;中屏用短标签(Gifts/Book),文字字标 xl+ 才显示
4. **预约平台深链取代 iframe modal**:Fresha 用 `/booking`、`/gift-cards` 深链直出,`target="_blank" rel="noopener"`;CTA 三件套 Book Online(gold)+ Gift Cards(ghost)+ Call(ghost 带图标),同一 `.btn` 规格;URL 只存 locations.ts 一处
5. Fresha 菜单侦察:curl venue 页(SSR)抓 JSON-LD OfferCatalog = 含价完整菜单

### 满铺 Hero 铁律(照片干净、无招牌字时用;完整版见 `references/hero-fullbleed-playbook.md`)⭐

1. **⚠️ 窄屏下 `object-cover` 是高度受限的** —— 手机 hero 窄高 + 照片横构图 → 高度铺满、只裁宽度 → **`object-position` 的 Y 分量完全无效**。照片主体(脚/脸/手)纵向位置被源图钉死,落在 CTA 区就永远看不见。判据:容器比 < 图片比 → 只能调 X。
2. **解法是 `<picture>` 换图,不是调 position** —— 手机给一张**构图不同的竖版裁切**(艺术指导,不是响应式尺寸)。裁切位置按 `T + p·H = C` 反推,脚本模板 `references/make-hero-images.mjs`。**方形素材(1024²)比横图好裁**,横图裁竖版常算出需要 4× 放大的框。放大 ≤1.5× 可接受。定位 class 放 `<img>`,`alt` 要对两张图都成立,`<head>` 里的 hero preload 必须删或带 `media`。
3. **标题两行是构造出来的** —— 实测两行所需字号区间:1440px 是 50–68px、390px 是 30–34px,**两区间不重叠**,自动换行做不到两端都两行。用显式 `<span class="block">` 断行 + 每行独立字号;手机用 `clamp(vw)`(固定值在 320px 换行、在 414px 浪费一半宽度),`clamp` 上限对齐 `sm:` 档防跨断点缩字。两行比值 **1.5–1.6** 全断点一致。
4. **细衬线展示体要比直觉再放大 1.3–1.5×** —— Cormorant 25px 看着比 Inter Bold 16px 还小,客户会说"标题怎么比按钮字还小"。
5. **遮罩手写 `linear-gradient`,不用 Tailwind 任意停靠点** —— `from-[26%]`/`via-[48%]` 这类类名**不按语义插值**(实测把不透明度调高、对比度反而变差)。超过三个停靠点就写进 scoped `<style>`。先量各元素占 hero 高度百分比再排曲线;**只有纯文字需要压暗**,自带底色的按钮/卡片/药丸可落亮区,大标题只要 3:1 不是 4.5:1。
5b. **⭐ 手机遮罩从顶端到中点必须单调** —— 「顶部露照片」(顶端≈0)和「标题区压暗」(15% 处≈0.85)**互斥**,亮→暗→亮必然夹出一条悬浮黑条。把暗色**锚在最顶端**一路淡到中点,中点后再为 CTA 回升。验收:断言停靠点数组 `0%→50%` 严格非递增。
5c. **⭐ 先看照片调性再定遮罩颜色** —— 亮调照片(白床品/窗光/浅木)配深色罩,**怎么调都发闷发褐**,客户会一直说不够高级而你会一直以为是浓度问题。亮调用 paper 浅罩 + ink 墨字(金色换 `gold-deep`),暗调才用 ink 深罩 + 白字。做成 `heroTone: "dark"|"light"|"gold"` 一个常量可切,三版截图并排给客户看,比描述快十倍。
6. **上下分区用 `flex` + `min-h` + `mt-auto`** —— 标题贴顶、行动区沉底。**`min-h` 必须真的大于内容高度否则等于没写**(踩过:46rem=690px vs 内容 692px,约束从不生效)。改完量 `section.getBoundingClientRect().height`。
7. **🚨 Google 评分只展示不进 schema** —— Google 自家评分写进 `aggregateRating` 违反 review snippet 政策、会吃人工处罚。合规做法只有「徽章 + 链接回 Google 商家页」。在 `locations.ts` 字段注释里写死这条防后人手贱。徽章排**一行**(G+数字+星+"on Google"),堆两行显得又大又土。
8. **「现在营业中」按商家时区算,不是访客时区** —— 静态站从 CDN 发出,访客的钟是错的钟。`Intl.DateTimeFormat` 写死 `timeZone`;SSR 兜底渲染静态营业时间,无 JS 时仍正确。**必须用 `page.clock.setFixedTime()` 跑 ≥9 个用例**(开关门前后 1 分钟 / 午夜 / 冬夏令时),浏览器时区故意设 `Asia/Tokyo` 证明读的是商家时区。
9. **所有地址包 `maps/dir/?api=1` 一键导航**(手机唤起地图 App),比 `maps/place/` 强;二楼/难找的店加落位卡("Come up to the second floor" + 街道 + 地铁),放营业状态行下方。**地铁线路写全 "on the 6 subway line"**,`the 6 train` 非本地人读成"六条线"。
10. **完整 NAP 必须在 `<body>` 正文** —— `seo-geo-score.mjs` 的 `stripChrome()` 剥掉 `<header>/<footer>/<nav>`,导航条里的地址不计分。首屏放**空格分隔**的数字(`60 minutes` 匹配、`60-minute` 不匹配)。eyebrow 不要重复 H1 已有的词,换品类词或 power word 多吃一个关键词。
11. **量,不要猜 —— 但先验证你的尺子** —— hero 调版每轮跑 playwright 扫 320→1920:行数 / 字号 / `scrollWidth>clientWidth` / `img.currentSrc` 选源。时间相关 UI 截图前固定时钟。⚠️ 三个会让你基于错数字返工的陷阱:**`sharp` 的 `.stats()` 忽略前面的 `.extract()`**(返回整图平均,必须先 `.raw().toBuffer()`)、**元素盒子≠字形框**(满宽 flex 容器会把亮部算进平均,用 `Range.getBoundingClientRect()`)、**`element.screenshot()` 会滚动页面**导致 sticky 导航假性遮挡。通用信号:**两个不同位置的元素给出完全相同的对比度数字,一定是测量错了**。

### 数据诚信(是卖点不是束缚)

- 无验证评分 → 零星标零 aggregateRating;菜单一字不改镜像预约平台(可疑数据报告老板,不擅自修);缺失政策写"来电确认"
- 唯一合规 E-E-A-T 句式:"Many California cities require massage professionals to be CAMTC-certified — you're welcome to ask about your therapist's credentials when you book"(行业事实,非店家宣称;各州换机构)
- 健康声明 hedge + 具名 NCCIH/Mayo/AMTA + 页尾 Sources + not-medical-advice

### 审计与 QA 循环

- 用 **jj-seo-geo skill** 的本地打分器做 fix→build→rescore 循环;高频扣分修法速查表在 playbook §6(meta 110-170c 含词+CTA 动词、H1 决定推断关键词、直答句要空格分隔的数字、证据页 Article schema、conversion 页 floor×1.5 词数)
- **Title 权重词公式**(playbook §6.5):每页 title 铺 Best / Top Rated / Luxury / Best Experience,`[权重词]+[主关键词]+[品牌词] ≤60c`;权重词按页面人设错开轮换(信任页 Top Rated、高端服务 Luxury、证据页 "Best Honest Guide"),不要全站盖同一个词;永远不配评分 schema;core 页在 pages.ts、长尾页 in-page,grep 两处都要改
- **视觉 QA**:`references/visual-qa-screenshots.mjs` 全页截图(品牌断言防端口陷阱、强制 reveal、懒加载滚动、地图固定 settle、sticky 头 static 化、>16k px 页底另拍)→ vision agent 逐张审桌面+移动 → 修 → 复截终审
- 换牌项目硬门槛:`grep -riE "旧品牌|旧城市|旧电话" dist/` = 0;`_redirects` 逐条 301 旧 WP URL;`llms.txt` 带 NAP+价格+深链

---

## 引用文件

- `references/Layout-astro-template.astro` — `SiteLayout.astro` + `BaseHead.astro` 的 `<head>` 注入模板(含 JSON-LD `@graph`)
- `references/location-page-template.astro` — `/locations/[slug]` 动态路由完整模板,含 `LocalBusiness` schema + FAQ
- `references/seo-schema-helpers.ts` — 所有 schema helper 函数(`makeOrganization / makeLocalBusiness / makeService / makeArticle / makeFAQPage / makeBreadcrumb`),可直接放 `src/lib/seo/schemas.ts`
- `references/atelier-framing.css` — ⭐ 全站照片装裱系统(拱形 plate / 矩形 print / 雕版 menu-card),含 markup 配方,直接粘进 global.css
- `references/visual-qa-screenshots.mjs` — ⭐ 视觉 QA 截图 harness(系统 Chrome、品牌断言、懒加载/地图/sticky/超高页全部陷阱已编码),含导航溢出扫描片段
- `references/agoura-playbook.md` — ⭐ Agoura Hills Spa 完整实战 playbook:分栏 hero 定式、导航宽度预算、Fresha 深链、数据诚信、单店长尾架构(根级 slug + /guides 枢纽 + 36 行路线图)、审计扣分速查、图片流水线(=s2400 技巧)、WP 迁移件
- `references/hero-fullbleed-playbook.md` — ⭐ U Beauty & Foot Spa 满铺 hero playbook(与 agoura 的分栏 hero 互补,照片干净无招牌字时用):`object-cover` 窄屏高度受限陷阱 + `<picture>` 艺术指导、两行标题构造法与实测字号区间、`clamp(vw)` 手机字号、**手写渐变 + 上→中单调(黑条的真正成因)**、**照片调性决定遮罩颜色 + `heroTone` 可切三版**、flex+`mt-auto` 上下分区、Google 评分合规(禁 aggregateRating)、商家时区营业状态、一键导航、**playwright 量测循环与三个测量陷阱**、17 项验收 checklist
- `references/make-hero-images.mjs` — 桌面+手机 hero 双裁切脚本模板(sharp `.extract().resize(lanczos3).sharpen()`),两个断点各自艺术指导,裁切算式写在注释里,换高清源只改 `src` 重跑

---

## 重要提醒

- **city 名:** URL 和正文都用真实城市名,不要 "your city"
- **服务:** 只生成客户实际提供的服务
- **内容限制:** 严格遵守 `content_restrictions`(如 `no_prices` → 不出现金额)
- **驾驶时间:** location 页必须提及从目标城市开车的时间
- **insurance angle:** 若店接保险,单独一页,大差异化
- **评论:** 用真实评论,带署名(和可核实来源)
- **字体自托管:** 不是建议,是规定
- **.md 全 gitignore:** 不是建议,是规定
- **commit 不带 Co-Authored-By:** 不是建议,是规定

---

## Canonical 域名规范

- `www.` 子域作为 canonical(CNAME 可用,CDN 兼容好,cookie 隔离)
- 裸域 301 → `www`,DNS/hosting 层做
- `<link rel="canonical">`、JSON-LD `@id`/`url`、OG、sitemap.xml、robots.txt 全用同一个 canonical 域
- 域名存一个常量 `DOMAIN`,`astro.config.mjs` 的 `site` + `generate-sitemap.mjs` 的 `DOMAIN` 保持同步(后者可读 `SITE_DOMAIN` env 覆盖)
