import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { botMarkDataUri } from "@/lib/botMark";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const host = new URL(site.url).host;
const headlineLines = site.intro.toUpperCase().split(" ");

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#000000",
        color: "#ededed",
        fontFamily: "monospace",
        // CRT scanlines
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 4px)",
      }}
    >
      {/* top: boot line */}
      <div
        style={{
          display: "flex",
          fontSize: 26,
          color: "#8a8a8a",
          letterSpacing: 2,
        }}
      >
        {`~/ ${host}`}
      </div>

      {/* center: headline + bot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {headlineLines.map((line) => (
            <div
              key={line}
              style={{
                display: "flex",
                fontSize: 120,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: -2,
                color: "#ededed",
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={240} height={240} src={botMarkDataUri("#ededed")} alt="" />
      </div>

      {/* bottom: name + tagline */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 28,
          color: "#8a8a8a",
          letterSpacing: 1,
        }}
      >
        <div style={{ display: "flex", color: "#ededed" }}>{host}</div>
        <div style={{ display: "flex" }}>interactive systems · pixel</div>
      </div>
    </div>,
    { ...size },
  );
}
