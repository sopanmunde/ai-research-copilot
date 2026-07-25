"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { TriVisionXLogo } from "./TriVisionXLogo";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Guides", href: "/guides" },
    { label: "Blog", href: "/blog" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" },
    { label: "Cookies", href: "/cookies" },
    { label: "Licenses", href: "/licenses" },
  ],
};

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer ref={ref} className="border-t border-border bg-background relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute left-1/4 bottom-0 w-[400px] h-[300px] rounded-full blur-[120px] opacity-[0.02]"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, #3b82f6 50%, transparent 100%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-8"
        >
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <TriVisionXLogo size="sm" shimmer={true} glow={true} showWordmark={true} animate={false} />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise-grade multi-agent orchestration and context retrieval engines.
            </p>
            {/* System Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-[9px] font-mono tracking-wider text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h4 className="text-xs font-mono font-bold tracking-wider text-foreground uppercase">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} TriVisionX, Inc. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/sopanmunde/trivisionx-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              GitHub
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
