/**
 * Single source of truth for all editable copy, links, and SEO metadata.
 * Change these values to make the page yours — everything else (metadata,
 * sitemap, robots, OG images, JSON-LD) reads from here.
 */

/** Production origin, no trailing slash. Used for canonical URL, sitemap,
 *  robots, and Open Graph absolute URLs. Override per-env with NEXT_PUBLIC_SITE_URL. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vaclavvlcek.cz"
).replace(/\/$/, "");

export const site = {
  /** Production origin (no trailing slash). */
  url: siteUrl,

  /** Person / brand name — used in metadata, JSON-LD, and the OG image. */
  name: "Václav Vlček",

  /** Browser tab + search-result title. */
  title: "Václav Vlček — fullstack developer",

  /** SEO + social description (≤ ~160 chars). */
  description:
    "Fullstack developer building interactive systems and playful interfaces. A small experimental playground of floating pixel bots.",

  /** Search keywords. Kept short and honest. */
  keywords: [
    "Václav Vlček",
    "fullstack developer",
    "frontend developer",
    "Next.js",
    "React",
    "TypeScript",
    "interactive systems",
    "creative developer",
  ],

  /** BCP-47 locale of the page content. */
  locale: "en",

  /** Big bitmap headline. Use \n to force a line break. */
  headline: "Here we go again",

  /** One-line developer intro under the headline. */
  intro: "fullstack developer",

  /** Tiny terminal boot line. */
  boot: "~/ initializing",

  /** Minimal contact links. Order is preserved. */
  links: [
    { label: "email", href: "mailto:vaclav.wolf.vlcek@gmail.com" },
    { label: "github", href: "https://github.com/minlost" },
    {
      label: "linkedin",
      href: "https://www.linkedin.com/in/v%C3%A1clav-vl%C4%8Dek-45a265158/",
    },
  ],
} as const;

/** Absolute profile URLs (sameAs in JSON-LD) — every non-mailto link. */
export const profileUrls = site.links
  .map((l) => l.href)
  .filter((href) => !href.startsWith("mailto:"));

export type SiteConfig = typeof site;
