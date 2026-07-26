# Agoura Hills Spa Playbook — 实战沉淀(2026-07)

来源项目:`wintra/Agoura-Hills-Spa-Astro`(agourahillsspa.com)。一次从旧品牌模板到新商家的完整重建 + 打磨循环,最终 13/13 页 A+(SEO 98.9 avg / GEO 80.0),客户逐轮视觉验收通过。以下是可复制的决策与代码模式,按主题组织。

---

## 1. Hero 铁律 — 分栏,不叠字

**教训:** 实拍照片里常有商家自己的招牌大字(金色 "SPA" 背光字)。把 H1 白字压上去 = 字压字,怎么调滤镜都难看。

**定式:分栏 hero。** 文字放纯色面板(暖纸色 > 深墨色,亮色不阴森),照片独占一栏完整展示招牌:

```
桌面(lg+):grid-cols-[48fr_52fr],文字左 / 照片右
移动(<lg):照片在上(h-[36vh] min-h-[240px]) → 文字居中在下
接缝:照片上叠渐变融入面板色 —
  移动: bg-gradient-to-t from-paper via-transparent via-25% to-transparent
  桌面: lg:bg-gradient-to-r lg:from-paper lg:via-paper/45 lg:via-18% lg:to-transparent lg:to-58%
  (长渐变 to-58% 才"自然融合";短渐变看得出接缝)
```

细则:

- **移动首屏预算**:照片 36vh + kicker + 两行 H1 + 精简副标题(`sm:hidden` 短版)+ 全部 CTA 按钮,必须 844px 内装完。逐项收 margin(mt-3/mt-4/mt-5)。
- **H1 两行锁定**:`<span class="lg:whitespace-nowrap">Best Massage Spa</span><br class="hidden lg:block"/><span class="lg:whitespace-nowrap">in <em>Agoura Hills</em></span>`,字号按面板实宽算(Cormorant ≈ 0.42em/字符),在 1024/1280/1440/1920 逐档截图验证,别信心算。
- **照片滤镜**:`saturate-[1.12] contrast-[1.05] brightness-[1.04]` + 一层 `bg-gradient-to-br from-gold/15 via-transparent to-ink/15 mix-blend-overlay` 金色洗调——"原片感"变"品牌大片"。
- **品牌行放 hero 不放导航**:kicker = `<span class="text-gold-deep">{name}</span> · <span class="text-ink-muted">{city}</span>`(大写字距),导航只留 logo(logo 本身带完整字标)。

## 2. 导航条宽度预算 — 用 Playwright 量,不要猜

**教训:** 加一个 Gift Cards 按钮导致 768–1280px 全线溢出、品牌字标和链接重叠,三轮才修平。

定式:

- **Logo 永远按原始纵横比渲染**:横版字标(600×298)塞进 `h-10 w-10` 正方形会缩成 40×20 小点。正确:`width="600" height="298" class="h-10 sm:h-12 xl:h-14 w-auto"`。
- **断点分级降载**:文字字标只在 xl+ 显示(或干脆只用 logo);按钮标签中屏用短版(`<span class="hidden lg:inline">Gift Cards</span><span class="lg:hidden">Gifts</span>`,Book Now/Book 同理);电话文字链 xl+ 才出现;nav 链接 `gap-3.5 lg:gap-5 text-[13px] lg:text-sm`。
- **每次改头部后跑溢出扫描**(见 visual-qa-screenshots.mjs 尾注):390/640/768/900/1024/1280/1366/1440/1920 逐档 `scrollWidth > clientWidth`,全 false 才算完。
- 双 CTA 同规格:两个按钮都走 `.btn` 基类(同 padding/字号),别给次要按钮做迷你版——客户会说"大小不一致"。

## 3. 预约平台深链 & CTA 架构(Fresha 世代)

旧 skill 的 BookingModal iframe 在平台支持深链时**不再需要**——直接外链更稳(无 iframe 封锁风险、无 JS):

```
bookingUrl:  https://www.fresha.com/a/<venue-slug>/booking     ← /booking 深链直达日历
giftCardUrl: https://www.fresha.com/a/<venue-slug>/gift-cards
```

- 全站 CTA 三件套:**Book Online(btn-gold 主)+ Gift Cards(btn-ghost)+ Call(btn-ghost 带电话图标)**;外链一律 `target="_blank" rel="noopener"`。
- URL 只存 `locations.ts` 一处;grep 检查 FAQ 答案 / llms.txt 里的硬编码链接是否同步。
- 导航:Gift 按钮**移动端也要常驻**(客户明确要求过);汉堡菜单里再放全宽版三件套。
- Fresha 侦察技巧:venue 页(非 /booking)是 SSR 的,`curl -L -A "Mozilla/5.0"` 抓 HTML 里的 JSON-LD `@graph`(OfferCatalog→Offer→Service)= 完整菜单含价格,比手抄 services.md 全。

