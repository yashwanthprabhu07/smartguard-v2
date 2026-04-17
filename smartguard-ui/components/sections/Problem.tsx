"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  {
    value: 50,
    prefix: "$",
    suffix: "B+",
    label: "Lost annually",
    sub: "to unplanned industrial downtime worldwide.",
  },
  {
    value: 42,
    suffix: "%",
    label: "Of downtime",
    sub: "is caused by equipment failure that went undetected.",
  },
  {
    value: 8,
    suffix: "hrs",
    label: "Avg. detection lag",
    sub: "from when a fault starts to when anyone notices.",
  },
];

function Counter({ to, duration = 2 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, { duration, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, to, duration, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export default function Problem() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      id="problem"
      ref={ref}
      className="relative py-32 md:py-48 px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mb-24"
        >
          <div className="font-mono text-xs text-cyan-glow tracking-[0.3em] mb-6">
            01 — THE PROBLEM
          </div>
          <h2 className="text-display-lg font-black tracking-tight leading-[1]">
            <span className="text-white">When machines break,</span>
            <br />
            <span className="text-fog-400">factories bleed money.</span>
          </h2>
          <p className="mt-8 text-lg text-fog-300 max-w-xl leading-relaxed">
            Every minute of unplanned downtime costs thousands. Yet most
            factories still wait for failure instead of predicting it.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
              className="glass p-8 md:p-10 group hover:border-cyan-glow/30 transition-colors"
            >
              <div className="font-mono text-xs text-fog-400 mb-4">
                0{i + 1}
              </div>
              <div className="text-6xl md:text-7xl font-black tracking-tight text-white flex items-baseline">
                <span className="text-cyan-glow">{stat.prefix}</span>
                <Counter to={stat.value} />
                <span className="text-cyan-glow">{stat.suffix}</span>
              </div>
              <div className="mt-6 font-mono text-sm uppercase tracking-wider text-white">
                {stat.label}
              </div>
              <div className="mt-2 text-sm text-fog-300 leading-relaxed">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Before vs After strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-24 grid md:grid-cols-2 gap-0 border border-white/10"
        >
          <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10">
            <div className="font-mono text-xs text-red-critical tracking-widest mb-6">
              ✗ TODAY
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
              React after breakdown
            </h3>
            <ul className="space-y-3 text-fog-300">
              {[
                "Machine fails without warning",
                "Emergency repair team scrambled",
                "8+ hours of lost production",
                "No historical data to learn from",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm">
                  <span className="text-red-critical mt-1">—</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 md:p-12 bg-cyan-glow/[0.02] relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-glow" />
            <div className="font-mono text-xs text-cyan-glow tracking-widest mb-6">
              ✓ WITH SMARTGUARD
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Predict. Prevent. Profit.
            </h3>
            <ul className="space-y-3 text-fog-200">
              {[
                "AI detects anomaly before failure",
                "Instant alert with recommended fix",
                "Planned maintenance, zero downtime",
                "Every reading becomes training data",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm">
                  <span className="text-cyan-glow mt-1">→</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
