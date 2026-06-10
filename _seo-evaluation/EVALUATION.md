# SEO Skill 评估备忘录 — CTO

**日期**: 2026-05-20
**评估对象**: 3 个社区 SEO skill repo（已 shallow clone 到 `_seo-evaluation/`）
**评估视角**: 用于 `explore-agentic-astro` 这个 B2B agentic AI content hub
**当前本地基线**: `skills/seo-perf-audit-fix`、`skills/seo-ld-json`、`skills/seo-guide-page`

---

## TL;DR

1. **不要整包导任何一个 repo**——三家都掺了不少跟我们无关的 vertical（local biz、ecommerce、hreflang、maps、ASO）
2. **`claude-seo` 是首选**——质量、活跃度、与 agentic AI content hub 的契合度最高；但每个 skill 是独立单元，**按需挑**
3. **核心缺口在 GEO/AEO**（让 AI 引擎引用我们的内容）——这是当前 3 个本地 SEO skill 没覆盖的方向，也是 2026 春季 SEO 行业最大的范式变化
4. **拟引入 6 个 skill**（详见下方 Cherry-pick 表），整体盘子不超过 4-5 MB，零外部 API 依赖即可工作

---

## Repo 评分卡

| Repo | Stars | Pushed | Skills | License | 总体质量 | 与 hub 契合度 |
|---|---|---|---|---|---|---|
| **AgriciDaniel/claude-seo** | 6.8K | 2 天前 | 25 skill + 18 agent | MIT | **A** | **A-** |
| **aaron-he-zhu/seo-geo-claude-skills** | 1.7K | 6 天前 | 20 skill | Apache-2.0 | A- | B+ |
| **coreyhaines31/marketingskills** | 29.6K | 1 天前 | 40 skill（≈10 SEO 相关）| MIT | A- | B |

**Stars 不直接=质量**——`marketingskills` star 最多是因为 marketing 受众面更广；从单个 SKILL.md 的工艺水准看，`claude-seo` 和 `seo-geo-claude-skills` 更精细（更长的 trigger 列表、更结构化的 frontmatter、多语言触发词）。

---

## 跟现有 3 个本地 SEO skill 的重叠分析

| 我们已有 | 候选里同类覆盖 | 判断 |
|---|---|---|
| `seo-perf-audit-fix`（Lighthouse / PageSpeed 修复）| `claude-seo/seo-technical`、`claude-seo/seo-audit`、`marketingskills/seo-audit`、`seo-geo-claude-skills/optimize/technical-seo-checker` | **不替换**——我们这个是针对自己 Astro stack 的具体修复 playbook；候选都是通用审计。**保留本地版**。 |
| `seo-ld-json`（JSON-LD schema.org）| `claude-seo/seo-schema`、`marketingskills/schema`、`seo-geo-claude-skills/build/schema-markup-generator` | **不替换**——我们站现在已经有完整 `src/lib/seo.ts` builder 套件（articleLd / breadcrumbLd / faqLd 等），本地 skill 知道这个架构。**保留**。 |
| `seo-guide-page`（local biz 销售展示页）| 无 | 跟 hub 项目无关，但 wintrabiz 项目要用。**保留**。 |

**结论**：3 个本地 skill 都保留，新引入的全部是**补缺口**，不冲突。

---

## Cherry-pick 推荐（按优先级）

### P0 — 必引（GEO/AEO 时代刚需）

| 拟新加 skill | 源 | 解决的问题 |
|---|---|---|
| **`seo-geo`** | `claude-seo/skills/seo-geo/` | AI Overviews / ChatGPT search / Perplexity 引用优化，llms.txt 合规，passage-level citability 评分。**直接对应 2026 春季最大行业变化**。 |
| **`geo-content-optimizer`** | `seo-geo-claude-skills/build/geo-content-optimizer/` | AI 引用就绪度优化（多 AI engine：Claude / Gemini / Copilot / ChatGPT / Perplexity）。**跟 seo-geo 互补**：seo-geo 偏诊断 + 评分，这个偏内容改写。 |

### P1 — 强烈推荐（直接提升我们内容生产力）

| 拟新加 skill | 源 | 解决的问题 |
|---|---|---|
| **`seo-cluster`** | `claude-seo/skills/seo-cluster/` | SERP-based 语义主题聚类——按 Google 实际 SERP 重叠分组关键词，规划 hub-and-spoke 内容架构。**正好对应老板 Nav v2 那种 pillar+topic hub IA 工作流**。 |
| **`seo-content-brief`** | `claude-seo/skills/seo-content-brief/` | 竞争对手分析驱动的 content brief：per-section 字数、关键词位置、page-type 模板。**写新 insight / article 之前用这个，比裸写 prompt 强**。 |

### P2 — 选择性引入（边际价值）

| 拟新加 skill | 源 | 取舍 |
|---|---|---|
| **`entity-optimizer`** | `seo-geo-claude-skills/cross-cutting/entity-optimizer/` | Knowledge Graph / Wikidata / brand entity 信号。我们要让 "ASCENDING" + "Jarvis AI" 在 AI 引擎里被识别成实体——这个有用。**优先级低于 P0**，因为 entity 是慢工出细活，看 6 个月效果。 |
| **`seo-content`** 或 `marketingskills/ai-seo` | 二选一 | 内容写作通用 skill。我们的 page-content.ts 编辑流程已经成熟，**可以暂时不引**——只有当 Kent Xue / Alexander 这种 first-person 草稿越来越多时再说。 |

