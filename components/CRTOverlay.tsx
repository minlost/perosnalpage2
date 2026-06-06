/**
 * Atmosphere layer: faint scanlines + a barely-there flicker. Sits above
 * everything, never intercepts pointer events. Flicker is disabled under
 * reduced-motion via CSS.
 */
export default function CRTOverlay() {
  return (
    <div
      aria-hidden="true"
      className="crt-scanlines crt-flicker pointer-events-none fixed inset-0 z-50 mix-blend-screen"
    />
  );
}
