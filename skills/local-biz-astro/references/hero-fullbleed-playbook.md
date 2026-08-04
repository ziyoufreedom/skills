# 满铺 Hero 实战 playbook（U Beauty & Foot Spa 案例沉淀，2026-08）

`agoura-playbook.md` §1 讲的是**分栏 hero**（照片独占一栏 + 文字放纯色面板），适用于**照片里带招牌大字**的情况。
本文讲互补的另一种：**满铺照片 + 文字压在上面（overlay hero）**。

## 0. 先选型：overlay 还是分栏

| 条件 | 用哪种 |
|---|---|
| 照片里有招牌/门头文字、价目板、任何字 | **分栏**。叠字必糊，见 agoura §1 |
| 照片是干净的服务特写（手、脚、面部、器械） | **overlay** 可用，本文适用 |
| 照片分辨率 < 1200px 宽 | **分栏**。满铺会被拉伸放大 |
| 需要移动端首屏塞进 CTA + 营业状态 + 地址 | **overlay** 更省纵向空间 |

overlay 的代价是**必须做遮罩**，而遮罩做不好就是廉价站。下面 §3 是解法。

---

## 1. ⭐ 最大的坑：窄屏下 `object-cover` 是「高度受限」的

这条不知道会浪费你一小时。

手机 hero 是**窄高盒子**（如 390×795，宽高比 0.49），照片通常是横构图（如 1000×667，比 1.5）。`object-cover` 取 `max(缩放比)`：

```
scale = max(390/1000, 795/667) = max(0.39, 1.19) = 1.19   ← 高度那一项胜出
缩放后 = 1190 × 795
```

**结果：高度正好铺满，只有宽度被裁。** 推论：

- `object-position` 的 **Y 分量完全无效**（纵向没有裁切余量可调）
- 照片里**纵向位置固定**的主体（比如脚趾在画面 62–85% 高度）会被**永久钉死**在 hero 下方三分之一
- 如果那个位置正好是 CTA 区，主体就永远看不见，`object-position` 调到天上也没用

**判断公式**：容器比 < 图片比 → 高度受限（只能调 X）；容器比 > 图片比 → 宽度受限（只能调 Y）。

### 解法：`<picture>` 做艺术指导，不是做响应式尺寸

不要试图用一张图伺候所有断点。给手机**换一张构图不同的照片**：

```astro
<picture>
  <source media="(max-width: 639px)" srcset="/images/home/hero-mobile.webp" width="620" height="1264" />
  <img
    src="/images/home/hero.webp"
    alt="两张图都成立的描述"
    width="1000" height="667"
    class="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-90"
    loading="eager" fetchpriority="high" decoding="async"
  />
</picture>
```

要点：
- **定位 class 放 `<img>` 上**，`<picture>` 不加 display（img 绝对定位后 picture 的行内盒自然塌陷）
- **`alt` 对两张图都要成立**（浏览器选哪张 alt 都用同一个）
- **`<head>` 里若有 hero `preload` 必须删掉或改成 `imagesrcset`+`media`**，否则手机会预加载错的那张，白下一份

### 裁切位置怎么算

目标：主体落在遮罩开窗区（见 §3），一般是 hero 高度的 30–60%。

```
设裁切框 top=T height=H，主体中心在源图 y=C，希望它落在裁切框的 p 位置：
    T + p·H = C        且   0 ≤ T,  T+H ≤ 源图高
宽度由手机 hero 宽高比反推：W = H × (hero宽 / hero高)
```

本案例：源图 1024×1024，脚中心 y=560，要它落在 45% →
`H=840, T=182`，`W = 840 × 0.49 = 412` → 裁 `(230,182,412,840)`。

**方形素材（1024×1024）比横构图好裁得多** —— 横图裁竖版会算出 188×334 这种需要 4× 放大的框，糊得没法用。素材库优先选方图做手机 hero。

裁切脚本模板见本目录 `make-hero-images.mjs` 思路（sharp `.extract().resize({kernel:"lanczos3"}).sharpen({sigma:0.6})`），**把裁切算式写进注释**，换高清源时只改 `SRC` 重跑。

放大倍数底线：**≤1.5×** 可接受（遮罩下看不出），>2× 换素材。

---

## 2. ⭐ 标题：两行是「构造」出来的，不是「换行」出来的

### 先测，再写

自动换行**做不到两端都是两行**。实测数据（Cormorant Garamond，43 字符标题）：

| 视口 | 可用宽 | 两行所需字号区间 |
|---|---|---|
| 1440px | 816px | **50–68px** |
| 768px | 720px | 42–68px |
| 390px | 345px | **30–34px** |

