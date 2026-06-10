/**
 * src/lib/page-content.ts
 *
 * SINGLE SOURCE OF TRUTH for all page text content.
 * Components and pages import from this file — never hardcode text in JSX.
 *
 * To launch a new site with different content:
 * 1. Replace all text values in this file
 * 2. Update site-config.ts for brand/nav/footer
 * 3. Update seo-config.ts for SEO metadata
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface TopicCardData {
  title: string;
  description: string;
  href: string;
  /** lucide-react icon name — import and map in component */
  iconName: string;
  articles: number;
}

export interface PopularTopicData {
  title: string;
  href: string;
  tag: string;
}

export interface UseCasePreviewData {
  title: string;
  description: string;
  href: string;
}

export interface TocItem {
  id: string;
  label: string;
}

export interface ContentCard {
  title: string;
  description: string;
}

export interface DiagramData {
  title: string;
  steps: string[];
}

export interface RelatedTopicData {
  title: string;
  href: string;
  description: string;
}

export interface ContentSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  cards?: ContentCard[];
  diagram?: DiagramData;
  listItems?: string[];
}

// ---------------------------------------------------------------------------
// Home page content
// ---------------------------------------------------------------------------

export interface HomeContent {
  hero: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subtitle: string;
    cta: { text: string; href: string };
  };
  topicsHeading: string;
  topicsSubtitle: string;
  topics: TopicCardData[];
  popularHeading: string;
  popularSubtitle: string;
  popularTopics: PopularTopicData[];
  useCasesHeading: string;
  useCasesSubtitle: string;
  useCases: UseCasePreviewData[];
}

export const homeContent: HomeContent = {
  hero: {
    badge: "{Site Name} Knowledge Hub",
    headline: "{Niche Topic}",
    headlineAccent: "Knowledge Hub",
    subtitle: "{One sentence describing the site's value proposition}",
    cta: { text: "Explore how enterprises implement {topic} →", href: "/{primary-slug}" },
  },
  topicsHeading: "Explore Topics",
  topicsSubtitle: "Deep-dive into the pillars of {niche}",
  topics: [
    { title: "{Topic 1}", description: "{1-2 sentence description}", href: "/{slug}", iconName: "Bot", articles: 12 },
    { title: "{Topic 2}", description: "{1-2 sentence description}", href: "/{slug}", iconName: "Zap", articles: 9 },
    { title: "{Topic 3}", description: "{1-2 sentence description}", href: "/{slug}", iconName: "Building2", articles: 15 },
    { title: "{Topic 4}", description: "{1-2 sentence description}", href: "/{slug}", iconName: "Puzzle", articles: 18 },
    { title: "Use Cases", description: "{1-2 sentence description}", href: "/use-cases", iconName: "Briefcase", articles: 8 },
    { title: "Comparisons", description: "{1-2 sentence description}", href: "/comparisons", iconName: "GitCompare", articles: 6 },
  ],
  popularHeading: "Popular Topics",
  popularSubtitle: "Most-read articles by {target audience}",
  popularTopics: [
    { title: "{Popular article title 1}", href: "/{slug}", tag: "{Tag}" },
    { title: "{Popular article title 2}", href: "/{slug}", tag: "{Tag}" },
    { title: "{Popular article title 3}", href: "/{slug}", tag: "{Tag}" },
    { title: "{Popular article title 4}", href: "/{slug}", tag: "{Tag}" },
    { title: "{Popular article title 5}", href: "/{slug}", tag: "{Tag}" },
    { title: "{Popular article title 6}", href: "/{slug}", tag: "{Tag}" },
  ],
  useCasesHeading: "Use Cases",
  useCasesSubtitle: "How enterprises apply {topic} across industries",
  useCases: [
    { title: "{Industry 1}", description: "{Use case description}", href: "/use-cases" },
    { title: "{Industry 2}", description: "{Use case description}", href: "/use-cases" },
    { title: "{Industry 3}", description: "{Use case description}", href: "/use-cases" },
  ],
};

// ---------------------------------------------------------------------------
// Article page content (topic deep-dives)
// ---------------------------------------------------------------------------

