"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { useRef, useState } from "react";

/**
 * DataFlow — the cinematic peak of the scroll.
 *
 * FIXES applied:
 * - `position: relative` on the section ref (Framer Motion useScroll requires it)
 * - SVG <path> has initial `d` attribute set (was causing "d: undefined" errors)
 * - Height reduced from 500vh -> 300vh (was too much dead scroll on laptops)
 * - sticky-parent class prevents Lenis transform from breaking sticky positioning
 * - will-change hints on transform-animated elements for GPU acceleration
 */

const IDLE_WAVE = "M 0 15 Q 25 8 50 15 T 100 15 T 150 15 T 200 15";
const PEAK_WAVE = "M 0 15 Q 25 22 50 15 T 100 15 T 150 15 T 200 15";

export default function DataFlow() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [stage, setStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const s = v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.6 ? 2 : v < 0.8 ? 3 : 4;
    setStage((prev) => (prev === s ? prev : s));
  });

  const coreScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.55, 0.75, 1],
    [0.85, 1, 1.1, 1.35, 1.2]
  );
  const coreBg = useTransform(
    scrollYProgress,
    [0, 0.5, 0.7, 1],
    ["#00E5FF", "#00E5FF", "#FFB800", "#FF3366"]
  );

  const alertOpacity = useTransform(scrollYProgress, [0.75, 0.88], [0, 1]);
  const alertY = useTransform(scrollYProgress, [0.75, 0.88], [20, 0]);

  const packet1X = useTransform(scrollYProgress, [0.1, 0.5], ["-50%", "50%"]);
  const packet2X = useTransform(scrollYProgress, [0.15, 0.55], ["-50%", "50%"]);
  const packet3X = useTransform(scrollYProgress, [0.2, 0.6], ["-50%", "50%"]);

  const stageLabels = [
    "IDLE · AWAITING DATA",
    "STREAMING · SENSOR INPUT",
    "PROCESSING · AI ANALYSIS",
    "ANOMALY DETECTED",
    "ALERT DISPATCHED",
  ];

  return (
    <section
      ref={ref}
      className="relative bg-ink-0 sticky-parent"
      style={{ height: "300vh", position: "relative" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden grid-bg">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,229,255,0.15), transparent 70%)",
          }}
        />

        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <div className="font-mono text-xs text-cyan-glow tracking-[0.3em] mb-3">
            03 — INSIDE THE ENGINE
          </div>
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-5 py-2 glass-bright"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                stage >= 3 ? "bg-red-critical" : "bg-cyan-glow"
              } live-dot`}
            />
            <span className="font-mono text-xs tracking-[0.25em] text-white">
              {stageLabels[stage]}
            </span>
          </motion.div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="w-full max-w-6xl grid grid-cols-3 gap-6 items-center">
            {/* LEFT — Sensors */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] text-fog-400 tracking-widest mb-4">
                SENSORS
              </div>
              <SensorCard label="TEMPERATURE" critical={stage >= 3} delay={0} />
              <SensorCard label="VIBRATION" critical={stage >= 3} delay={0.4} />
              <SensorCard label="CURRENT" critical={stage >= 3} delay={0.8} />
            </div>

            {/* CENTER — AI Core */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="absolute left-[-100%] right-[-100%] top-1/2 -translate-y-1/2 h-24 pointer-events-none">
                <Packet x={packet1X} yOffset={0} />
                <Packet x={packet2X} yOffset={-18} />
                <Packet x={packet3X} yOffset={18} />
              </div>

              <motion.div
                style={{
                  scale: coreScale,
                  backgroundColor: coreBg,
                  willChange: "transform, background-color",
                }}
                className="w-36 h-36 rounded-full relative z-10 flex items-center justify-center"
              >
                <div className="absolute inset-3 rounded-full bg-ink-0 flex items-center justify-center">
                  <motion.div
                    style={{ backgroundColor: coreBg }}
                    className="w-5 h-5 rounded-full"
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                </div>
                <div className="absolute inset-[-16px] rounded-full border border-cyan-glow/20" />
                <div className="absolute inset-[-32px] rounded-full border border-cyan-glow/10" />
              </motion.div>

              <div className="mt-6 font-mono text-[10px] tracking-widest text-fog-200 text-center">
                {stage >= 3 ? "ANOMALY · ISOLATION FOREST" : "AI CORE · ACTIVE"}
              </div>
            </div>

            {/* RIGHT — Alert */}
            <div>
              <motion.div
                style={{
                  opacity: alertOpacity,
                  y: alertY,
                  willChange: "transform, opacity",
                }}
              >
                <div className="border border-red-critical bg-red-critical/5 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-red-critical live-dot" />
                    <span className="font-mono text-[10px] tracking-[0.25em] text-red-critical">
                      CRITICAL ALERT
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white mb-1">CNC_02</div>
                  <div className="text-xs text-fog-300 mb-4">
                    Bearing overheating detected
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <Row label="Score" value="18 / 100" critical />
                    <Row label="Temp" value="94°C" critical />
                    <Row label="Vibration" value="HIGH" />
                    <Row label="ETA to failure" value="~ 2 hrs" critical />
                  </div>
                  <div className="mt-4 pt-3 border-t border-red-critical/20">
                    <div className="text-[10px] text-fog-400 mb-1">
                      RECOMMENDED ACTION
                    </div>
                    <div className="text-xs text-white">
                      Shut down & replace bearing
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                stage >= i ? "bg-cyan-glow w-8" : "bg-white/10 w-4"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SensorCard({
  label,
  critical,
  delay,
}: {
  label: string;
  critical: boolean;
  delay: number;
}) {
  const color = critical ? "#FF3366" : "#00E5FF";
  return (
    <div className="glass p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-fog-300 tracking-widest">
          {label}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <svg
        viewBox="0 0 200 30"
        className="w-full h-8"
        preserveAspectRatio="none"
      >
        {/* KEY FIX: `d` must be set initially; `animate` alone leaves it undefined
            on first render, which causes SVG parse errors. */}
        <motion.path
          d={IDLE_WAVE}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          animate={{
            d: [IDLE_WAVE, PEAK_WAVE, IDLE_WAVE],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}

function Packet({
  x,
  yOffset,
}: {
  x: any;
  yOffset: number;
}) {
  return (
    <motion.div
      style={{
        x,
        top: `calc(50% + ${yOffset}px)`,
        willChange: "transform",
      }}
      className="absolute left-1/2 w-2 h-2 rounded-full bg-cyan-glow"
    >
      <div
        className="w-full h-full rounded-full bg-cyan-glow"
        style={{ boxShadow: "0 0 10px #00E5FF" }}
      />
    </motion.div>
  );
}

function Row({
  label,
  value,
  critical,
}: {
  label: string;
  value: string;
  critical?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-fog-400">{label}</span>
      <span className={critical ? "text-red-critical" : "text-white"}>
        {value}
      </span>
    </div>
  );
}