**两个区间不重叠。** 任何单一字号要么在手机上变三行，要么在桌面上变一行。

### 解法：显式断行 + 每行独立定字号

```astro
<h1 class="font-display leading-[1.06] tracking-tight text-paper">
  <span class="block text-[clamp(2.25rem,11.5vw,3rem)] sm:text-[2.9rem] md:text-[3.4rem] lg:text-[4.1rem]">
    Best foot massage
  </span>
  <span class="mt-1 block text-[clamp(1.5rem,7.6vw,2rem)] text-paper/85 sm:text-[1.85rem] md:text-[2.15rem] lg:text-[2.6rem]">
    in Midtown East, <span class="italic text-gold">from $35</span>
  </span>
</h1>
```

- **断在语义边界**：主张一行、地点+价格一行。不要断在介词中间
- **两行不同字号**，比值 **1.5–1.6** 全断点保持一致 → 缩放时层级观感不变
- **手机用 `clamp(vw)` 而不是固定档**：实测余量 320px 时 40px、414px 时 53px，固定值必然浪费一半宽度或换行
- **`clamp` 上限对齐 `sm:` 那一档的值**，否则跨 640px 时字会突然变小
- 长价格/地名放 `<span class="italic text-gold">` 做重音，颜色比字号更省空间

### 光学字号：衬线展示体 ≠ 无衬线粗体

**Cormorant 25px 看起来比 Inter Bold 16px 还小。** 客户会直接说「标题怎么比按钮字还小」。

细展示衬线体做标题时，**比你直觉的再放大 1.3–1.5 倍**。上表的 clamp 系数已含这个补偿。

---

## 3. ⭐ 遮罩：手写 `linear-gradient`，并且**从上到中必须单调**

### 3a. 不要用 Tailwind 的任意停靠点类

`from-[26%]` / `via-[48%]` / `to-[76%]` 这类任意停靠位置**不按类名语义插值**。实测两次：把不透明度**调高**，对比度反而**变差**（4.22 → 2.02）。类名编译进 CSS 了（`--tw-gradient-*-position` 都在），但合成结果不是你写的那条曲线。

**超过三个停靠点就手写 CSS**，放 `.astro` 的 scoped `<style>`：

```css
.hero-scrim-y {
  background-image: linear-gradient(
    180deg,
    hsl(var(--ink) / 0.90) 0%,
    hsl(var(--ink) / 0.83) 15%,
    hsl(var(--ink) / 0.62) 29%,
    hsl(var(--ink) / 0.34) 43%,
    hsl(var(--ink) / 0.24) 50%,
    hsl(var(--ink) / 0.40) 63%,
    hsl(var(--ink) / 0.82) 75%,
    hsl(var(--ink) / 0.90) 100%
  );
}
```

### 3b. ⭐ 手机：从顶端到中点必须**单调**，否则必出黑条

这条是客户三轮不满意才逼出来的结论。

如果你想「顶部露照片」（顶端 alpha ≈ 0）又想「标题区压暗」（15% 处 alpha ≈ 0.85），那么 **亮 → 暗 → 亮** 的夹心结构会在标题附近产生一条**悬浮的黑带**。这不是参数没调好，是这两个诉求**互斥**：

> 透明的顶部 + 压暗的标题区 = 必然出现黑条。二选一。

正确做法：**把暗色锚在最顶端**，一路淡到中点，中点之后再为 CTA 区回升。

```
顶端 0.90 → 0.88 → 0.83 → 0.74 → 0.62 → 0.48 → 0.34 → 0.24 中点
                                                        ↓
                            0.26 → 0.40 → 0.62 → 0.82 → 0.90 底部
```

**验收**：把停靠点数组跑一遍，断言 `0%→50%` 严格非递增。能自动测的东西不要靠眼睛。

底部那段回升不算「中间黑条」——它是页面底边的收边，读起来是自然的。

### 3c. 停靠点按实测元素位置排，不要估

先量出每个元素占 hero 高度的百分比，再排曲线：

```js
const S = section.getBoundingClientRect();
const pct = el => { const r = el.getBoundingClientRect();
  return [(r.top-S.top)/S.height*100, (r.bottom-S.top)/S.height*100]; };
// 实测样例：eyebrow 11-13% · H1 15-26% · 徽章 29-33% · 营业状态 67-73%
```

**只有纯文字元素需要遮罩**。自带底色的（按钮、`bg-ink/45 backdrop-blur` 的卡片、评分药丸）可以落在亮区——把它们算进"必须压暗"会让你多压 20% 的画面。大字号标题只要 3:1，不是 4.5:1，这两点合起来通常能省掉整个平台段。

