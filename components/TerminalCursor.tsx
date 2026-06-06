/** A tiny blinking block cursor — terminal flavor. Purely decorative. */
export default function TerminalCursor() {
  return (
    <span
      aria-hidden="true"
      className="blink ml-1 inline-block h-[1em] w-[0.55em] translate-y-[0.12em] bg-[var(--color-ink)] align-baseline"
    />
  );
}
