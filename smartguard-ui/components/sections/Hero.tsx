"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax: hero content drifts up as you scroll away from it
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg"
    >
      {/* Radial glow behind hero */}
      <div className="absolute inset-0 bg-radial-glow opacity-60" />

      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-glow/40 to-transparent animate-scan" />
      </div>

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 text-center"
      >
        {/* Top tag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-pulse" />
          <span className="font-mono text-[11px] text-fog-200 tracking-wider uppercase">
            Predictive maintenance · AI agent
          </span>
        </motion.div>

        {/* Main display type */}
        <h1 className="font-sans font-black text-display-xl tracking-tight leading-[0.9]">
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="block text-white"
          >
            Predict failure.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="block gradient-text"
          >
            Before it happens.
          </motion.span>
        </h1>

        {/* Subcopy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-10 max-w-2xl mx-auto text-lg md:text-xl text-fog-300 leading-relaxed"
        >
          SmartGuard is an AI-powered agent that monitors industrial machines
          in real time, detects anomalies before they become breakdowns, and
          alerts engineers with the exact fix.
        </motion.p>

        {/* CTA pair */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-12 flex items-center justify-center gap-4"
        >
          <a
            href="#dashboard"
            className="group relative px-8 py-4 bg-cyan-glow text-ink-0 font-mono text-sm tracking-wide overflow-hidden transition-transform hover:scale-[1.02]"
          >
            <span className="relative z-10">SEE LIVE DEMO →</span>
          </a>
          <a
            href="#problem"
            className="px-8 py-4 border border-white/10 font-mono text-sm tracking-wide hover:border-white/30 hover:bg-white/[0.02] transition-all"
          >
            THE STORY
          </a>
        </motion.div>

        {/* Stats bar — small, authority-building */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-20 flex items-center justify-center gap-8 md:gap-16 font-mono text-xs text-fog-400"
        >
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-cyan-glow rounded-full" />
            <span>SOLO BUILT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-cyan-glow rounded-full" />
            <span>HACK WITH MALENADU</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-cyan-glow rounded-full" />
            <span>OPEN SOURCE</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] text-fog-400 tracking-widest">
          SCROLL
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-cyan-glow to-transparent" />
      </motion.div>
    </section>
  );
}