---

## 3.5. ⭐ 高调照片配深色遮罩 = 永远调不好

**先判断照片的调性再选遮罩颜色。**

亮调（high-key：白床品、窗光、浅木）的照片压深色遮罩，无论调多透都是**发闷、发褐**，像旧照片。客户会一直说"不够高级"，而你会一直以为是浓度问题——三轮之后才发现方向错了。

| 照片调性 | 遮罩 | 文字 |
|---|---|---|
| 亮调 / 高调 | **paper 浅色罩** | ink 墨色字，金色用 `gold-deep` |
| 暗调 / 低调 | ink 深色罩 | paper 白字，金色用 `gold` |
| 暖木色调 | 慎用金色罩 —— 会和照片糊在一起显旧 | — |

浅色罩 + 墨字反而更像高端 spa（Aman / Aesop 的路子）。

**做成一个可切常量**，让客户直接看，别用文字描述配色：

```ts
type HeroTone = "dark" | "light" | "gold";
const heroTone: HeroTone = "light";
const TONES = {
  dark:  { section:"bg-ink text-paper",  scrimY:"hero-scrim-y",       h1:"text-paper", accent:"text-gold",      badge:"dark"  as const, /* … */ },
  light: { section:"bg-paper text-ink",  scrimY:"hero-scrim-y-light", h1:"text-ink",   accent:"text-gold-deep", badge:"light" as const, /* … */ },
} as const;
const T = TONES[heroTone];
```

markup 全部走 `class:list={[..., T.xxx]}`。三套配色截图并排给客户，比来回描述快十倍，而且切换零风险。浅色/金色的曲线直接复用深色版调好的形状，只换基色。

---

## 4. 布局：上下分区（flex + `mt-auto`）

标题贴顶、行动区沉底，中间让给照片。手机桌面同一套结构：

```astro
<section class="relative isolate flex min-h-[53rem] flex-col overflow-hidden bg-ink text-paper
                sm:min-h-[38rem] md:min-h-[40rem] lg:min-h-[44rem]">
  <picture>…</picture>
  <div class="…遮罩…"></div>

  <div class="container mx-auto flex flex-1 flex-col pb-12 pt-10 md:pb-16 md:pt-14">
    <div class="max-w-3xl">            <!-- 标题组：eyebrow + h1 + 评分徽章 -->
    </div>
    <div class="mt-auto max-w-3xl pt-24 sm:pt-12">   <!-- 行动组：CTA + 营业状态 + 落位卡 -->
    </div>
  </div>
</section>
```

### ⚠️ `min-h` 必须真的大于内容高度，否则等于没写

踩过：设 `min-h-[46rem]`（690px）而内容本身 692px → **约束从不生效，`mt-auto` 没有东西可推**，开窗一点没开。

**改完必须量**：`document.querySelector("section").getBoundingClientRect().height`，确认它等于 `min-h` 而不是内容高度。

顶部 padding 收紧（`pt-10`）、留白放到底部，标题才会「往上提」。

---

## 5. Hero 里的信任元素

### Google 评分徽章 —— 只展示，绝不进 schema

```astro
<a href={store.googleReview.url} target="_blank" rel="noopener"
   class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
  <svg class="g-bounce h-[18px] w-[18px]" viewBox="0 0 48 48">…四色 G…</svg>
  <span class="font-heading text-[0.95rem] font-semibold">5.0</span>
  <span class="flex gap-px">…5 颗 #FBBC05 星…</span>
  <span class="text-[0.78rem]">on Google</span>
</a>
```

**🚨 硬规则：Google 自家评分不能写进 `aggregateRating` 结构化数据。**
Google 的 review snippet 政策禁止把第三方（尤其它自己）的评分当作一方结构化数据再发布，会吃人工处罚。合规做法**只有一种**：显示徽章 + 链接回 Google 商家页让用户自己核实。

存到 `locations.ts` 时把这条写进注释，防止后人手贱加 schema：

```ts
/** ⚠️ 故意不接入 aggregateRating —— Google 自家评分不得作为一方结构化数据发布。 */
googleReview?: { rating: string; url: string; count?: number };
```

评分本身是**店主提供的数据**，我们无法独立核实，不要自己编。

**单行排版**：G + 数字 + 星 + "on Google" 压一行，高度 ~33px。堆成两行（数字在上、"GOOGLE REVIEWS" 在下）会显得又大又土。