## 4. 数据诚信规则(不可妥协,反而是卖点)

- **评分**:平台只有 1-2 条评价 → 不输出任何 aggregateRating/星标。地图 iframe 里 Google 自己显示的评分不算违规(那是 Google 的内容)。若 GBP 有大量真实评价(如 4.8★×87),正确姿势是页面引用真实评价原文+链接 GBP,而非自打 schema。
- **菜单镜像预约平台**:价格/时长/名称一字不改,连平台的可疑数据(90min+磨砂=纯90min同价)也保留并**报告给老板**而不是擅自"修正"。
- **缺失数据留白**:停车/礼卡政策/取消政策/老板姓名未确认 → 文案写"欢迎来电确认",绝不编。
- **唯一合规 E-E-A-T 句**(过审计 `\b(licensed|certified|...)\b` 检查且诚实):"Many California cities require massage professionals to be CAMTC-certified (California Massage Therapy Council) — you're welcome to ask about your therapist's credentials when you book." 讲行业事实,不替店家宣称资质。各州换对应机构。
- 健康声明全部 hedge + 具名(NCCIH/Mayo/AMTA/NINDS),内容页尾 SourcesBlock + "General wellness information, not medical advice."

## 5. 长尾架构(单店版,区别于旧 skill 的 /services/[slug])

单店、菜单短的客户,长尾页放**根级** slug(更短、更像独立 landing):

```
/couples-massage-{city}          ← 商业页 ×4(每个招牌服务一页,900–1400 词)
/cupping-therapy-benefits        ← 证据长文 ×2(1400–1900 词,Article schema)
/guides/                         ← 杂志枢纽,索引全部长尾页
/seo-guide                       ← 36 行路线图:6 Live(可点)+ 30 Recommended(纯文字)
```

- 商业页 = GuideLayout 杂志壳 + PriceCard(数据来自 serviceMenu)+ GuideFaq(makeFAQPage 镜像)+ makeService + RelatedGuides 交叉链。
- 证据页是 SEO 护城河:诚实到"NCCIH 对拔罐没有任何疗效背书"这种程度,反而成为可引用资源(GEO/AI citation)。
- GuideLayout 组件族:PullQuote / StatBand / InfoTable / MythFact / CalloutBox / StepList / GuideFaq / SourcesBlock / PriceCard / RelatedGuides / BookingBand(layout 自动发一个,页面别再加)。

## 6. jj-seo-geo 审计循环 — 高频扣分与修法速查

配好 `scripts/audit/seo-geo-score.mjs`(cluster map + 品牌正则,别忘了脚本里的旧品牌硬编码)后,fix→build→rescore 循环。实测扣分项→修法:

| 扣分 | 修法 |
|---|---|
| title "no brand" | 每个 title 带 "Agoura Hills"(品牌正则可配) |
| meta 太长/no CTA/no kw | 110–170c,含主词 + book/call/visit/today/learn 动词 |
| "primary kw missing" | 关键词从 **H1 推断**(清洗后滑窗 2/3-gram);让 title 包含 H1 的核心词组,title/h1 措辞对齐 |
| "no expertise signal" | CAMTC 句(见 §4) |
| GEO citations 0 | 每页 1–3 条 NCCIH/Mayo/AMTA 外链(about/contact/guides 枢纽也要) |
| GEO "no direct answer" | 首屏第一段写定义句("X is …")+ 数字;注意正则只认**空格分隔**的 "60 minutes" "10 AM",连字符 "90-minute" 不算 |
| "thin/stuff N%" 密度 | 密度按推断词组的**相邻出现**算:"stress and anxiety" 永远匹配不上 "stress anxiety"(接受该 -2);堆砌 >3% 时改卡片标签措辞或加词稀释 |
| guide 缺 Article schema | 证据页加 makeArticle(datePublished 用真实发布日) |
| 内链不足 | 词数越多要求越多(2000+ 词要 ≥5 内链) |
| conversion 页词数 | floor×1.5 才满分(400 floor → 600+ 词) |

Conversion 页提词的合法招:At-a-glance 数字段(14 treatments · from $50 · 7 days · 8 cities ≈ 事实密度)、Getting-here 路线细节、before-your-visit 建议。

## 6.5 Title 权重词公式(Best / Top Rated / Luxury)

客户会明确要求 title 里出现 "best"、"top rated" 这类用户爱搜的词。全站铺权重词时的公式与红线(实测 13 页改完分数零回归、Title 维度保持 15/15 满分):

