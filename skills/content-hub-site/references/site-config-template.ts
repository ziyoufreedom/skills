/**
 * src/lib/site-config.ts
 *
 * SINGLE SOURCE OF TRUTH for brand identity, navigation, and footer.
 * Every component that displays the brand name, nav links, or footer
 * MUST import from this file. Never hardcode brand strings in components.
 *
 * To rebrand: change values in this file + HSL vars in index.css.
 */

// ---------------------------------------------------------------------------
// Site identity
// ---------------------------------------------------------------------------

export const SITE = {
  name: "{Site Name}",
  tagline: "{Site tagline — one sentence}",
  logoText: "{L}", // single letter/emoji shown in the logo box
  domain: "", // set when domain is live, e.g. "https://www.example.com"
} as const;

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "{Topic 1}", href: "/{topic-1-slug}" },
  { label: "{Topic 2}", href: "/{topic-2-slug}" },
  { label: "{Topic 3}", href: "/{topic-3-slug}" },
  { label: "{Topic 4}", href: "/{topic-4-slug}" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Comparisons", href: "/comparisons" },
  { label: "Resources", href: "/resources" },
];

// The primary CTA button in the header
export const NAV_CTA = {
  text: `Explore ${SITE.name} →`,
  href: "/{primary-topic-slug}",
} as const;

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export const FOOTER_LINKS: FooterLinkGroup[] = [
  {
    title: "Knowledge Hub",
    links: [
      { label: "{Topic 1}", href: "/{topic-1-slug}" },
      { label: "{Topic 2}", href: "/{topic-2-slug}" },
      { label: "{Topic 3}", href: "/{topic-3-slug}" },
      { label: "{Topic 4}", href: "/{topic-4-slug}" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Use Cases", href: "/use-cases" },
      { label: "Comparisons", href: "/comparisons" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: `About ${SITE.name}`, href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

export const FOOTER_TAGLINE = `The ${SITE.tagline.toLowerCase()}. Built for enterprise teams.`;

// ---------------------------------------------------------------------------
// CTA defaults — used by CTABanner component when no props are passed
// ---------------------------------------------------------------------------

export const CTA_DEFAULTS = {
  title: "See how this is implemented in enterprise AI",
  description:
    "Explore real-world implementations and architecture patterns used by leading enterprises.",
  linkText: `Explore ${SITE.name} Platform →`,
  linkHref: "#",
} as const;
