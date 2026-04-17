"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Activity, Brain, Bell, LineChart } from "lucide-react";

const steps = [
  {
    icon: Activity,
    num: "01",
    title: "Monitor",
    body: "SmartGuard continuously streams sensor data — temperature, vibration, RPM, current — from every machine on the factory floor.",
    metric: "10Hz sampling",
  },
  {
    icon: Brain,
    num: "02",
    title: "Detect",
    body: "A per-machine Isolation Forest learns what 'healthy' looks like. An LLM agent reasons over rolling windows to spot subtle trend shifts.",
    metric: "ML + LLM dual engine",
  },
  {
    icon: Bell,
    num: "03",
    title: "Alert",
    body: "The moment risk crosses threshold, engineers get a structured alert — fault type, severity, estimated time to failure, recommended fix.",
    metric: "< 2s alert latency",
  },
  {
    icon: LineChart,
    num: "04",
    title: "Learn",
    body: "Every reading feeds the history. The dashboard surfaces trends, recurring issues, and optimizes maintenance schedules over time.",
    metric: "Continuous learning",
  },
];

/**
 * Solution — horizontal scrolling panels.
 *
 * PERF/UX FIX: Was `400vh` tall, which meant 13" laptops scrolled through 4
 * screens of mostly-nothing between panels. Cut to `200vh` and reduced horizontal
 * travel slightly so every scroll tick visibly moves the panels. Feels immediate
 * instead of "scrolling into the void."
 *
 * Also: `willChange: "transform"` hint so the browser GPU-accelerates the pan.
 */
export default function Solution() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // 3 panels * ~80vw each, so we translate 3 panel-widths worth
  // Using calc so it stays correct across viewports
  const x = useTransform(scrollYProgress, [0, 1], ["5vw", "-230vw"]);

  return (
    <section
      id="solution"
      ref={ref}
      className="relative sticky-parent"
      // 200vh total height -> 1 screen of pin + 1 screen of pan. Compact.
      // position:relative is REQUIRED for Framer Motion useScroll to compute correctly.
      style={{ height: "200vh", position: "relative" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-6 w-full mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="font-mono text-xs text-cyan-glow tracking-[0.3em] mb-4">
              02 — THE SOLUTION
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl">
              <span className="text-white">Four steps.</span>{" "}
              <span className="text-fog-400">One continuous loop.</span>
            </h2>
          </motion.div>
        </div>

        <motion.div
          style={{ x, willChange: "transform" }}
          className="flex gap-6"
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="w-[80vw] md:w-[65vw] lg:w-[55vw] flex-shrink-0"
              >
                <div className="glass p-8 md:p-12 h-[50vh] min-h-[420px] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-cyan-glow/10 blur-3xl pointer-events-none" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="font-mono text-sm text-cyan-glow">
                        {step.num}
                      </div>
                      <Icon className="w-7 h-7 text-cyan-glow" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
                      {step.title}
                    </h3>
                    <p className="text-base md:text-lg text-fog-200 max-w-xl leading-relaxed">
                      {step.body}
                    </p>
                  </div>

                  <div className="relative flex items-center gap-3 pt-6 border-t border-white/5">
                    <span className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse" />
                    <span className="font-mono text-xs uppercase tracking-widest text-fog-200">
                      {step.metric}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 w-full mt-8">
          <div className="h-px bg-white/5 relative overflow-hidden">
            <motion.div
              style={{ scaleX: scrollYProgress, willChange: "transform" }}
              className="absolute inset-0 bg-cyan-glow origin-left"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
