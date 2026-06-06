export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vaclavvlcek.cz"
).replace(/\/$/, "");

export const site = {
  url: siteUrl,
  name: "Václav Vlček",
  title: "Václav Vlček — fullstack developer",
  description:
    "Fullstack developer building interactive systems and playful interfaces. A small experimental playground of floating pixel bots.",
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
  locale: "en",
  headline: "Here we go again",
  intro: "fullstack developer",
  boot: "~/ initializing",
  links: [
    { label: "email", href: "mailto:vaclav.wolf.vlcek@gmail.com" },
    { label: "github", href: "https://github.com/minlost" },
    {
      label: "linkedin",
      href: "https://www.linkedin.com/in/v%C3%A1clav-vl%C4%8Dek-45a265158/",
    },
  ],
} as const;

export const profileUrls = site.links
  .map((l) => l.href)
  .filter((href) => !href.startsWith("mailto:"));

export type SiteConfig = typeof site;
