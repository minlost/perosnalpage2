"use client";

import { useEffect, useRef, useState } from "react";
import RobotSprite from "./RobotSprite";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/* ------------------------------------------------------------------ */
/*  Tunables                                                          */
/* ------------------------------------------------------------------ */
const COUNT_DESKTOP = 9;
const COUNT_MOBILE = 4;
const MOBILE_BP = 720;

const WANDER_MIN = 12; // px/s — slow stroll, lots of empty space
const WANDER_MAX = 30;
const STEER = 2.6; // how smoothly a bot eases toward its target velocity
const WALK_MIN = 2.4; // sec spent walking before pausing
const WALK_MAX = 5.5;
const IDLE_MIN = 1.2; // sec spent idling between walks
const IDLE_MAX = 3.4;
const SLEEP_CHANCE = 0.3; // odds an idle turns into a nap
const WAKE_RADIUS = 180; // cursor distance that wakes a sleeping bot

const MOUSE_RADIUS = 150; // repulsion reach
const MOUSE_FORCE = 2600; // repulsion strength
const LOOK_RADIUS = 320; // start tracking cursor with eyes within this

const DRAG_FOLLOW = 26; // spring stiffness toward pointer while dragging
const THROW_MAX = 1500; // clamp thrown speed
const THROW_DAMP = 1.1; // exponential velocity damping per sec while thrown
const REST_SPEED = 26; // below this a thrown bot is "calm"
const REST_TIME = 0.8; // sec calm before it wanders again

const TAP_WINDOW = 600; // ms for counting rapid taps
const TAP_TRIGGER = 4; // taps that trigger the spin easter egg

const ROT_STEP = 2; // degrees — quantize rotation for a stepped look

// bots only ever walk along an axis: 0=right 1=down 2=left 3=up
const CARDINALS = [0, Math.PI / 2, Math.PI, -Math.PI / 2] as const;

// pick the next axis, biased so it rarely reverses 180° straight away and
// tends to either keep going or make a 90° turn — feels much more natural
const nextHeadingIdx = (cur: number) => {
  if (Math.random() < 0.12) return (cur + 2) % 4; // rare U-turn
  return [cur, (cur + 1) % 4, (cur + 3) % 4][(Math.random() * 3) | 0];
};

type Mode = "wander" | "drag" | "thrown";
type Act = "walk" | "idle" | "sleep";

interface Bot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // current rotation, degrees
  spin: number; // angular velocity, deg/s (used when thrown)
  heading: number; // wander direction, radians
  headingIdx: number; // 0..3 index into CARDINALS
  speed: number; // personal wander speed
  size: number;
  variant: number;
  special: boolean;
  mode: Mode;
  restTimer: number;
  act: Act; // autonomous activity: walking / idling / sleeping
  actTimer: number; // sec left in the current activity
  dir: "up" | "down" | "left" | "right"; // facing — drives which sprite shows
  walkDur: number; // current --walk-dur in seconds (cached to avoid churn)
  taps: number;
  lastTap: number;
  el: HTMLDivElement | null;
  pupils: SVGElement[];
}

interface Spec {
  id: number;
  variant: number;
  special: boolean;
  size: number;
  walkDelay: number; // negative delay so bots step out of phase with each other
}

