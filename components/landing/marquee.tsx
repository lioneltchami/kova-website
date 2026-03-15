"use client";

import { Lightboard } from "@/components/ui/lightboard";

export function Marquee() {
  return (
    <section className="py-6 bg-kova-surface border-y border-kova-border overflow-hidden">
      <Lightboard
        text="PLAN -- ORCHESTRATE -- EXECUTE -- VALIDATE -- SHIP -- PLAN -- ORCHESTRATE -- EXECUTE -- VALIDATE -- SHIP"
        color="#C0C0C8"
        backgroundColor="#16162A"
        dotSize={7}
        gap={3}
        speed={35}
        className="opacity-80"
      />
    </section>
  );
}