### 「现在营业中」—— 用商家时区，不是访客时区

静态站从 CDN 发出，**访客的钟是错的钟**。必须按商家所在时区算：

```js
const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",   // 商家时区，写死
  hour: "numeric", minute: "numeric", hour12: false,
}).formatToParts(new Date());
```

实现要点：
- **SSR 兜底**：服务端渲染静态营业时间，JS 上来再升级成 Open/Closed。**无 JS 时那行字仍然正确**
- `try/catch` 包住 `Intl`，取不到时区数据就保持兜底文案
- `if (h === 24) h = 0`（某些引擎 h24 制在午夜返回 24）
- `querySelectorAll` 支持一页多个实例
- 营业绿点 + 脉冲动画，打烊金点不脉冲；动画受 `prefers-reduced-motion` 保护

**必须用模拟时钟测**，至少 9 个用例（开门前/开门后 1 分钟/中午/关门前 1 分钟/关门后/午夜 + 冬夏令时各一），**浏览器时区故意设成 Asia/Tokyo** 证明读的是商家时区：

```js
const ctx = await browser.newContext({ timezoneId: "Asia/Tokyo" });
await page.clock.setFixedTime(new Date("2026-08-03T18:00:00Z"));  // = 14:00 EDT
```

### 地址一键导航

**所有地址**（导航条、hero、正文、页脚、版权行）都包成 Google Maps `dir` API 链接，手机直接唤起地图 App 导航：

```ts
directionsUrl:
  "https://www.google.com/maps/dir/?api=1&destination=" +
  encodeURIComponent("商家名, 街道, 城市, 州 邮编"),
```

比 `maps/place/` 静态页强 —— 用户要的是「怎么去」，不是「看一眼」。

### 落位卡（二楼/后巷/难找的店必备）

```
📍 Come up to the second floor
   146 E 55th St, Suite 2B, between Park and Lexington
   2 minutes from 51 St station on the 6 subway line
   Get directions →
```

放在营业状态行下方 —— 它接着回答「我现在能去 → 那我往哪走」。整块可点。

**地铁/公交线路写清楚是「线路」**：`the 6 train` 是纽约本地说法，但非本地人会读成「6 班车/六条线」。写成 `on the 6 subway line`。

---

## 6. Hero 里的 SEO / GEO 硬要求

- **完整 NAP 必须出现在 `<body>` 正文，不能只在 `<header>`** —— `seo-geo-score.mjs` 的 `stripChrome()` 会剥掉 `<header>/<footer>/<nav>`，导航条里的地址**不计分**
- 首屏放**空格分隔的数字**（`$35`、`60 minutes`），GEO 的 `hasNumberedAnswer` 正则匹配 `60 minutes` 但**不匹配** `60-minute`
- eyebrow **不要重复 H1 里已有的词**（H1 已含 "Midtown East" 就别再写 "MIDTOWN EAST · MANHATTAN"），换成品类词（`CHINESE FOOT REFLEXOLOGY`）或 power word（`TOP RATED`）顺手多吃一个关键词
- 删 hero 元素前先确认信息在别处还在：本案例删掉底部完整地址行前，确认 `/` 的「Where we are」段落仍有完整 NAP，审计分数没掉

---

## 7. ⭐ 方法论：量，不要猜

hero 调版**每一轮都要量**，靠眼睛猜必然来回返工。装 `playwright` 当 devDependency（只影响开发）：

```bash
npm i -D playwright && npx playwright install chromium
```

### 量三件事

**① 断点全扫：行数 / 字号 / 溢出**

```js
for (const vw of [320,360,390,414,480,640,768,900,1024,1280,1440,1920]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle" });
  const r = await page.evaluate(() => {
    const lines = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
    const h1 = document.querySelector("h1");
    const [s1, s2] = h1.querySelectorAll(":scope > span");
    return { l1: lines(s1), l2: lines(s2),
             fs1: parseFloat(getComputedStyle(s1).fontSize),
             ovf: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  console.log(vw, r);   // 每个断点都要 l1===1 && l2===1 && ovf===false
}
```

**② 字号余量：还能放多大**

克隆 h1 的 span 成 `white-space:nowrap` 探针，从 16px 往上试到超出可用宽，得出每个断点的**上限**。有了上限才知道 `clamp` 系数该给多少，而不是拍脑袋。

**③ 元素占位百分比：给遮罩定停靠点**

```js
const h = section.getBoundingClientRect().height;
[...].map(el => (el.getBoundingClientRect().top / h * 100).toFixed(0))
```

### ⚠️ 会把你带进沟里的三个测量陷阱