interface DragState {
  index: number;
  ox: number;
  oy: number;
  moved: boolean;
  downAt: number;
  downX: number;
  downY: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function BotField() {
  const reduced = usePrefersReducedMotion();
  const [specs, setSpecs] = useState<Spec[]>([]);

  const botsRef = useRef<Bot[]>([]);
  const pointer = useRef({ x: -9999, y: -9999, inside: false });
  const drag = useRef<DragState>({
    index: -1,
    ox: 0,
    oy: 0,
    moved: false,
    downAt: 0,
    downX: 0,
    downY: 0,
  });
  const rafRef = useRef<number | null>(null);

  /* -------- build the field once we know the viewport -------- */
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = w < MOBILE_BP ? COUNT_MOBILE : COUNT_DESKTOP;
    const margin = 80;

    const list: Spec[] = [];
    const bots: Bot[] = [];

    for (let i = 0; i < count; i++) {
      const special = i === count - 1; // exactly one odd unit
      const size = special
        ? Math.round(rand(58, 70))
        : Math.round(rand(38, 60));
      const hi = (Math.random() * 4) | 0;

      list.push({
        id: i,
        variant: i % 3,
        special,
        size,
        walkDelay: -rand(0, 1.2),
      });

      bots.push({
        x: rand(margin, w - margin),
        y: rand(margin, h - margin),
        vx: 0,
        vy: 0,
        angle: 0,
        spin: 0,
        heading: CARDINALS[hi],
        headingIdx: hi,
        speed: rand(WANDER_MIN, WANDER_MAX),
        size,
        variant: i % 3,
        special,
        mode: "wander",
        restTimer: 0,
        act: "walk",
        actTimer: rand(WALK_MIN, WALK_MAX),
        dir: "down",
        walkDur: -1,
        taps: 0,
        lastTap: 0,
        el: null,
        pupils: [],
      });
    }

    botsRef.current = bots;
    setSpecs(list);
  }, []);

  /* -------- pointer tracking (mouse + touch via pointer events) -------- */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      pointer.current.inside = true;

      const d = drag.current;
      if (d.index >= 0) {
        const dx = e.clientX - d.downX;
        const dy = e.clientY - d.downY;
        if (dx * dx + dy * dy > 16) d.moved = true;
      }
    };
    const onLeave = () => {
      pointer.current.inside = false;
      pointer.current.x = -9999;
      pointer.current.y = -9999;
    };
    const onUp = () => {
      const d = drag.current;
      if (d.index < 0) return;
      const bot = botsRef.current[d.index];
      if (!bot) {
        d.index = -1;
        return;
      }

      bot.el?.classList.remove("is-panic"); // calm down on release

      const tapped = !d.moved && performance.now() - d.downAt < 250;
      if (tapped) {
        handleTap(bot);
        bot.mode = "wander";
        bot.restTimer = 0;
      } else {
        // release with whatever velocity the drag built up -> inertia
        bot.mode = "thrown";
        bot.vx = clamp(bot.vx, -THROW_MAX, THROW_MAX);
        bot.vy = clamp(bot.vy, -THROW_MAX, THROW_MAX);
        bot.spin = clamp(bot.vx * 0.25, -480, 480);
        bot.restTimer = 0;
      }
      d.index = -1;
      d.moved = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const handleTap = (bot: Bot) => {
    const now = performance.now();
    bot.taps = now - bot.lastTap < TAP_WINDOW ? bot.taps + 1 : 1;
    bot.lastTap = now;

    if (bot.taps >= TAP_TRIGGER) {
      // hidden interaction: rapid clicks make it spin out playfully
      bot.taps = 0;
      bot.mode = "thrown";
      const dir = Math.random() * Math.PI * 2;
      const power = rand(380, 620);
      bot.vx = Math.cos(dir) * power;
      bot.vy = Math.sin(dir) * power;
      bot.spin = rand(-900, 900);
    } else {
      // little hop for discoverability
      bot.mode = "thrown";
      bot.vy = -rand(140, 220);
      bot.vx += rand(-60, 60);
    }
  };

  /* -------- the physics loop -------- */
  useEffect(() => {
    if (specs.length === 0) return;

    // static placement when the user prefers reduced motion
    if (reduced) {
      for (const b of botsRef.current) {
        if (b.el) b.el.style.transform = `translate(${b.x}px,${b.y}px)`;
      }
      return;
    }

    let last = performance.now();

    // transition a bot into a new activity and reflect it on the DOM so CSS
    // can swap the animation (walk cycle / idle breathing / sleep)
    const applyAct = (b: Bot, act: Act) => {
      b.act = act;
      b.el?.setAttribute("data-act", act);
      if (act === "walk") {
        b.headingIdx = nextHeadingIdx(b.headingIdx);
        b.heading = CARDINALS[b.headingIdx];
        b.actTimer = rand(WALK_MIN, WALK_MAX);
      } else {
        // idle / sleep: stand still and face the viewer
        b.actTimer = act === "idle" ? rand(IDLE_MIN, IDLE_MAX) : 0;
        b.dir = "down";
        b.el?.setAttribute("data-dir", "down");
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const p = pointer.current;
      const bots = botsRef.current;
      const d = drag.current;

      for (let i = 0; i < bots.length; i++) {
        const b = bots[i];

        if (b.mode === "drag" && i === d.index) {
          // spring toward the grabbed point; derive velocity for the throw
          const tx = p.x - d.ox;
          const ty = p.y - d.oy;
          const k = Math.min(1, DRAG_FOLLOW * dt);
          const nx = b.x + (tx - b.x) * k;
          const ny = b.y + (ty - b.y) * k;
          b.vx = (nx - b.x) / dt;
          b.vy = (ny - b.y) / dt;
          b.x = nx;
          b.y = ny;
        } else {
          if (b.mode === "wander") {
            if (b.special) {
              // the odd one never rests: it heads toward the cursor, along
              // whichever axis the cursor is furthest on
              if (b.act !== "walk") applyAct(b, "walk");
              if (p.inside) {
                const dx = p.x - b.x;
                const dy = p.y - b.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                  b.headingIdx = dx < 0 ? 2 : 0;
                } else {
                  b.headingIdx = dy < 0 ? 3 : 1;
                }
                b.heading = CARDINALS[b.headingIdx];
                b.speed = WANDER_MAX * 1.15;
              }
            } else {
              // walk -> idle -> (sleep | walk) state machine
              b.actTimer -= dt;
              if (b.act === "walk") {
                if (b.actTimer <= 0) applyAct(b, "idle");
              } else if (b.act === "idle") {
                if (b.actTimer <= 0)
                  applyAct(b, Math.random() < SLEEP_CHANCE ? "sleep" : "walk");
              } else {
                // sleeping — wake and scurry away if the cursor gets close
                if (p.inside) {
                  const dx = b.x - p.x;
                  const dy = b.y - p.y;
                  if (dx * dx + dy * dy < WAKE_RADIUS * WAKE_RADIUS) {
                    applyAct(b, "walk");
                    if (Math.abs(dx) > Math.abs(dy)) {
                      b.headingIdx = dx > 0 ? 0 : 2; // flee horizontally
                    } else {
                      b.headingIdx = dy > 0 ? 1 : 3; // flee vertically
                    }
                    b.heading = CARDINALS[b.headingIdx];
                  }
                }
              }
            }

            const targetSpeed = b.act === "walk" ? b.speed : 0;
            const dvx = Math.cos(b.heading) * targetSpeed;
            const dvy = Math.sin(b.heading) * targetSpeed;
            const s = Math.min(1, STEER * dt);
            b.vx += (dvx - b.vx) * s;
            b.vy += (dvy - b.vy) * s;
          } else if (b.mode === "thrown") {
            const damp = Math.exp(-THROW_DAMP * dt);
            b.vx *= damp;
            b.vy *= damp;
            const sp = Math.hypot(b.vx, b.vy);
            if (sp < REST_SPEED) {
              b.restTimer += dt;
              if (b.restTimer > REST_TIME) {
                b.mode = "wander";
                b.restTimer = 0;
                b.spin = 0;
                applyAct(b, "walk"); // get back on its feet and stroll off
              }
            } else {
              b.restTimer = 0;
            }
          }

          // mouse repulsion — special bot is immune (it likes you)
          if (p.inside && !b.special) {
            const dx = b.x - p.x;
            const dy = b.y - p.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            if (dist < MOUSE_RADIUS) {
              const f = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) *
                (MOUSE_FORCE / dist);
              b.vx += (dx / dist) * f * dt;
              b.vy += (dy / dist) * f * dt;
            }
          }

          // integrate
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // soft viewport boundaries — push back + bleed energy
          const m = b.size * 0.5 + 6;
          if (b.x < m) {
            b.vx += (m - b.x) * 8 * dt;
            b.vx *= 0.8;
          } else if (b.x > w - m) {
            b.vx -= (b.x - (w - m)) * 8 * dt;
            b.vx *= 0.8;
          }
          if (b.y < m) {
            b.vy += (m - b.y) * 8 * dt;
            b.vy *= 0.8;
          } else if (b.y > h - m) {
            b.vy -= (b.y - (h - m)) * 8 * dt;
            b.vy *= 0.8;
          }

          // walking into an edge? turn back inward instead of grinding on it
          if (b.mode === "wander" && b.act === "walk") {
            if (b.x < m && b.headingIdx === 2) b.headingIdx = 0;
            else if (b.x > w - m && b.headingIdx === 0) b.headingIdx = 2;
            if (b.y < m && b.headingIdx === 3) b.headingIdx = 1;
            else if (b.y > h - m && b.headingIdx === 1) b.headingIdx = 3;
            b.heading = CARDINALS[b.headingIdx];
          }
        }

        // rotation: gentle tilt from horizontal motion, real spin when thrown
        if (b.mode === "thrown" && Math.abs(b.spin) > 1) {
          b.angle += b.spin * dt;
          b.spin *= Math.exp(-1.4 * dt);
        } else {
          // gentle lean in the walk direction (the sprite already conveys
          // facing, so keep this subtle)
          const tilt = clamp(b.vx * 0.08, -5, 5);
          b.angle += (tilt - b.angle) * Math.min(1, 4 * dt);
        }

        // eye tracking — pupils lean toward the cursor when it's near
        if (b.pupils.length && p.inside) {
          const dx = p.x - b.x;
          const dy = p.y - b.y;
          const dist = Math.hypot(dx, dy) || 1;
          const within = b.special ? Infinity : LOOK_RADIUS;
          if (dist < within) {
            const amp = 1.1;
            const ex = (dx / dist) * amp;
            const ey = (dy / dist) * amp;
            for (const pu of b.pupils) {
              pu.style.transform = `translate(${ex.toFixed(2)}px,${ey.toFixed(
                2,
              )}px)`;
            }
          } else {
            for (const pu of b.pupils) pu.style.transform = "translate(0,0)";
          }
        } else if (b.pupils.length) {
          for (const pu of b.pupils) pu.style.transform = "translate(0,0)";
        }

        const sp = Math.hypot(b.vx, b.vy);

        // pick the facing sprite from the dominant axis of motion; keep the
        // last facing while standing (or while grabbed — it faces us, panicking)
        if (sp > 6 && b.mode !== "drag") {
          const ax = Math.abs(b.vx);
          const ay = Math.abs(b.vy);
          const dir =
            ax > ay ? (b.vx < 0 ? "left" : "right") : b.vy < 0 ? "up" : "down";
          if (dir !== b.dir) {
            b.dir = dir;
            b.el?.setAttribute("data-dir", dir);
          }
        }

        // match the walk-cycle tempo to how fast the bot is actually moving:
        // strolling -> brisk steps, standing -> slow idle shuffle
        let dur = sp < 4 ? 1.5 : clamp(0.9 - (sp - 4) * 0.02, 0.4, 0.9);
        dur = Math.round(dur * 20) / 20; // bucket to 0.05s to avoid restart churn
        if (dur !== b.walkDur) {
          b.walkDur = dur;
          b.el?.style.setProperty("--walk-dur", `${dur}s`);
        }

        // commit transform — quantize for the stepped, low-res feel
        if (b.el) {
          const qx = Math.round(b.x - b.size / 2);
          const qy = Math.round(b.y - b.size / 2);
          const qa = Math.round(b.angle / ROT_STEP) * ROT_STEP;
          b.el.style.transform = `translate(${qx}px,${qy}px) rotate(${qa}deg)`;
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [specs.length, reduced]);

  /* -------- keep bots inside the viewport on resize -------- */
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const b of botsRef.current) {
        b.x = clamp(b.x, b.size, w - b.size);
        b.y = clamp(b.y, b.size, h - b.size);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    const bot = botsRef.current[index];
    if (!bot) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    drag.current = {
      index,
      ox: e.clientX - bot.x,
      oy: e.clientY - bot.y,
      moved: false,
      downAt: performance.now(),
      downX: e.clientX,
      downY: e.clientY,
    };
    bot.mode = "drag";
    bot.spin = 0;

    // freak out: wake up, face the viewer and flail until released
    bot.act = "walk";
    bot.actTimer = rand(WALK_MIN, WALK_MAX);
    bot.dir = "down";
    bot.el?.setAttribute("data-act", "walk");
    bot.el?.setAttribute("data-dir", "down");
    bot.el?.classList.add("is-panic");
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {specs.map((s, i) => (
        <div
          key={s.id}
          className="bot pointer-events-auto"
          data-dir="down"
          data-act="walk"
          style={{ width: s.size, height: s.size }}
          onPointerDown={(e) => startDrag(e, i)}
          ref={(el) => {
            const bot = botsRef.current[i];
            if (!bot) return;
            bot.el = el;
            if (el) {
              bot.pupils = Array.from(
                el.querySelectorAll<SVGElement>("[data-pupil]"),
              );
              // place immediately so there is no first-frame flash at 0,0
              el.style.transform = `translate(${Math.round(
                bot.x - bot.size / 2,
              )}px,${Math.round(bot.y - bot.size / 2)}px)`;
            }
          }}
        >
          <div
            className={reduced ? "h-full w-full" : "bot-anim"}
            style={
              reduced
                ? undefined
                : ({ "--walk-delay": `${s.walkDelay}s` } as React.CSSProperties)
            }
          >
            <RobotSprite variant={s.variant} special={s.special} />
          </div>
          {/* sleep "z" — only visible while napping (CSS) */}
          <span className="bot-zzz font-pixel" aria-hidden="true">
            z
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
