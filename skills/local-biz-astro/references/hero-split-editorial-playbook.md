# 分栏编辑式 Hero playbook（Harbor Wellness → LJY Reflexology 两轮沉淀，2026-08）

这是第三种 hero 定式，和已有两种互补：

| playbook | 形态 | 什么时候用 |
|---|---|---|
| `agoura-playbook.md` §1 | 分栏（照片一栏 + 纯色文字面板） | 照片里有招牌大字，叠字会糊 |
| `hero-fullbleed-playbook.md` | 满铺照片 + 文字 overlay | 照片是干净服务特写、分辨率够 |
| **本文** | **分栏 + 拱形装裱 + 装饰件** | **要「杂志感 / 高客单价」观感；素材是竖构图或方图；首屏必须同时塞下 H1 + 评分 + 营业状态 + 双 CTA + 电话 + 地址** |

本文这套在两个客户站上跑过：Harbor Wellness（San Carlos CA）和 LJY Reflexology（Hermitage TN）。两次都是首屏 SEO 99、GEO 94，320–1920 十六个宽度零溢出。

---

## 0. 它长什么样

```
┌─────────────────────────────┬──────────────────────┐
│ ── TOP RATED …（eyebrow）    │      ╭──────────╮    │
│                             │  ◜badge         │    │  ← 旋转圆章压在左上角
│ Best Foot Massage in        │  │   拱形遮罩    │    │
│ Hermitage, Tennessee (H1)   │  │   3:4 竖图    │    │
│                             │  │              │    │
│ Health, beauty and bliss.   │  ╰──────────────╯    │
│                             │              ╭───╮   │  ← blob 遮罩小图
│ FOOT REFLEXOLOGY · FOOT+…   │              ╰───╯   │     压在右下角外
│                             │                      │
│ G 4.9 ★★★★★ on Google │ ● Closed · opens 10 AM     │  ← 信任行，一行
│                             │                      │
│ [ BOOK NOW ] [ VIEW SERVICES ]                     │
│ [ (615) 835-2603 ]                                 │
│                             │                      │
│ 📍 3877 Lebanon Pike, … · Free parking             │
└─────────────────────────────┴──────────────────────┘
```

`lg` 以下塌成单栏（文字在上、照片在下），两个装饰件换成两颗柔光球。

---

## 1. DOM 顺序：文字必须在前

`grid-cols-[1.06fr_0.94fr]`，**文案 div 写在照片 div 前面**。这不是审美问题：

- 手机塌成单栏时 DOM 顺序 = 视觉顺序，H1 和 Google 评分才会在 390×844 的首屏内
- LCP 是 H1 文本而不是图片，文字先到先渲染
- 想用 `order-*` 把照片提到前面 → 手机首屏被一张 3:4 竖图吃掉 700px，CTA 全部掉出首屏

**验收**：390×844 上量 Google 评分的 `getBoundingClientRect().bottom` 必须 < 844。

```js
// 首屏断言，跑在 audit:hero 里
const r = document.querySelector('.hero-copy a[href*="share.google"]').getBoundingClientRect();
console.assert(r.bottom <= window.innerHeight, 'Google 评分掉出首屏');
```

---

## 2. 竖向节奏：整套「编辑感」全在这组数字里 ⭐

root font-size 是 **120%（1rem = 19.2px）**。下面的 rem 值是按目标 px 换算回来的，不是随手写的 `mt-8`：

| 从 → 到 | 目标 px | class | 为什么 |
|---|---|---|---|
| 容器 top | 60 | `lg:pt-[3.1rem]` | 文案贴着 header 起，呼吸感由块间距给，不靠顶部留白 |
| eyebrow → H1 | 47 | `mt-[2.45rem]` | eyebrow 是品牌提示音，不是标题的一部分 |
| H1 → slogan | 45 | `mt-[2.19rem]` | H1 下面比任何地方都需要空气 |
| slogan → 服务行 | 30 | `mt-[1.46rem]` | |
| 服务行 → 信任行 | 40 | `mt-[1.98rem]` | |
| 信任行 → CTA | 33 | `mt-[1.62rem]` | |
| CTA → 电话 | 18 | `mt-[0.88rem]` | 同一个转化组，靠得紧 |
| 电话 → 地址 | 44 | `mt-[2.14rem]` | 大跳。地址是三级信息，**必须**离开转化组 |

**规律**：大跳（44–47px）划分语义组，小跳（18px）绑定同组元素。全部用同一条左对齐线（eyebrow 的金色横线、H1、CTA、地址的图钉全部从同一个 x 起）。

