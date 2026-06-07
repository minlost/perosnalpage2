"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  FX registry                                                       */
/*  Each visual effect maps to a CSS class on one of two layers:      */
/*    stage — filter based (color / blur), composed via CSS vars      */
/*    warp  — transform based (motion)                                */
/*  `matrix` is special: it mounts a <canvas> instead of a class.     */
/* ------------------------------------------------------------------ */
type Layer = "stage" | "warp";

interface Fx {
  cls: string;
  layer: Layer;
  desc: string;
}

const FX: Record<string, Fx> = {
  blur: { cls: "fx-blur", layer: "stage", desc: "blur the screen" },
  invert: { cls: "fx-invert", layer: "stage", desc: "invert colors" },
  rave: { cls: "fx-rave", layer: "stage", desc: "color flicker / strobe" },
  green: { cls: "fx-green", layer: "stage", desc: "green phosphor (P1)" },
  amber: { cls: "fx-amber", layer: "stage", desc: "amber phosphor" },
  disco: { cls: "fx-disco", layer: "warp", desc: "color disco wave" },
  crt: { cls: "fx-crt", layer: "stage", desc: "hard CRT mode" },
  glitch: { cls: "fx-glitch", layer: "warp", desc: "signal glitch" },
  shake: { cls: "fx-shake", layer: "warp", desc: "screen shake" },
  spin: { cls: "fx-spin", layer: "warp", desc: "spin the room" },
  flip: { cls: "fx-flip", layer: "warp", desc: "upside down" },
  zoom: { cls: "fx-zoom", layer: "warp", desc: "pixel zoom" },
  matrix: { cls: "", layer: "stage", desc: "falling code" },
};

// effect order used for help + the preset chips
const FX_ORDER = Object.keys(FX);

type LineKind = "in" | "out" | "err" | "sys";
interface Line {
  id: number;
  kind: LineKind;
  text: string;
}

const PROMPT = "guest@vlcek:~$";

