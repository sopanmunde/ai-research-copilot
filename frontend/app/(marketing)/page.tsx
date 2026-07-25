import { Hero } from "@/components/hero"
import { LogoMarquee } from "@/components/logo-marquee"
import { FeatureShowcaseSections } from "@/components/feature-showcase-sections"
import { BentoGrid } from "@/components/bento-grid"
import { AutomationCanvas } from "@/components/automation-canvas"
import { FinalCTA } from "@/components/final-cta"

export default function Home() {
  return (
    <>
      <Hero />
      <LogoMarquee />
      <FeatureShowcaseSections />
      <BentoGrid />
      <AutomationCanvas />
      <FinalCTA />
    </>
  )
}
