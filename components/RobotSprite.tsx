/**
 * Pixel-art robot sprites rendered as crisp monochrome SVG.
 *
 * Pupils carry a `data-pupil` attribute so the physics loop can find them by
 * query and translate them to "look" toward the cursor — no per-pupil React
 * state, keeps the render tree static and fast.
 *
 * Strict palette: only shades of gray. Eyes read as light squares on the dark
 * body with a dark pupil. The page background is pure black.
 */

const TONES = ["#ededed", "#bdbdbd", "#8f8f8f"] as const;

type Props = {
  variant?: number;
  special?: boolean;
  className?: string;
};

export default function RobotSprite({
  variant = 0,
  special = false,
  className,
}: Props) {
  if (special) return <SpecialSprite className={className} />;

  const tone = TONES[variant % TONES.length];
  const socket = "#000000";

  // small per-variant silhouette tweaks so the field never feels cloned
  const antenna =
    variant % 3 === 0 ? (
      // ball antenna
      <>
        <rect x="11" y="3" width="2" height="3" fill={tone} />
        <rect x="10" y="1" width="4" height="2" fill={tone} />
      </>
    ) : variant % 3 === 1 ? (
      // tall pin antenna
      <>
        <rect x="11.2" y="1" width="1.6" height="5" fill={tone} />
        <rect x="10" y="0" width="4" height="1.4" fill={tone} />
      </>
    ) : (
      // twin stub antennae
      <>
        <rect x="8" y="2" width="1.6" height="3.5" fill={tone} />
        <rect x="14.4" y="2" width="1.6" height="3.5" fill={tone} />
      </>
    );

  return (
    <svg
      viewBox="0 0 24 24"
      className={`pixelated ${className ?? ""}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      {antenna}

      {/* head */}
      <rect x="5" y="5" width="14" height="9" fill={tone} />

      {/* eye sockets */}
      <rect x="8" y="8" width="3" height="3" fill={socket} />
      <rect x="13" y="8" width="3" height="3" fill={socket} />

      {/* pupils — translated by the physics loop */}
      <rect
        data-pupil="l"
        x="8.6"
        y="8.6"
        width="1.8"
        height="1.8"
        fill={tone}
      />
      <rect
        data-pupil="r"
        x="13.6"
        y="8.6"
        width="1.8"
        height="1.8"
        fill={tone}
      />

      {/* mouth — stepped pixel grille */}
      <rect x="8" y="12" width="2" height="1" fill={socket} />
      <rect x="11" y="12" width="2" height="1" fill={socket} />
      <rect x="14" y="12" width="2" height="1" fill={socket} />

      {/* body */}
      <rect x="7" y="15" width="10" height="5" fill={tone} />
      {/* arms */}
      <rect x="4" y="15" width="2" height="4" fill={tone} />
      <rect x="18" y="15" width="2" height="4" fill={tone} />
      {/* legs */}
      <rect x="8" y="20" width="2" height="2.5" fill={tone} />
      <rect x="14" y="20" width="2" height="2.5" fill={tone} />
    </svg>
  );
}

/** The odd one out — a filled cyclops unit that behaves differently. */
function SpecialSprite({ className }: { className?: string }) {
  const tone = "#ffffff";
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pixelated ${className ?? ""}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      {/* single tall antenna */}
      <rect x="11.2" y="0" width="1.6" height="5" fill={tone} />
      <rect x="9.5" y="0" width="5" height="1.4" fill={tone} />

      {/* solid inverted head block */}
      <rect x="4" y="5" width="16" height="10" fill={tone} />

      {/* one big central eye (knocked out of the block) */}
      <rect x="9" y="8" width="6" height="4" fill="#000000" />
      <rect
        data-pupil="c"
        x="10.4"
        y="8.6"
        width="3"
        height="2.6"
        fill={tone}
      />

      {/* body + tracks */}
      <rect x="6" y="16" width="12" height="4" fill={tone} />
      <rect x="6" y="20" width="2" height="2.5" fill={tone} />
      <rect x="11" y="20" width="2" height="2.5" fill={tone} />
      <rect x="16" y="20" width="2" height="2.5" fill={tone} />
    </svg>
  );
}