/* ------------------------------------------------------------------ */
/*  Matrix rain — lightweight canvas overlay, monochrome on-brand     */
/* ------------------------------------------------------------------ */
function MatrixRain() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "01<>/[]{}=+*アカサタナハマabcdef".split("");
    let cols = 0;
    let drops: number[] = [];
    const fontSize = 14;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / fontSize);
      drops = Array.from({ length: cols }, () =>
        Math.floor((Math.random() * canvas.height) / fontSize),
      );
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 55) return; // throttle to a chunky ~18fps step
      last = t;

      ctx.fillStyle = "rgba(0,0,0,0.18)"; // fade trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < cols; i++) {
        const ch = chars[(Math.random() * chars.length) | 0];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillStyle = "#ededed"; // lead glyph
        ctx.fillText(ch, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fx-matrix-canvas pixelated"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Terminal                                                          */
/* ------------------------------------------------------------------ */
export default function Terminal() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [active, setActive] = useState<Set<string>>(new Set());
  const idRef = useRef(1);
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: 0,
      kind: "sys",
      text: "console v1.0 — type 'help' or click a command",
    },
  ]);

  const history = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // unique, monotonic line ids that survive Fast Refresh (a module-level
  // counter would reset and collide with ids already held in state)
  const mk = useCallback(
    (kind: LineKind, text: string): Line => ({
      id: idRef.current++,
      kind,
      text,
    }),
    [],
  );

  const push = useCallback((...l: Line[]) => {
    setLines((prev) => [...prev, ...l].slice(-120));
  }, []);

  /* -------- sync active effects onto the page layers -------- */
  useEffect(() => {
    const stage = document.getElementById("fx-stage");
    const warp = document.getElementById("fx-warp");
    if (!stage || !warp) return;

    // clear everything we own
    Object.values(FX).forEach((f) => {
      if (f.cls) (f.layer === "stage" ? stage : warp).classList.remove(f.cls);
    });
    stage.classList.remove("fx-filter");

    // re-apply what's on
    let hasFilter = false;
    active.forEach((key) => {
      const f = FX[key];
      if (!f || !f.cls) return;
      (f.layer === "stage" ? stage : warp).classList.add(f.cls);
      if (f.layer === "stage") hasFilter = true;
    });
    if (hasFilter) stage.classList.add("fx-filter");
  }, [active]);

  /* -------- keep the output scrolled to the newest line -------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  /* -------- focus the input whenever the console opens -------- */
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* -------- global hotkey: backtick toggles the console -------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* -------- command parsing -------- */
  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim().replace(/^\//, "").toLowerCase();
      if (!cmd) return;

      history.current.push(raw.trim());
      histIdx.current = history.current.length;
      push(mk("in", `${PROMPT} ${cmd}`));

      // help / commands
      if (cmd === "help" || cmd === "?" || cmd === "commands") {
        push(mk("out", "effects (toggle by entering them again):"));
        FX_ORDER.forEach((k) =>
          push(mk("out", `  ${k.padEnd(8)} — ${FX[k].desc}`)),
        );
        push(mk("out", "other: help · clear · reset · whoami"));
        return;
      }
      if (cmd === "clear" || cmd === "cls") {
        setLines([]);
        return;
      }
      if (cmd === "reset" || cmd === "off") {
        setActive(new Set());
        push(mk("sys", "all effects off"));
        return;
      }
      if (cmd === "whoami") {
        push(mk("out", "Václav Vlček — fullstack developer"));
        push(mk("out", "github.com/minlost"));
        return;
      }

      // an effect toggle
      if (FX[cmd]) {
        const on = !active.has(cmd);
        setActive((prev) => {
          const next = new Set(prev);
          if (on) next.add(cmd);
          else next.delete(cmd);
          return next;
        });
        push(mk("sys", `${cmd}: ${on ? "ON" : "OFF"}`));
        return;
      }

      push(mk("err", `command not found: ${cmd} (try 'help')`));
    },
    [push, mk, active],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(value);
    setValue("");
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // history navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx.current > 0) {
        histIdx.current--;
        setValue(history.current[histIdx.current] ?? "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx.current < history.current.length - 1) {
        histIdx.current++;
        setValue(history.current[histIdx.current] ?? "");
      } else {
        histIdx.current = history.current.length;
        setValue("");
      }
    }
  };

  /* -------- collapsed launcher -------- */
  if (!open) {
    return (
      <>
        {active.has("matrix") && <MatrixRain />}
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto fixed bottom-4 left-4 z-[60] border-2 border-[var(--color-ink)] bg-[var(--color-void)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-void)]"
        >
          <span className="blink mr-1 inline-block">{">"}</span>console
        </button>
      </>
    );
  }

  const lineColor: Record<LineKind, string> = {
    in: "text-[var(--color-ink)]",
    out: "text-[var(--color-dim)]",
    err: "text-[var(--color-ink)]",
    sys: "text-[var(--color-faint)]",
  };

  return (
    <>
      {active.has("matrix") && <MatrixRain />}

      <div className="pointer-events-auto fixed bottom-4 left-4 z-[60] w-[min(92vw,440px)] border-2 border-[var(--color-ink)] bg-[var(--color-void)] font-mono text-[11px] shadow-[6px_6px_0_0_var(--color-line)]">
        {/* title bar */}
        <div className="flex items-center justify-between border-b-2 border-[var(--color-ink)] bg-[var(--color-ink)] px-2 py-1 text-[var(--color-void)]">
          <span className="font-pixel text-[10px] uppercase tracking-[0.2em]">
            console
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="close console"
            className="px-1 leading-none hover:bg-[var(--color-void)] hover:text-[var(--color-ink)]"
          >
            ×
          </button>
        </div>

        {/* output */}
        <div
          ref={scrollRef}
          className="h-44 overflow-y-auto px-2 py-1.5 leading-relaxed"
        >
          {lines.map((l) => (
            <div
              key={l.id}
              className={`whitespace-pre-wrap break-words ${lineColor[l.kind]}`}
            >
              {l.kind === "err" ? `! ${l.text}` : l.text}
            </div>
          ))}
        </div>

        {/* preset chips */}
        <div className="flex flex-wrap gap-1 border-t border-[var(--color-line)] px-2 py-1.5">
          {FX_ORDER.map((k) => (
            <button
              key={k}
              onClick={() => run(k)}
              className={`border px-1.5 py-0.5 uppercase tracking-wide transition-colors ${
                active.has(k)
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-void)]"
                  : "border-[var(--color-faint)] text-[var(--color-dim)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
              }`}
            >
              {k}
            </button>
          ))}
          <button
            onClick={() => run("reset")}
            className="border border-[var(--color-faint)] px-1.5 py-0.5 uppercase tracking-wide text-[var(--color-dim)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
          >
            reset
          </button>
        </div>

        {/* input */}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-1.5 border-t-2 border-[var(--color-ink)] px-2 py-1.5"
        >
          <span className="shrink-0 text-[var(--color-dim)]">{PROMPT}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onInputKey}
            spellCheck={false}
            autoComplete="off"
            className="console-input w-full bg-transparent text-[var(--color-ink)] caret-[var(--color-ink)] outline-none"
            placeholder="type a command…"
          />
        </form>
      </div>
    </>
  );
}