改任何一个值之前先问：它是在分组还是在绑定？

---

## 3. 信任行：一行，且不要做成按钮 ⭐⭐

**这条是客户两次都提的。**

第一版把 Google 评分做成 `variant="pill"`（描边 + 卡片底 + 阴影 + hover 上浮），营业状态用 `basis-full` 顶到第二行。客户原话：*「google 打分这个不要一个大button 样子，要融合到一体」*、*「这俩要放一行」*。

他是对的：**一个带边框的胶囊，压在两个真 CTA 正上方，读起来就是第三个按钮，有人会去点。**

```astro
<div class="mt-[1.98rem] flex flex-wrap items-center gap-x-4 gap-y-2">
  <GoogleBadge size="hero" variant="plain" />
  <span aria-hidden="true" class="hidden h-4 w-px bg-border xl:block"></span>
  <OpenStatus variant="plain" />
</div>
```

三条硬规矩：

1. **size 和 variant 必须解耦。** 第一版 `GoogleBadge` 里写成 `isPill && isHero ? "h-7 w-7" : "h-5 w-5"`——于是 `size="hero" variant="plain"` 悄悄退回小号。正确写法：
   ```astro
   class:list={[isHero ? (isPill ? "h-7 w-7" : "h-6 w-6") : "h-5 w-5", "shrink-0"]}
   ```
   无边框但要**大**：G 图标 24px、分数 1.15rem、五星 16px。

2. **"on Google" 的字号要和营业状态一致**（都是 `0.8rem`）。差一档，整行就读成两块拼接而不是一个整体。

3. **分隔竖线的断点要量，不能拍脑袋。** 这一对在一行上需要 **486px**，而文案栏宽度：

   | 视口 | 文案栏 | 够不够 |
   |---|---|---|
   | 1024 | 449 | ✗ 换行 |
   | 1180 | 532 | ✓ |
   | 1280+ | 585–606 | ✓ |

   写成 `sm:block` → 1024 上换行了竖线还在，孤零零挂在第一行末尾。写成 `xl:block`（1280+）才安全。

   **量它的脚本**（换素材/换字号后重跑）：
   ```js
   const a = document.querySelector('.hero-copy a[href*="share.google"]');
   const row = a.parentElement, os = row.querySelector('[data-open-status]');
   const div = row.querySelector(':scope > span.w-px');   // 注意 :scope>，
   // 否则会选中 OpenStatus 内部那个 aria-hidden 的圆点，量出来永远是「显示」
   const oneLine = Math.abs(a.getBoundingClientRect().top - os.getBoundingClientRect().top) < 10;
   const shown = div && getComputedStyle(div).display !== 'none';
   if (!oneLine && shown) console.error('竖线被孤立在换行处');
   ```

---

## 4. 地址行：图钉 + 地址 + 一个短事实，其余全删 ⭐

第一版：

```
📍 3877 Lebanon Pike, Hermitage, TN 37076 · Book online or call ahead · Free parking in the lot outside the door
```

客户：*「这里精简些…… 然后就是 Free Parking 就行」*。删掉的两段各有各的毛病：

- **"Book online or call ahead"** —— 正上方就是 Book Now 和电话按钮，这句在复述它们
- **"Free parking in the lot outside the door"** —— 九个词说一个两个词的事实

留下的是首次到访者真正在扫的两件事：**在哪，停车麻不麻烦。**

```astro
<p class="speakable mt-[2.14rem] max-w-[32rem] text-[0.775rem] leading-[1.5] text-muted-foreground/85">
  <!-- ⚠️ 不是 inline-flex，原因见下面第一条 -->
  <a href={BIZ.google.directionsUrl} target="_blank" rel="noopener noreferrer"
     aria-label={`Open ${BIZ.address} in Google Maps`}
     class="group">
    <GoogleMapPin class="mr-1.5 inline-block h-[1.15em] w-[1.15em] align-[-0.2em] transition group-hover:scale-110" />
    <span class="link-fine">{BIZ.address}</span>
  </a>
  <span class="hidden sm:inline">
    <span aria-hidden="true"> · </span>{BIZ.parkingShort}
  </span>
</p>
```

四个细节：

