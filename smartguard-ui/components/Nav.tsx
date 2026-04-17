"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-5"
    >
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-50/70 backdrop-blur-xl border-b border-white/5"
          />
        )}
      </AnimatePresence>

      <div className="relative max-w-7xl mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-cyan-glow/10 border border-cyan-glow/30 grid place-items-center relative">
            <div className="w-2 h-2 rounded-full bg-cyan-glow live-dot" />
          </div>
          <span className="font-mono text-sm tracking-tight">
            <span className="text-white">Smart</span>
            <span className="text-cyan-glow">Guard</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 font-mono text-xs text-fog-300">
          <a href="#problem" className="hover:text-white transition-colors">
            Problem
          </a>
          <a href="#solution" className="hover:text-white transition-colors">
            How it works
          </a>
          <a href="#dashboard" className="hover:text-white transition-colors">
            Live Demo
          </a>
          <a href="#impact" className="hover:text-white transition-colors">
            Impact
          </a>
        </div>

        <a
          href="https://github.com/yashwanthprabhu07/smartguard-v2"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs px-4 py-2 border border-white/10 rounded-full hover:border-cyan-glow hover:text-cyan-glow transition-all"
        >
          View Code ↗
        </a>
      </div>
    </motion.nav>
  );
}
