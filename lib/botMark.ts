/**
 * The pixel-bot mark as a standalone SVG string (transparent background, so it
 * can sit on any color). Shared by the generated apple-icon and OG images so
 * the brand stays identical to app/icon.svg. `tone` sets the bot color.
 */
export function botMark(tone = "#ededed"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">
    <rect x="11" y="2" width="2" height="4" fill="${tone}"/>
    <rect x="9" y="1" width="6" height="2" fill="${tone}"/>
    <rect x="4" y="6" width="16" height="11" fill="${tone}"/>
    <rect x="8" y="9" width="8" height="5" fill="#000000"/>
    <rect x="10" y="10" width="4" height="3" fill="${tone}"/>
    <rect x="6" y="18" width="12" height="4" fill="${tone}"/>
    <rect x="11" y="18" width="2" height="4" fill="#000000"/>
  </svg>`;
}

/** SVG string as a UTF-8 data URI usable in an <img src>. Runtime-agnostic
 *  (no Buffer/btoa), so it works under both the Node and Edge runtimes. */
export function botMarkDataUri(tone?: string): string {
  return `data:image/svg+xml,${encodeURIComponent(botMark(tone))}`;
}