- **⭐⭐ 图钉那个 `<a>` 千万不要用 `inline-flex`。** 这是本节最隐蔽的一条。inline-flex 盒子的基线取自它的**第一个 flex item**，而这里第一个 item 是替换元素 `<svg>` —— 它自己没有基线。结果：整个锚点（地址文字 + 金色下划线）比后面跟着的「· Free parking」高出几个像素。**同一行，两条基线**，而下划线会把这点错位放大到一眼可见。客户的原话是「下划线把地址抬高了」。
  正确做法是让整段回到普通 inline 文本流：`<a>` 不加 flex，图钉用 `inline-block` + `align-[-0.2em]`。
  - `-0.2em` 是算出来的：inline-block 的对齐基准是下外边距边，`-0.2em` 把它压到基线下 0.2em，于是图钉中心落在 baseline − 0.375em，而 cap 高度中心约在 −0.36em —— 视觉上正好压在大写字母中间。换字号/换图钉尺寸要重算。
  - **用 `mr-1.5` 而不是空格**分隔图钉和地址：margin 不产生断行机会，所以图钉永远不会被单独甩在行尾；而地址内部的空格照样可以断，320px 上该折还是折。
  - 验收断言（往两段文字各插一个探针 span 量 `bottom`）：
    ```js
    const probe = el => { const s=document.createElement('span'); s.textContent='x';
      s.style.font='inherit'; el.appendChild(s); const r=s.getBoundingClientRect(); s.remove(); return r; };
    const d = probe(addrSpan).bottom - probe(tailSpan).bottom;
    console.assert(Math.abs(d) < 0.6, `地址与尾巴基线差 ${d}px`);
    ```
- **下划线只加在文字上**（`link-fine` 在内层 `<span>`），不要加在 `<a>` 上——否则图钉会被一条线穿过去
- **图钉用 Google 红 `#EA4335` 的地图标记**，不要用单色 lucide `mapMarker`。它在 ~20px 上渲染，Google Maps 那个四色 app 图标的色块每块只有 7px，会糊成一团；**标记轮廓能活下来，而且标记本身就是 Google 在地图上画的东西**。红色和 `GoogleBadge` 里 G 的红是同一个，两个标记属于同一家族。
- **⭐ 字号 0.775rem 是量出来的，不是 0.8rem。** 整行在 0.8rem 下需要 **434px**；文案栏最窄处是 `lg`（1024）的 **449px**。15px 余量不叫余量——字体栈略宽一点、多一条滚动条、缩放一档，它就换行了，而客户看到的就是换行。0.775rem 下同一行约 420px，1024 上留 ~30px，更宽的断点更松。
- **⭐ `<640` 整段 parking 隐藏，不是换行。** 手机栏宽约 342px，光地址就占 334px；要把 parking 塞进同一行得用 ~12px 字，而堆成两行正是这次要消掉的东西。它是三级信息且没丢——同页 why-us 卡片里有「Free parking at the door」，`/contact` 讲了车停哪。
- **实测结果**：390→1920 全部一行；320/360 上地址**自身**自然折行（`...TN / 37076`），这是 272px 栏宽装不下 38 字符地址的物理下限，不是 bug。
- **`speakable` 挂在这个 `<p>` 上**（配合 `webPageSchema` 的 speakable spec）。数据源用 `BIZ.parkingShort`（两词版）；长句留给 `/contact` 和页脚，那里有地方把「车停哪」讲完。

`site.ts` 里：

```ts
parkingNote: "Free parking in the lot outside the door",  // /contact + 页脚
parkingShort: "Free parking",                             // hero，一行要能扫完
```

---

## 5. 照片栏：装裱、负边距、装饰件锚点

```astro
<div class="relative lg:self-center">
  <div class="hero-photo relative mx-auto w-full lg:ml-auto lg:w-[88%]">
    <div class="mask-arch relative aspect-[3/4] overflow-hidden shadow-[var(--shadow-arch)]">
      <Image src={heroMain} alt="…"
        class="hero-breathe h-full w-full object-cover object-[46%_50%]"
        widths={[480, 768, 1080, 1456]} sizes="(min-width: 1024px) 42vw, 100vw"
        loading="eager" fetchpriority="high" format="webp" quality={80} />
    </div>

    <div class="absolute -left-8 -top-6 z-10 hidden md:block">
      <CircularBadge text="LJY Reflexology · Hermitage, TN · " class="h-36 w-36" />
    </div>

    <div class="absolute -bottom-12 -right-7 z-10 hidden animate-float md:block">
      <div class="mask-blob h-40 w-40 overflow-hidden border border-border bg-card shadow-soft lg:h-[11.7rem] lg:w-[11.7rem]">
        <Image src={heroInset} alt="…" widths={[208, 416]} sizes="208px"
               loading="lazy" format="webp" quality={72} class="h-full w-full object-cover" />
      </div>
    </div>
  </div>
</div>
```

