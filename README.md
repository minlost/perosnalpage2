# personal_page_2_0

A minimalist, highly interactive developer landing page — black background,
strict white/gray monochrome, bitmap typography, and a field of floating
pixel-art bots you can grab, throw, and provoke.

Retro-futuristic hacker aesthetic. No cards, no gradients, no SaaS polish.

## Stack

- **Next.js 16** (App Router, React Server Components)
- **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** (entrance only)
- Custom lightweight physics for the bots — no game engine

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## The bot system

Everything bot-related lives in [components/BotField.tsx](components/BotField.tsx),
a single `requestAnimationFrame` loop that drives all bots by mutating refs and
writing `transform` directly to the DOM (no per-frame React re-renders).

Behaviors:

- **Wander** — each bot eases toward a slowly changing heading at its own speed;
  directions desync so movement never looks synchronized.
- **Mouse repulsion** — bots near the cursor are gently pushed away.
- **Drag** — grab any bot (mouse or touch); it springs to your pointer.
- **Throw** — release while moving and it keeps momentum, damping back to a
  wander after it settles.
- **Eye tracking** — pupils lean toward the cursor when it's close.
- **Stepped motion** — position and rotation are quantized, plus a 2-frame
  CSS `steps()` idle bob, for a low-res retro feel.

Easter eggs:

- One bot is **special** (a filled cyclops): it's curious and drifts toward the
  cursor, immune to repulsion, and always watches you.
- **Rapid-click** a bot a few times and it spins out.
- A single tap makes a bot hop.
- Subtle **CRT** scanlines + flicker, and a blinking terminal cursor.

## Accessibility

- Contact links are real, keyboard-focusable `<a>` elements with visible focus.
- The bot canvas is `aria-hidden` (decorative).
- `prefers-reduced-motion` disables wandering, the idle bob, CRT flicker, and
  entrance animation — bots render static.

## Responsive

- Bot count drops on small screens; full touch drag/throw support via Pointer
  Events.

## Make it yours

All copy, links, and SEO metadata live in [lib/site.ts](lib/site.ts) — the
single source of truth. Edit the `site` object (name, title, description,
keywords, headline, intro, links) and everything downstream updates. Tune bot
feel via the constants at the top of [components/BotField.tsx](components/BotField.tsx).

## SEO & production

Driven entirely from [lib/site.ts](lib/site.ts):

- **Metadata** — title template, canonical URL, Open Graph + Twitter cards, and
  schema.org `Person` JSON-LD ([app/layout.tsx](app/layout.tsx)).
- **`/sitemap.xml`** and **`/robots.txt`** — generated metadata routes
  ([app/sitemap.ts](app/sitemap.ts), [app/robots.ts](app/robots.ts)).
- **Icons & social image** — favicon ([app/icon.svg](app/icon.svg)), generated
  Apple touch icon, and a 1200×630 Open Graph / Twitter image rendered with
  `next/og` ([app/opengraph-image.tsx](app/opengraph-image.tsx)), plus a PWA
  [manifest](app/manifest.ts).
- **Security headers** — set for every route in [next.config.ts](next.config.ts)
  (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS); `X-Powered-By` is disabled.

The production origin defaults to `https://vaclavvlcek.cz`. Override per
environment with `NEXT_PUBLIC_SITE_URL` (no trailing slash).
