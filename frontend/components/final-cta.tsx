"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 px-4 relative overflow-hidden border-t border-border bg-background">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, #3b82f6 50%, transparent 100%)",
        }}
      />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center relative z-10 border border-border bg-card/60 backdrop-blur-xl rounded-3xl p-12 md:p-16 shadow-2xl"
      >
        {/* Dynamic platform tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-6 tracking-wide uppercase font-mono">
          <Bot className="w-3.5 h-3.5" />
          Zero-latency multi-agent orchestration
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
          Ready to automate at agentic scale?
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
          Join developers and enterprises building self-correcting agent systems, semantic MMR retrieval chains, and multi-model routing pipelines.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 h-12 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Link href="/pricing">
              View Pricing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-xl px-8 h-12 text-sm font-semibold border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-transparent flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>

        <p className="mt-8 text-xs font-mono text-muted-foreground">
          Free tier includes 10k execution cycles/month. Enterprise SLAs available.
        </p>
      </motion.div>
    </section>
  );
}
