"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "on" | "off" | "powering-off" | "powering-on";

// keep in sync with the longest CRT keyframe duration in globals.css
const ANIM_MS = 600;

/**
 * Wraps the whole scene in a CRT "tube" that can be switched off with the
 * classic old-television collapse: the picture flattens to a bright
 * horizontal line, snaps into a single dot, then goes dark — leaving just
 * the power button on a black screen. Switching it back on reverses the
 * sequence and the picture blooms back open.
 *
 * The power button lives OUTSIDE the collapsing layer, so it survives the
 * shutdown and gives you the way back in.
 */
export default function PowerScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("off");
  const timer = useRef<number | null>(null);

  const offAnim = phase === "powering-off";
  const onAnim = phase === "powering-on";
  const animating = offAnim || onAnim;
  const isOff = phase === "off";
  // while the screen is on (or on its way out) the button offers "off"
  const turningOff = phase === "on" || phase === "powering-off";

  const finish = useCallback(() => {
    setPhase((p) =>
      p === "powering-off" ? "off" : p === "powering-on" ? "on" : p,
    );
  }, []);

  const toggle = useCallback(() => {
    // ignore clicks fired mid-collapse so the animation can't be re-triggered
    if (phase !== "on" && phase !== "off") return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      // no theatrics — just cut the picture in/out
      setPhase(phase === "on" ? "off" : "on");
      return;
    }
    setPhase(phase === "on" ? "powering-off" : "powering-on");
  }, [phase]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      setPhase(reduce ? "on" : "powering-on");
    }, 450);
    return () => window.clearTimeout(t);
  }, []);

  // safety net: finalize even if animationend never lands (e.g. the tab was
  // backgrounded mid-collapse and the animation got dropped)
  useEffect(() => {
    if (!animating) return;
    timer.current = window.setTimeout(finish, ANIM_MS + 120);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [animating, finish]);

  // only react to the wrapper's OWN animation — child animations (bots,
  // cursor blink, fx-*) bubble up here too and must be ignored
  const onAnimationEnd = (e: React.AnimationEvent) => {
    if (e.target === e.currentTarget) finish();
  };

  return (
    <>
      <div
        className={[
          "tv-screen absolute inset-0",
          offAnim && "is-powering-off",
          onAnim && "is-powering-on",
          isOff && "is-off",
        ]
          .filter(Boolean)
          .join(" ")}
        onAnimationEnd={onAnimationEnd}
      >
        {children}
      </div>

      {/* the bright bar that snaps to a dot as the tube collapses (and back) */}
      {animating && (
        <div
          aria-hidden="true"
          className={`tv-flash ${offAnim ? "is-powering-off" : "is-powering-on"}`}
        />
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={turningOff ? "turn screen off" : "turn screen on"}
        aria-pressed={isOff}
        className={`power-btn pointer-events-auto fixed right-4 top-4 z-[70] flex cursor-pointer items-center gap-1.5 border-2 border-[var(--color-ink)] bg-[var(--color-void)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-void)] ${
          isOff ? "is-off" : ""
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
          aria-hidden="true"
          className="pixelated"
        >
          <line x1="12" y1="2.5" x2="12" y2="11" />
          <path d="M6.6 6.6a7.5 7.5 0 1 0 10.8 0" />
        </svg>
        <span>{turningOff ? "off" : "on"}</span>
      </button>
    </>
  );
}
