"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { TriVisionXLogo } from "@/components/TriVisionXLogo";
import Link from "next/link";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const navItems = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);



  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl"
    >
      <nav
        ref={navRef}
        className="relative flex items-center justify-between px-6 py-3 rounded-xl bg-card/70 backdrop-blur-md border border-border text-foreground shadow-sm"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <TriVisionXLogo
            size="sm"
            showWordmark
            wordmark="TriVisionX"
            animate={false}
          />
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-1 relative">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === index && (
                <motion.div
                  layoutId="navbar-hover"
                  className="absolute inset-0 bg-accent rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <RainbowButton asChild variant="black" size="sm">
            <a href="https://github.com/sopanmunde/trivisionx-ai" target="_blank" rel="noopener noreferrer">
              <GithubIcon className="size-4" />
              <span>GitHub</span>
            </a>
          </RainbowButton>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="relative overflow-hidden shimmer-btn bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 h-9 font-semibold transition-all shadow-xs"
          >
            <Link href="/signup">
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />
              <span className="relative">Sign Up</span>
            </Link>
          </Button>
        </div>


        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-card/95 backdrop-blur-md border border-border text-foreground shadow-lg"
        >
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-zinc-200 dark:border-zinc-800 my-2" />
            <Button
              asChild
              variant="ghost"
              className="justify-start text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="shimmer-btn bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
            <RainbowButton asChild variant="black" className="w-full justify-center">
              <a href="https://github.com/sopanmunde/trivisionx-ai" target="_blank" rel="noopener noreferrer">
                <GithubIcon className="size-4" />
                <span>GitHub</span>
              </a>
            </RainbowButton>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
