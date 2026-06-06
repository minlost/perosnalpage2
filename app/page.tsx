import BotField from "@/components/BotField";
import Hero from "@/components/Hero";
import CRTOverlay from "@/components/CRTOverlay";
import Terminal from "@/components/Terminal";
import PowerScreen from "@/components/PowerScreen";

export default function Home() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-[var(--color-void)]">
      {/* the whole picture lives inside the CRT "tube" so the power button can
          collapse it like an old television (the button itself sits outside). */}
      <PowerScreen>
        {/* everything the console can distort lives inside these two layers:
            #fx-stage = color/blur filters, #fx-warp = transforms. Both are
            pointer-events-none so the bots inside stay grabbable. */}
        <div id="fx-stage" className="pointer-events-none absolute inset-0">
          <div id="fx-warp" className="pointer-events-none absolute inset-0">
            {/* interactive pixel-bot canvas (client) */}
            <BotField />

            {/* static hero content (server) */}
            <Hero />

            {/* CRT atmosphere */}
            <CRTOverlay />
          </div>
        </div>

        {/* pseudo-console — lives outside the FX layers so it stays crisp */}
        <Terminal />
      </PowerScreen>
    </main>
  );
}
