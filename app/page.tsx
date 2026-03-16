import { Comparison } from "@/components/landing/comparison";
import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Marquee } from "@/components/landing/marquee";
import { Navbar } from "@/components/landing/navbar";
import { QuickStart } from "@/components/landing/quick-start";
import { SectionReveal } from "@/components/landing/section-reveal";
import { SocialProof } from "@/components/landing/social-proof";
import { Stats } from "@/components/landing/stats";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-kova-charcoal">
      <Navbar />
      <Hero />
      <SectionReveal>
        <Marquee />
      </SectionReveal>
      <SectionReveal delay={0.1}>
        <HowItWorks />
      </SectionReveal>
      <SectionReveal delay={0.1}>
        <Features />
      </SectionReveal>
      <SectionReveal>
        <Comparison />
      </SectionReveal>
      <SectionReveal>
        <SocialProof />
      </SectionReveal>
      <SectionReveal>
        <Stats />
      </SectionReveal>
      <SectionReveal>
        <QuickStart />
      </SectionReveal>
      <SectionReveal>
        <CTA />
      </SectionReveal>
      <Footer />
    </main>
  );
}
