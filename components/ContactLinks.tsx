import { site } from "@/lib/site";

/** Minimal, keyboard-accessible contact links. No buttons, no cards. */
export default function ContactLinks() {
  return (
    <nav aria-label="contact" className="font-mono text-sm">
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-dim)]">
        {site.links.map((link) => {
          const external = link.href.startsWith("http");
          return (
            <li key={link.label} className="flex items-center gap-x-6">
              <a
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="group inline-flex items-center transition-colors duration-150 hover:text-[var(--color-ink)] focus-visible:text-[var(--color-ink)]"
              >
                <span aria-hidden="true" className="mr-2 text-[var(--color-faint)] group-hover:text-[var(--color-ink)]">
                  &gt;
                </span>
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