**公式:`[权重词] + [主关键词] + [品牌/城市词] ≤ 60 字符`**

四个硬约束,每条改完都要验:

1. **≤60 字符**(61–70 扣 1 分,>70 扣 3 分)——权重词挤掉的通常是 "| Book Online" 这类 title 内 CTA,可以牺牲(CTA 动词审计只查 meta description,不查 title)
2. **品牌词保留**(审计正则查 title 里的 "agoura hills" 类品牌 token)
3. **主关键词保留**——关键词是**从 H1 推断**的(清洗后 2/3-gram 滑窗),所以改 title 前先想清楚这页的推断词是什么,token 必须还在 title 里
4. **全站唯一**——metadata 审计查重

**权重词要错开轮换,不要 13 页全盖 "Best"**(读起来像垃圾站,词也互相稀释)。按页面人设分配:

| 页面类型 | 用词 | 示例 |
|---|---|---|
| 首页 | Best … Experience | "Best Massage & Day Spa Experience in Agoura Hills, CA" |
| 价目/服务枢纽 | Best | "Best Spa Menu & Massage Prices in Agoura Hills, CA" |
| 信任页(about/contact/FAQ) | Top Rated | "Contact Us — Top Rated Spa on Kanan Road, Agoura Hills" |
| 高端/科技服务 | Luxury | "Luxury Robotic Massage in Agoura Hills \| iRelaxbot" |
| 证据/攻略长文 | Best Honest Guide | "Cupping Therapy Benefits — Best Honest Guide \| Agoura Hills"(既有权重词又不背叛诚实定位) |
| 商业长尾 | Best + 规格 | "Best Couples Massage in Agoura Hills, CA \| 60 & 90 Min" |

**红线:** 权重词只是 title 文案,**永远不配 aggregateRating/评分 schema**(无验证评分时打 "Top Rated" + 星标 schema = 违规二连)。

**改哪里:** core 页 title 在 `src/lib/seo/pages.ts`,长尾页 title 是各页 in-page prop——grep 两处,漏一处就有页面没改到。改完:build → seo-geo-score(Title 15/15)→ metadata-audit(unique / 0 >60c)。

## 7. 视觉 QA 流水线

见 `visual-qa-screenshots.mjs`(端口陷阱/品牌断言/懒加载滚动/地图 settle/sticky 头/16k px 拼接缺陷全部在内)。流程:全量截图 → 3 个视觉 reviewer agent 分批 Read 逐张审(桌面+移动) → 修 → 复截 → 终审 verifier 逐项 check。真实抓到的站点缺陷类型:移动端品牌名截断、InfoTable 右列被裁(修法:md 以下堆叠成 label/value 卡)、来源链接 break-all 词中断行(改 break-words)、PriceCard 时长重复("80 min · 80 min",label 已含时长就别传 duration prop)、StatBand 标签孤行(不换行空格/短语重写)。

## 8. 图片流水线

- **Google 图直链提清晰度**:`=s1360-w1360-h1020-rw` 结尾换成 `=s2400` 拿原图(Google 不放大,原图小就返回原尺寸)。
- 一个 Pillow 脚本产全套:hero 裁切(文字安全区加暗角)、OG 1200×630、卡片图原尺寸转 WebP q82-84、logo alpha-trim 保原比例、favicon 全套从图形 mark 生成(192 源 LANCZOS 放大到 512 对扁平图形可接受)。
- **别站图别信自动映射**:每张下载图用 Read 看过内容再定用途(hero/卡片/关于页),alt 写真实所见。
- 首页 hero 用店里最高分辨率的一张(其余 1000px 图只够半宽卡片,全宽会糊)。

## 9. WordPress 换血迁移件

- `public/_redirects`:旧 WP URL 逐条 301(`/our-services/* /services/ 301`、`/service/thermo-stone/* /hot-stone-…/ 301`),保住旧链接权重。
- `public/llms.txt`:品牌+NAP+服务价格+预约深链+页面清单,AI 检索时代的 robots.txt。
- canonical 跟随商家现有域的形态(apex vs www 用 curl 看 301 方向),别硬套 www 规范。
- 换牌 QA 硬门槛:`grep -riE "旧品牌|旧城市|旧电话|旧地址" dist/` 必须 **0**;src/scripts 的注释也要清。

## 10. 端口陷阱(wintra 工作区特有)

多项目并存时 :4321 常被其他 dev server 占用,`astro preview` 静默跳 4322/4323。**任何 fetch/截图前先 curl 看 `<title>` 确认是本站**——曾整批 28 张截图全拍成了隔壁 TAO 项目的站。
