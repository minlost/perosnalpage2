/**
 * Single source of truth for all editable copy + links.
 * Change these values to make the page yours.
 */
export const site = {
  /** Big bitmap headline. Use \n to force a line break. */
  headline: "Here we go again",

  /** One-line developer intro under the headline. */
  intro: "creative developer building AI interfaces and interactive systems",

  /** Tiny terminal boot line. */
  boot: "~/ initializing playground",

  /** Minimal contact links. Order is preserved. */
  links: [
    { label: "email", href: "mailto:vaclav.wolf.vlcek@gmail.com" },
    { label: "github", href: "https://github.com/" },
    { label: "x", href: "https://x.com/" },
  ],
} as const;

export type SiteConfig = typeof site;
