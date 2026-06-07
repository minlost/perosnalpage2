import { site } from "@/lib/site";
import Reveal from "./Reveal";
import ContactLinks from "./ContactLinks";
import TerminalCursor from "./TerminalCursor";

/**
 * Static hero content. The whole block is pointer-events-none so the bots
 * behind it stay grabbable across the entire viewport — only the contact
 * links opt back into pointer events.
 */
export default function Hero() {
  const lines = site.headline.split("\n");

  return (
    <section className="pointer-events-none relative z-10 flex min-h-dvh w-full items-center px-6 sm:px-10 md:px-16 lg:px-24">
      <div className="w-full max-w-3xl">
        {/* tiny terminal boot line */}
        <Reveal delay={0.05}>
          <p className="font-mono text-xs tracking-tight text-[var(--color-faint)]">
            {site.boot}
            <TerminalCursor />
          </p>
        </Reveal>

        {/* bitmap headline */}
        <Reveal delay={0.12} y={14}>
          <h1 className="mt-6 font-pixel text-[clamp(2.5rem,9vw,7rem)] font-bold leading-[0.95] tracking-tight text-[var(--color-ink)] [text-wrap:balance]">
            {lines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>
        </Reveal>

        {/* name + developer intro */}
        <Reveal delay={0.24}>
          <p className="mt-8 font-mono text-sm uppercase tracking-[0.25em] text-[var(--color-ink)] sm:text-base">
            {site.name}
          </p>
          <p className="mt-2 max-w-md font-mono text-sm leading-relaxed text-[var(--color-dim)] sm:text-base">
            {site.intro}
          </p>
        </Reveal>

        {/* contact links — pointer events re-enabled */}
        <Reveal delay={0.34} className="pointer-events-auto mt-10">
          <ContactLinks />
        </Reveal>

        {/* discoverable hint */}
        <Reveal delay={0.5}>
          <p className="mt-14 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-faint)]">
            drag the bots · throw them · click one a few times
          </p>
        </Reveal>
      </div>
    </section>
  );
}