### 5.1 装饰件锚在内层 wrapper，不是 grid cell ⭐

`.hero-photo` 这层 wrapper 的高度**正好等于拱形图**。装饰件绝对定位到它。

如果锚到外层 grid cell：cell 会被拉伸到**文案栏的高度**（平板上文案比照片高得多），blob 小图就会掉到照片下方两三百像素的空白里。这个 bug 只在 `md`–`lg` 之间出现，桌面和手机都看不到。

### 5.2 负右边距的公式

照片要够到视口右缘但**永远不碰到**：

```css
@media (min-width: 1024px) {
  .hero-photo {
    margin-right: calc(-1 * clamp(0px, (100vw - 1320px) / 2 - 12px, 3rem));
  }
}
```

固定负边距（比如 `-3rem`）在 1440 上好看，到 1280 就只剩 10px 边距，圆章直接被裁到视口外。这个式子按「容器外边距 − 12px」拉，上限 3rem：1440 上留 ~60px，1320 以下不会比页面 padding 更紧，超宽屏也不会失控。

### 5.3 手机上装饰件换成柔光球

圆章和 blob 是 `hidden md:block`。`md` 以下换成两颗 `glow-orb`（纯 CSS 径向渐变，无图片），保留氛围但不占纵向空间。

---

## 6. CTA 尺寸写在 scoped `<style>`，不是工具类

```html
<style>
  @media (min-width: 1024px) {
    .hero-copy .btn-primary,
    .hero-copy .btn-ghost {
      min-height: 3.15rem;
      padding-block: 1rem;
      padding-inline: 2.1rem;
      font-size: 0.72rem;
      letter-spacing: 0.12em;
    }
  }
</style>
```

`.btn-primary` / `.btn-ghost` 自己已经声明了 padding。再在 `<a>` 上加 `px-8 py-4` 这类工具类，两边**同权重**，最后谁赢取决于样式表顺序而不是你的意图——今天对了，加一个插件重排就错。scoped 选择器 `.hero-copy .btn-primary` 权重更高，确定性地赢。

（1rem = 19.2px：3.15rem ≈ 60px 高，2.1rem 横向 padding 让 Book Now 落在 ~200px。）

---

## 7. eyebrow 的幽灵半行距

```css
.hero-copy .eyebrow-line {
  display: flex;      /* 不是工具类默认的 inline-flex */
  gap: 0.94rem;
}
```

`.eyebrow-line` 默认 `inline-flex`。行内级盒子会从父级 line box 继承**半行距（half-leading）**，实测把 eyebrow 又往下推了约 12px——于是 padding 写的是 60px，量出来是 72px，怎么调 `pt-` 都对不上设计稿。改 `display: flex` 就没有这个幽灵间距了。

---

## 8. 需要的 CSS（直接粘进 global.css，Tailwind 指令之后）

```css
@utility mask-arch {
  border-radius: 9999px 9999px var(--radius) var(--radius);
  overflow: hidden;
}

/* 浮动小图的有机形状 */
@utility mask-blob {
  border-radius: 62% 38% 55% 45% / 50% 60% 40% 50%;
  overflow: hidden;
}

/* hero 背后极淡的暖色 mesh：三片宽径向washes，全部取自既有品牌色。
   刻意做得很淡——要读成「房间里的光」，不是「一个渐变」。 */
@utility section-hero-mesh {
  background:
    radial-gradient(ellipse 55% 60% at 92% 8%,  color-mix(in srgb, var(--gold) 13%, transparent), transparent 65%),
    radial-gradient(ellipse 45% 50% at 6% 88%,  color-mix(in srgb, var(--beige) 75%, transparent), transparent 70%),
    radial-gradient(ellipse 70% 55% at 50% 45%, color-mix(in srgb, var(--beige) 45%, transparent), transparent 80%),
    var(--background);
}

@utility glow-orb {
  position: relative;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%,
    color-mix(in srgb, var(--beige) 92%, white) 0%,
    color-mix(in srgb, var(--gold) 70%, transparent) 45%,
    color-mix(in srgb, var(--accent) 28%, transparent) 80%,
    transparent 100%);
}

:root { --shadow-arch: 0 40px 80px -40px rgb(53 50 47 / 0.38); }

@utility hero-breathe {
  animation: hero-breathe 20s ease-in-out infinite alternate;
  /* 和 <img> 上的 object-position 对齐,否则缓慢放大时主体会横向漂走 */
  transform-origin: 46% 50%;
  will-change: transform;
}
@utility animate-float { animation: float-y 7s ease-in-out infinite; }

@keyframes hero-breathe { from { transform: scale(1); } to { transform: scale(1.06); } }
@keyframes float-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }

@media (prefers-reduced-motion: reduce) {
  .animate-float, .animate-spin-slow, .hero-breathe { animation: none; }
}
```

