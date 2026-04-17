"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const impact = [
  { value: 40, suffix: "%", label: "Downtime reduction" },
  { value: 60, suffix: "%", label: "Maintenance cost saved" },
  { value: 3, suffix: "x", label: "Faster fault detection" },
  { value: 99, suffix: "%", label: "Uptime target" },
];

function BigNumber({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (inView) {
      const c = animate(count, to, { duration: 1.8, ease: "easeOut" });
      return c.stop;
    }
  }, [inView, to, count]);

  return (
    <div ref={ref} className="flex items-baseline">
      <motion.span className="text-7xl md:text-[10rem] font-black tracking-tighter text-white">
        {rounded}
      </motion.span>
      <span className="text-5xl md:text-7xl font-black text-cyan-glow">
        {suffix}
      </span>
    </div>
  );
}

export default function Impact() {
  return (
    <section
      id="impact"
      className="relative py-32 md:py-48 px-6 overflow-hidden border-t border-white/5"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="font-mono text-xs text-cyan-glow tracking-[0.3em] mb-6">
            06 — THE IMPACT
          </div>
          <h2 className="text-display-lg font-black tracking-tight leading-[1]">
            <span className="text-white">Numbers</span>
            <br />
            <span className="text-fog-400">that make it worth building.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
          {impact.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="border-t border-white/10 pt-8"
            >
              <div className="font-mono text-xs text-fog-400 tracking-widest mb-6">
                0{i + 1} / 04
              </div>
              <BigNumber to={item.value} suffix={item.suffix} />
              <div className="mt-4 text-xl text-fog-200">{item.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-32 max-w-4xl"
        >
          <p className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Predictive maintenance{" "}
            <span className="text-cyan-glow">shouldn't be a luxury</span> for
            only the biggest factories.
          </p>
          <p className="mt-6 text-lg text-fog-300 max-w-2xl">
            SmartGuard exists to put this tech in the hands of every plant
            manager — from a single CNC shop to an entire production line.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
