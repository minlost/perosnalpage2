import BotField from "@/components/BotField";
import Hero from "@/components/Hero";
import CRTOverlay from "@/components/CRTOverlay";

export default function Home() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-[var(--color-void)]">
      {/* interactive pixel-bot canvas (client) */}
      <BotField />

      {/* static hero content (server) */}
      <Hero />

      {/* CRT atmosphere */}
      <CRTOverlay />
    </main>
  );
}
