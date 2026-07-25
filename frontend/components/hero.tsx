"use client";

import { useState } from "react";
import { motion, cubicBezier } from "framer-motion";
import { ArrowRight, Play, Sparkles, ShieldCheck, Cpu, Database, ChevronRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TriVisionXLogo } from "@/components/TriVisionXLogo";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Meteors } from "@/components/ui/meteors";
import { SparklesText } from "@/components/ui/sparkles-text";

const textRevealVariants = {
  hidden: { y: "100%" },
  visible: (i: number) => ({
    y: 0,
    transition: {
      duration: 0.8,
      ease: cubicBezier(0.22, 1, 0.36, 1),
      delay: i * 0.1,
    },
  }),
};

export function Hero() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-28 pb-20 overflow-hidden bg-background text-foreground">
      {/* Background Radial Glow & Grid Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[140px] opacity-10 bg-primary" />

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Meteors Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Meteors number={15} />
        </div>
        {/* Animated Feature Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-md text-xs font-semibold text-foreground shadow-2xs hover:bg-accent transition-all cursor-pointer group">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              LangGraph 5-Agent Pipeline Active
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.div>

        {/* Logo Mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center"
        >
          <TriVisionXLogo size="xl" glow={false} animate={false} />
        </motion.div>

        {/* Magic Typography Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-4xl mx-auto">
          <span className="block overflow-hidden">
            <motion.span
              className="block"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <SparklesText
                sparklesCount={15}
                colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
                className="text-4xl sm:text-6xl lg:text-7xl font-extrabold"
              >
                Autonomous AI Agents
              </SparklesText>
            </motion.span>
          </span>
          <span className="block overflow-hidden mt-1">
            <motion.span
              className="block text-muted-foreground font-semibold"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Orchestrated by LangGraph.
            </motion.span>
          </span>
        </h1>

        {/* Single-Line Subheadline */}
        {/* <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium font-sans"
        >
          Autonomous AI Agents
        </motion.p> */}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
        >
          <a href="/dashboard">
            <Button
              size="lg"
              className="h-12 px-8 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all hover:scale-[1.02] cursor-pointer gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="size-4" />
            </Button>
          </a>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsVideoOpen(true)}
            className="h-12 px-7 rounded-md text-sm font-semibold border-border bg-card hover:bg-accent text-foreground shadow-2xs transition-all duration-200 cursor-pointer gap-2"
          >
            <Play className="size-4 text-foreground fill-foreground/20" />
            <span>Watch Demo</span>
          </Button>
        </motion.div>

        {/* Interactive Feature Pill Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-border bg-card/60">
            <Cpu className="size-3.5" /> 5-Agent Swarm
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-border bg-card/60">
            <Database className="size-3.5" /> Pinecone Vector RAG
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-border bg-card/60">
            <ShieldCheck className="size-3.5" /> Citation Audited
          </span>
        </motion.div>

        {/* Video Dialog */}
        <HeroVideoDialog
          animationStyle="from-bottom"
          hideTrigger={true}
          isOpen={isVideoOpen}
          onOpenChange={setIsVideoOpen}
          videoSrc="https://youtu.be/yVSE9QFFcTU"
        />
      </div>
    </section>
  );
}
