# Universal B2B SaaS Negative Keywords

These belong in the **account-level shared negatives** for any B2B SaaS Google Ads account. Override / extend per-product, but never start without these.

## Category 1: Business-line drift (CRITICAL for parent companies that sell services)

The parent company often offers consulting / training / managed services. The product ads must NOT pitch those — both because the user explicitly said so and because mixing service-line and product-line in one campaign produces low Quality Scores from intent fragmentation.

```
aws consulting | Phrase
aws professional services | Phrase
aws migration | Phrase
aws partner near me | Phrase
hire aws consultant | Phrase
aws training | Phrase
aws certification | Phrase
managed services | Phrase
implementation services | Phrase
consulting services | Phrase
{parent_company} consulting | Phrase   # e.g., ascending consulting
```

## Category 2: Brand pollution (varies by product brand)

Common brand collisions when product name overlaps with a famous fictional/historical entity:

**For "Jarvis" branded products** (Marvel + Jasper.ai legacy):
```
marvel | Phrase
ironman | Phrase
iron man | Phrase
ultron | Exact
vision marvel | Phrase
alfred batman | Phrase
friday vs jarvis | Phrase
jarvis voice generator | Phrase
jarvis voice clone | Phrase
jarvis ai download | Phrase
jarvis ai app | Phrase
jarvis ai bot | Phrase
jarvis assistant download | Phrase
jarvis lyrics | Phrase
jarvis song | Phrase
jarvis mp3 | Phrase
jarvis mcpherson | Phrase
jarvis ai writing | Phrase
jarvis ai writer | Phrase
jarvis writing tool | Phrase
jarvis writing ai | Phrase
jarvis songwriting | Phrase
jarvis ai text | Phrase
jarvis ai software | Phrase
ai writer jarvis | Phrase
jasper ai | Phrase
jasper writing | Phrase
copywriting | Phrase
conversion.ai | Phrase
```

For other brand collisions, web-search the brand name + see what irrelevant pages dominate, then add those as Phrase negatives.

## Category 3: Voice assistant / consumer chatbot pollution

```
siri | Exact
alexa | Exact
google assistant | Phrase
```

## Category 4: Academic / classroom pollution (huge for "agent" / "ai" terms)

AI courses constantly use "agent" terminology — these queries are students, not buyers:

```
wumpus world | Phrase
wumpus | Exact
rational agent | Phrase
reflex agent | Phrase
knowledge based agent | Phrase
learning agent | Phrase
model based agent | Phrase
goal based agent | Phrase
utility based agent | Phrase
simple reflex agent | Phrase
types of agents in ai | Phrase
types of ai agents | Phrase
intelligent agents in ai | Phrase
foundations of computational agents | Phrase
extraamas | Exact
deepmind generalist | Phrase
q learning flappy bird | Phrase
openai hide and seek | Phrase
unity ai agents | Phrase
ppt | Exact
powerpoint | Exact
tutorial | Exact
course | Exact
training | Exact
certification | Exact
exam | Exact
homework | Exact
assignment | Exact
syllabus | Exact
lecture | Exact
university | Exact
college | Exact
student | Exact
```

## Category 5: Job / career / freelance pollution

"AI agent" + "job" returns career queries — useless for SaaS sales:

```
jobs | Exact
salary | Exact
resume | Exact
cv | Exact
hiring | Exact
internship | Exact
intern | Exact
freelance | Exact
freelancer | Exact
careers | Exact
layoffs | Phrase
linkedin profile | Phrase
```

## Category 6: Industry-name collisions

When the product name accidentally matches an unrelated industry (insurance, real estate, payment, travel agents, etc.):

```
allstate | Exact
physicians mutual | Phrase
checkfree | Exact
rvos | Exact
wupos | Exact
gateway travel | Phrase
travel agent | Phrase
payment gateway | Phrase
leasing agent | Phrase
real estate | Phrase
dental | Exact
insurance agent | Phrase
```

## Category 7: Competitor brand-only news / careers (don't waste $ on competitor's PR)

```
{competitor} news | Phrase
{competitor} layoffs | Phrase
{competitor} careers | Phrase
{competitor} crunchbase | Phrase
{competitor} logo | Phrase
{competitor} linkedin | Phrase
```

## Category 8: "Free" / cost-shopper pollution (B2B SaaS rarely converts price-shoppers)

```
free | Exact
```

(Don't add `free` as Phrase — that would block legitimate "free trial" queries.)

---

## How to apply

In `config.shared_negatives`, list as `(keyword, match_type)` tuples. The generator auto-replicates each negative into every campaign as `Negative phrase` or `Negative exact`. This produces N×M rows in the master CSV (N negatives × M campaigns) but Editor handles it cleanly.

**Phase 2+ refinement:** After Week 2, run Search Term Report → identify top 10 wasted-spend search terms → add as new negatives. Repeat weekly.