这三条我全踩过，每一条都让我基于错数字改了好几轮：

**1. `sharp` 的 `.stats()` 忽略前面的 pipeline。**
`sharp(buf).extract({...}).stats()` 返回的是**整张图的平均值**，不是你裁出来那块。症状很好认：所有白字永远同一个数、所有金字永远另一个数，**数字只随文字颜色变，不随位置变**；而且你把遮罩调深，对比度反而"变差"。

```js
// ❌ 静默返回整图平均
const st = await sharp(shot).extract(box).stats();
// ✅ 先落成 buffer 再统计
const raw = await sharp(shot).extract(box).raw().toBuffer();
let R=0,G=0,B=0; for (let i=0;i<raw.length;i+=3){R+=raw[i];G+=raw[i+1];B+=raw[i+2];}
const bg = [R,G,B].map(v => v/(raw.length/3));
```

**2. 用元素盒子取样 ≠ 用字形取样。**
`<p class="flex ...">` 是满宽块级盒，字形可能只占左边 40%，取平均会把右侧亮部算进来，导致虚假的 FAIL。用 Range 拿真实字形框：

```js
const r = document.createRange(); r.selectNodeContents(textNode);
const box = r.getBoundingClientRect();   // 只包住字，不包住容器
```

**3. `element.screenshot()` 会滚动页面。**
sticky 导航随后覆盖到 hero 顶部，截图里看起来"标题被切了"——其实真实首屏没有。判断遮挡要用 viewport 截图 + `scrollTo(0,0)`，或直接比较 `header.bottom` 与目标元素的 `top`。

**通用信号：两个不同位置的元素给出完全相同的对比度数字，一定是测量错了，不是巧合。**

### 截图审

用 `visual-qa-screenshots.mjs`；hero 单独审时用 `element.screenshot()` 只拍 `<section>`，比全页快。
**营业状态这类时间相关 UI，截图前用 `page.clock.setFixedTime()` 固定时间**，否则每次截图状态不同没法对比。

⚠️ **端口陷阱**：多个 wintra 项目同时跑，`astro dev` 会静默顺延到 4322/4323。**截图前先 curl `<title>` 确认是本项目**，否则拍一堆邻居项目的图（真实发生过，28 张全废）。

---

## 8. Hero 验收 checklist

- [ ] 320 / 360 / 390 / 414 / 640 / 768 / 1024 / 1440 / 1920 全部无横向溢出
- [ ] H1 每行都是 1 行（不多不少），全断点成立
- [ ] H1 两行字号比值 1.5–1.6，全断点一致
- [ ] 细衬线标题在手机上**明显大于**按钮文字（客户会盯这个）
- [ ] `min-h` 实测生效（section 高度 === min-h，不等于内容高度）
- [ ] 遮罩：标题可读 / 照片透得出 / 状态行可读，三者同时成立
- [ ] `<picture>` 各断点选源正确（`img.currentSrc` 实测）
- [ ] hero 图无 `preload` 冲突（有的话带 `media`）
- [ ] 主体（脸/手/脚/器械）在手机上真的看得见，不是被 CTA 压住
- [ ] 营业状态：9 个模拟时钟用例全过，含冬夏令时，浏览器时区非本地
- [ ] 无 JS 时营业时间那行仍然正确
- [ ] 所有地址可点，指向 `maps/dir/?api=1`
- [ ] 完整 NAP 在 `<body>` 正文（不只在 header）
- [ ] 无 `aggregateRating`（除非有真实可核实的一方评分数据）
- [ ] `prefers-reduced-motion` 下所有动画停止
- [ ] 图片 < 250KB，`loading="eager" fetchpriority="high"`

---

## 9. 一句话速记

> **横图在窄屏是高度受限的** → Y 轴调不动 → 主体位置不对就换图（`<picture>`），别死磕 `object-position`。
> **两行标题靠构造** → 显式断行 + 每行独立 `clamp`，因为手机和桌面的两行字号区间根本不重叠。
> **先看照片调性再选遮罩颜色** → 亮调照片配深色罩，怎么调都发闷。
> **手机遮罩从上到中必须单调** → 透明顶部 + 压暗标题 = 必出黑条，两者互斥。
> **超过三个停靠点就手写 CSS** → Tailwind 的 `from-[x%]` 不按类名语义插值。
> **Google 评分只展示不进 schema** → 进了会吃人工处罚。
> **量，不要猜——但先验证你的尺子** → `sharp.stats()` 会忽略 `.extract()`；两个不同元素给出同一个数字就是尺子坏了。