`prefers-reduced-motion` 那块不是可选项——hero 上同时有三个无限动画（呼吸、浮动、旋转圆章）。

## 9. Google 地图图钉组件

```astro
---
// Google Maps 标记，用 Google 自己的红。地址链出 Maps 导航的地方都用它，
// 让目的地在点击前就可读。
// 为什么用朴素标记而不是四色 app 图标：它渲染在 0.8rem 文字旁边约 20px，
// app 图标的色块每块约 7px，会糊；标记轮廓能活下来。红色 #EA4335 与
// GoogleBadge 里 G 的红同源，hero 上两个标记属于同一家族。
// 角色是装饰：外层 <a> 已经带无障碍名称，所以 aria-hidden，不重复播报。
interface Props { class?: string }
const { class: className = "h-[1.35em] w-[1.35em]" } = Astro.props;
---
<svg viewBox="0 0 24 24" class:list={["shrink-0", className]} aria-hidden="true" focusable="false">
  <path fill="#EA4335"
    d="M12 1.75c-4.0 0-7.25 3.25-7.25 7.25 0 5.44 6.4 12.4 6.67 12.7a.78.78 0 0 0 1.16 0c.27-.3 6.67-7.26 6.67-12.7 0-4-3.25-7.25-7.25-7.25z"></path>
  <circle cx="12" cy="9" r="2.6" fill="#fff"></circle>
</svg>
```

---

## 10. 验收清单

- [ ] 390×844 上 Google 评分 `bottom <= 844`（首屏内）
- [ ] 信任行在 **1280+ 是一行**，竖线只在它确实同行时出现；320/390/1024 换行且**无孤立竖线**
- [ ] 地址行 **390→1920 全部一行**（`el.getBoundingClientRect().height / lineHeight === 1`）；320/360 允许地址自身折行
- [ ] 图钉没有被链接下划线穿过
- [ ] 地址文字与后面的短事实**基线差 < 0.6px**（探针 span 量 `bottom`，见 §4）
- [ ] `md`–`lg` 之间（768/900/1024）blob 小图仍贴在照片右下角，**没有掉到照片下方的空白里**
- [ ] 1280 上圆章完整可见，未被视口右缘裁切
- [ ] 320→1920 十六个宽度零横向溢出（`audit:responsive`）
- [ ] `prefers-reduced-motion: reduce` 下三个动画全停
- [ ] Google 评分是 `display-only`，**没有** `aggregateRating` JSON-LD
- [ ] 营业状态用商户时区算（不是访客时区），固定时钟用例全过（`audit:hours`）
- [ ] hero `<p class="speakable">` 存在且含 NAP

---

## 11. 两次踩过的坑，一句话版

1. 评分做成胶囊 → 读成按钮。**无边框 + 大字号**才对。
2. `size` 和 `variant` 在组件里耦合 → `hero + plain` 悄悄退回小号。
3. 分隔竖线断点拍脑袋 → 换行处孤立。**量文案栏宽度**再定断点。
4. 量竖线时用 `row.querySelector('span[aria-hidden]')` → 选中了 OpenStatus 内部的圆点。用 `:scope >`。
5. 装饰件锚到 grid cell → 平板上掉出去两百像素。锚到**内层 wrapper**。
6. 固定负边距 → 1280 上圆章被裁。用 `clamp()` 公式。
7. eyebrow 用 `inline-flex` → 幽灵半行距，顶部间距永远比设计稿多 12px。
8. hero 那行塞三段文案 → 客户嫌啰嗦。**地址 + 一个短事实**，其余删。
9. 地址行按 0.8rem 排 → 1024 上只剩 15px 余量，在客户机器上换行而在你机器上不换。**按最窄的那一栏留 ≥30px 余量**再定字号。
10. 图钉 + 地址用 `inline-flex` → 基线取自没有基线的 `<svg>`，整段被抬高，下划线让错位一眼可见。**普通 inline + `inline-block` 图钉 + `align-[-0.2em]`**。
