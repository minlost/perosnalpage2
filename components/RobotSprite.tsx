/**
 * Pixel-art robot sprites rendered as crisp monochrome SVG.
 *
 * Each bot ships THREE directional views — front, back, side (profile) —
 * stacked on top of each other. The physics loop sets `data-dir` on the bot
 * element and CSS reveals the matching view (the side view is mirrored with
 * scaleX for left vs right). This gives real directional walking instead of a
 * single sprite sliding around.
 *
 * Pupils carry a `data-pupil` attribute so the physics loop can find them by
 * query and translate them to "look" toward the cursor.
 *
 * Strict palette: only shades of gray on a pure black page.
 */

const TONES = ["#ededed", "#bdbdbd", "#8f8f8f"] as const;
const SOCKET = "#000000";

type Props = {
  variant?: number;
  special?: boolean;
  className?: string;
};

export default function RobotSprite({ variant = 0, special = false }: Props) {
  if (special) {
    return (
      <div className="bot-dir-always">
        <SpecialSprite />
      </div>
    );
  }

  const tone = TONES[variant % TONES.length];

  return (
    <>
      <div className="bot-front">
        <FrontSprite tone={tone} variant={variant} />
      </div>
      <div className="bot-back">
        <BackSprite tone={tone} />
      </div>
      <div className="bot-side">
        <SideSprite tone={tone} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  shared svg shell                                                  */
/* ------------------------------------------------------------------ */
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pixelated"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  FRONT — facing the viewer (used walking down / standing)          */
/* ------------------------------------------------------------------ */
function FrontSprite({ tone, variant }: { tone: string; variant: number }) {
  const antenna =
    variant % 3 === 0 ? (
      <>
        <rect x="11" y="3" width="2" height="3" fill={tone} />
        <rect x="10" y="1" width="4" height="2" fill={tone} />
      </>
    ) : variant % 3 === 1 ? (
      <>
        <rect x="11.2" y="1" width="1.6" height="5" fill={tone} />
        <rect x="10" y="0" width="4" height="1.4" fill={tone} />
      </>
    ) : (
      <>
        <rect x="8" y="2" width="1.6" height="3.5" fill={tone} />
        <rect x="14.4" y="2" width="1.6" height="3.5" fill={tone} />
      </>
    );

  return (
    <Svg>
      {antenna}
      {/* head */}
      <rect x="5" y="5" width="14" height="9" fill={tone} />
      {/* eye sockets */}
      <rect x="8" y="8" width="3" height="3" fill={SOCKET} />
      <rect x="13" y="8" width="3" height="3" fill={SOCKET} />
      {/* pupils */}
      <rect data-pupil x="8.6" y="8.6" width="1.8" height="1.8" fill={tone} />
      <rect data-pupil x="13.6" y="8.6" width="1.8" height="1.8" fill={tone} />
      {/* closed eyelids — shown only while asleep (CSS) */}
      <g className="bot-eyelids">
        <rect x="8" y="8" width="3" height="3" fill={tone} />
        <rect x="8" y="9.4" width="3" height="0.9" fill={SOCKET} />
        <rect x="13" y="8" width="3" height="3" fill={tone} />
        <rect x="13" y="9.4" width="3" height="0.9" fill={SOCKET} />
      </g>
      {/* mouth grille */}
      <rect x="8" y="12" width="2" height="1" fill={SOCKET} />
      <rect x="11" y="12" width="2" height="1" fill={SOCKET} />
      <rect x="14" y="12" width="2" height="1" fill={SOCKET} />
      {/* body + arms */}
      <rect x="7" y="15" width="10" height="5" fill={tone} />
      <rect x="4" y="15" width="2" height="4" fill={tone} />
      <rect x="18" y="15" width="2" height="4" fill={tone} />
      {/* legs (footstep animation) */}
      <rect className="bot-leg-l" x="8" y="20" width="2" height="2.5" fill={tone} />
      <rect className="bot-leg-r" x="14" y="20" width="2" height="2.5" fill={tone} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  BACK — facing away (used walking up)                              */
/* ------------------------------------------------------------------ */
function BackSprite({ tone }: { tone: string }) {
  return (
    <Svg>
      {/* antenna */}
      <rect x="11" y="3" width="2" height="3" fill={tone} />
      <rect x="10" y="1" width="4" height="2" fill={tone} />
      {/* back of head */}
      <rect x="5" y="5" width="14" height="9" fill={tone} />
      {/* seam + bolts */}
      <rect x="5" y="9" width="14" height="1" fill={SOCKET} />
      <rect x="7" y="7" width="1" height="1" fill={SOCKET} />
      <rect x="16" y="7" width="1" height="1" fill={SOCKET} />
      {/* body + backpack panel */}
      <rect x="7" y="15" width="10" height="5" fill={tone} />
      <rect x="9" y="16" width="6" height="3" fill={SOCKET} />
      {/* arms */}
      <rect x="4" y="15" width="2" height="4" fill={tone} />
      <rect x="18" y="15" width="2" height="4" fill={tone} />
      {/* legs */}
      <rect className="bot-leg-l" x="8" y="20" width="2" height="2.5" fill={tone} />
      <rect className="bot-leg-r" x="14" y="20" width="2" height="2.5" fill={tone} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  SIDE — profile facing right (mirrored for left via CSS)           */
/* ------------------------------------------------------------------ */
function SideSprite({ tone }: { tone: string }) {
  return (
    <Svg>
      {/* antenna, swept back */}
      <rect x="8" y="3" width="2" height="3" fill={tone} />
      <rect x="7" y="1" width="4" height="2" fill={tone} />
      {/* head */}
      <rect x="6" y="5" width="11" height="9" fill={tone} />
      {/* single eye toward the front */}
      <rect x="13" y="8" width="3" height="3" fill={SOCKET} />
      <rect data-pupil x="13.6" y="8.6" width="1.8" height="1.8" fill={tone} />
      {/* snout / mouth at the front */}
      <rect x="16" y="11" width="2" height="2" fill={tone} />
      <rect x="13" y="12" width="3" height="1" fill={SOCKET} />
      {/* body, set slightly back */}
      <rect x="7" y="15" width="9" height="5" fill={tone} />
      {/* swinging arm */}
      <rect className="bot-arm-s" x="11" y="15" width="2" height="4" fill={tone} />
      {/* striding legs (front / back swing) */}
      <rect className="bot-leg-b" x="8" y="20" width="2" height="2.5" fill={tone} />
      <rect className="bot-leg-f" x="12" y="20" width="2" height="2.5" fill={tone} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  SPECIAL — the odd one out (single view, all directions)           */
/* ------------------------------------------------------------------ */
function SpecialSprite() {
  const tone = "#ffffff";
  return (
    <Svg>
      <rect x="11.2" y="0" width="1.6" height="5" fill={tone} />
      <rect x="9.5" y="0" width="5" height="1.4" fill={tone} />
      <rect x="4" y="5" width="16" height="10" fill={tone} />
      <rect x="9" y="8" width="6" height="4" fill={SOCKET} />
      <rect data-pupil x="10.4" y="8.6" width="3" height="2.6" fill={tone} />
      <rect x="6" y="16" width="12" height="4" fill={tone} />
      <rect className="bot-leg-l" x="6" y="20" width="2" height="2.5" fill={tone} />
      <rect x="11" y="20" width="2" height="2.5" fill={tone} />
      <rect className="bot-leg-r" x="16" y="20" width="2" height="2.5" fill={tone} />
    </Svg>
  );
}
