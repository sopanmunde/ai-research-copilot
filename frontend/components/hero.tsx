"use client";

import { useState } from "react";
import { motion, cubicBezier } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TriVisionXLogo } from "@/components/TriVisionXLogo";
import { TextAnimate } from "@/components/ui/text-animate";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
// const avatars = [
//   "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
//   "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
//   "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
//   "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
//   "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
// ];
=======
import { TextAnimate } from "@/components/ui/text-animate"

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
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-zinc-100 dark:to-zinc-900 pointer-events-none transition-colors duration-300" />

      {/* fuchsia radial spotlight glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[900px] h-[700px] rounded-full blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Logo mark â€” centered with glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex justify-center mb-8"
        >
          <TriVisionXLogo size="xl" glow animate={false} />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 mb-8 backdrop-blur-sm transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">LangGraph 5-Agent Pipeline Active</span>
        </motion.div>

        {/* Headline with text mask animation */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-950 dark:text-white mb-6 transition-colors">
          <span className="block overflow-hidden">
            <motion.span
              className="block"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <TextAnimate animation="blurInUp" by="character" duration={5}>
                Autonomous Agentic AI Platform
              </TextAnimate>
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              className="block text-zinc-500 dark:text-zinc-400"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Orchestrated by LangGraph.
            </motion.span>
          </span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Empower your enterprise with dynamic multi-agent research automation. Instantly retrieve vector contexts via Pinecone, verify sources with citation auditing, and synthesize structured intelligence using any major LLM.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            className="relative overflow-hidden shimmer-btn bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-zinc-900/5 dark:shadow-white/10 transition-all hover:shadow-zinc-900/10 dark:hover:shadow-white/20"
          >
            <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-zinc-200/40 to-transparent" />
            <span><a className="relative" href="/dashboard">Get Started</a></span>
            <ArrowRight className="relative ml-2 w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsVideoOpen(true)}
            className="rounded-full px-8 h-12 text-base font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent transition-all duration-200"
          >
            View Demo
          </Button>
        </motion.div>

        {/* Video Dialog (triggered by View Demo button) */}
        <HeroVideoDialog
          animationStyle="from-bottom"
          hideTrigger={true}
          isOpen={isVideoOpen}
          onOpenChange={setIsVideoOpen}
        />

        {/* Social Proof */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex items-center -space-x-3">
            {avatars.map((avatar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                className="relative"
              >
                <img
                  src={avatar || "/placeholder.svg"}
                  alt=""
                  className="w-10 h-10 rounded-full border-2 border-zinc-950 object-cover"
                />
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-zinc-500">
            Trusted by <span className="text-zinc-300 font-medium">2,000+</span>{" "}
            teams worldwide
          </p>
        </motion.div> */}
      </div>
    </section>
  );
}