### P3 — 观察（不引但留意）

- `claude-seo/seo-programmatic` / `marketingskills/programmatic-seo` — programmatic SEO。我们的 `/comparisons/` 已经是手工编辑的高质量比较页，**短期不需要 templated pages**。但如果未来要 ship `/glossary/<200 terms>` 之类的规模化页面，这个值得回来看。
- `claude-seo/seo-google` — Google Search Console / Analytics 集成。**需要等我们正式接入 GSC API 之后**再考虑。

---

## 明确不引入

| Skill 类别 | 出现在哪 | 不引原因 |
|---|---|---|
| Local SEO / Maps | `claude-seo/seo-local`、`seo-maps` | 我们不是本地业务（虽然 ASCENDING 在 Fairfax，但 explore-agentic-astro 不需要 local pack） |
| E-commerce SEO | `claude-seo/seo-ecommerce`、`marketingskills/pricing/paywalls` | 不卖 SKU |
| International / hreflang | `claude-seo/seo-hreflang` | 单语言站点 |
| ASO（App Store Optimization）| `marketingskills/aso` | 没 App |
| 整个 `marketingskills` 里的 CRO/copywriting/email/ads/community 这些 | 我们不做 paid ads、社区运营、cold email | 跟 thought-leadership content hub 不匹配 |
| Backlinks 主动外联 | `claude-seo/seo-backlinks` 主动外联部分 | 编辑路线，不做 link building outreach |

---

## 外部 API 依赖警告

引入这些 skill 时**仔细看 SKILL.md 里有没有要求外部 API key**：

- `claude-seo/seo-dataforseo`、`seo-ecommerce`、`seo-programmatic` 等部分功能**强依赖 DataForSEO API**（付费）——我们引入的 P0/P1 4 个 skill **看起来不需要**，但执行前需要 dry-run 一次确认
- `seo-geo-claude-skills` 提到可选 Firecrawl 集成——可选，跳过即可

我推荐的 4 个 P0/P1 skill 应当**零外部 API 即可工作**（基于 SKILL.md frontmatter 检查的初步判断；实际跑一次再确认）。

---

## 集成计划（如果批准 P0+P1 = 4 个 skill）

```
# 1. 创建目标目录（如已存在跳过）
mkdir -p c:/Users/ziyou/freecode/anthropic-skills/skills/seo-geo
mkdir -p c:/Users/ziyou/freecode/anthropic-skills/skills/geo-content-optimizer
mkdir -p c:/Users/ziyou/freecode/anthropic-skills/skills/seo-cluster
mkdir -p c:/Users/ziyou/freecode/anthropic-skills/skills/seo-content-brief

# 2. 复制（含每个 skill 文件夹下所有 supporting 文件）
cp -r _seo-evaluation/claude-seo/skills/seo-geo/* skills/seo-geo/
cp -r _seo-evaluation/seo-geo-claude-skills/build/geo-content-optimizer/* skills/geo-content-optimizer/
cp -r _seo-evaluation/claude-seo/skills/seo-cluster/* skills/seo-cluster/
cp -r _seo-evaluation/claude-seo/skills/seo-content-brief/* skills/seo-content-brief/

# 3. 检查每个 SKILL.md 的 trigger 列表跟现有 skill 没冲突
# （现有 seo-perf-audit-fix / seo-ld-json / seo-guide-page 的 trigger 跟这 4 个新 skill 没语义重叠 — OK）

# 4. 在 jarvis project CLAUDE.md 里加触发条件（可选；不加也能 user-invokable）

# 5. 跑测试：随便起一个 Claude Code 会话，
#    输入 "optimize this article for AI Overviews" — 应该匹配 seo-geo
#    输入 "design a topic cluster for /agent-gateway/" — 应该匹配 seo-cluster
```

## 风险

| 风险 | 评估 | 缓解 |
|---|---|---|
| Trigger 名冲突 | 低——4 个新 skill 的 name 跟本地 3 个不重叠 | 引入后 grep 一次确认无重复 `name:` 行 |
| 维护负担 | 中——upstream 更新需要手工同步 | 标记 source URL 在 skill 内部 README，每季度同步一次 |
| Skill 推荐过多导致触发歧义 | 中——Claude 在多个 skill 同时匹配时可能选错 | 让每个 skill 的 description **明确写出"什么时候不应该用这个"** |
| `seo-cluster` 可能依赖 SERP API | 待验证 | 引入前先看具体 prompt 是否真的要求 live SERP；如要求，加 `[needs serp api key]` 标签 |

---

## 建议下一步

1. ✅ **批准 4 个 P0/P1 skill 引入**（约 5 分钟操作 + 30 分钟跑一遍验证）
2. **`seo-cluster` 用在 nav v2 IA 上**——给老板 Nav v2 proposal 里的 pillar+topic hub 模型做 SERP 验证：我们的 `/agent-registry/`、`/agent-gateway/` 等 topic hub 在真实 Google SERP 上是否构成同一个 cluster？这个直接关系到老板的 IA 决策对不对
3. **`seo-geo` 跑一次诊断**：把 `/agentic-ai/`、`/mcp/`、刚发布的 3 篇新文章都过一遍，得到 GEO citability 评分基线
4. **3 个月后回顾**：看 4 个新 skill 实际用了多少次；用的少的就 archive