export interface ArticlePageContent {
  badge: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
  keyInsights: string[];
  toc: TocItem[];
  sections: ContentSection[];
  relatedTopics: RelatedTopicData[];
}

export const articlePages: Record<string, ArticlePageContent> = {
  "/{topic-1-slug}": {
    badge: "{Topic 1}",
    headline: "{Topic 1}:",
    headlineAccent: "{Compelling subtitle}",
    subtitle: "{One sentence page description}",
    keyInsights: [
      "{Insight 1 — key takeaway}",
      "{Insight 2 — key takeaway}",
      "{Insight 3 — key takeaway}",
      "{Insight 4 — key takeaway}",
    ],
    toc: [
      { id: "section-1", label: "{Section 1 Title}" },
      { id: "section-2", label: "{Section 2 Title}" },
      { id: "section-3", label: "{Section 3 Title}" },
    ],
    sections: [
      {
        id: "section-1",
        heading: "{Section 1 Title}",
        paragraphs: [
          "{Paragraph 1 text...}",
          "{Paragraph 2 text...}",
        ],
      },
      {
        id: "section-2",
        heading: "{Section 2 Title}",
        cards: [
          { title: "{Card 1}", description: "{Card 1 description}" },
          { title: "{Card 2}", description: "{Card 2 description}" },
          { title: "{Card 3}", description: "{Card 3 description}" },
          { title: "{Card 4}", description: "{Card 4 description}" },
        ],
      },
      {
        id: "section-3",
        heading: "{Section 3 Title}",
        paragraphs: ["{Paragraph text...}"],
        diagram: { title: "{Diagram Title}", steps: ["{Step 1}", "{Step 2}", "{Step 3}", "{Step 4}"] },
      },
    ],
    relatedTopics: [
      { title: "{Related 1}", href: "/{slug}", description: "{Why it's related}" },
      { title: "{Related 2}", href: "/{slug}", description: "{Why it's related}" },
      { title: "{Related 3}", href: "/{slug}", description: "{Why it's related}" },
    ],
  },
  // ... repeat for each article page
};

// ---------------------------------------------------------------------------
// Catalog page content (Use Cases, Comparisons, Resources)
// ---------------------------------------------------------------------------

export interface CatalogCardData {
  title: string;
  description: string;
  tag: string;
  href?: string;
  /** For Resources page: resource type icon name */
  iconName?: string;
  /** For Resources page: resource type label */
  type?: string;
}

export interface CatalogPageContent {
  badge: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
  cards: CatalogCardData[];
  /** "gradient" or "subtle" — CTA banner variant */
  ctaVariant: "gradient" | "subtle";
}

export const catalogPages: Record<string, CatalogPageContent> = {
  "/use-cases": {
    badge: "Use Cases",
    headline: "{Niche}",
    headlineAccent: "Use Cases",
    subtitle: "{One sentence description}",
    cards: [
      { title: "{Use Case 1}", description: "{Description}", tag: "{Industry}", href: "#" },
      { title: "{Use Case 2}", description: "{Description}", tag: "{Industry}", href: "#" },
    ],
    ctaVariant: "gradient",
  },
  "/comparisons": {
    badge: "Comparisons",
    headline: "{Niche}",
    headlineAccent: "Comparisons",
    subtitle: "{One sentence description}",
    cards: [
      { title: "{Comparison 1}", description: "{Description}", tag: "{Category}" },
      { title: "{Comparison 2}", description: "{Description}", tag: "{Category}" },
    ],
    ctaVariant: "subtle",
  },
  "/resources": {
    badge: "Resources",
    headline: "{Niche}",
    headlineAccent: "Resources",
    subtitle: "{One sentence description}",
    cards: [
      { title: "{Resource 1}", description: "{Description}", tag: "{Type}", type: "Guide", iconName: "BookOpen" },
      { title: "{Resource 2}", description: "{Description}", tag: "{Type}", type: "Whitepaper", iconName: "FileText" },
    ],
    ctaVariant: "gradient",
  },
};

// ---------------------------------------------------------------------------
// 404 page
// ---------------------------------------------------------------------------

export const notFoundContent = {
  heading: "Page not found",
  message: "The page you're looking for doesn't exist or has been moved.",
  linkText: "Return to home",
  linkHref: "/",
};
