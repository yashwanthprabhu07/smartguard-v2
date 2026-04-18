/** @format */

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Zap, AlertTriangle, Activity } from "lucide-react";

/**
 * Browser beep using Web Audio API.
 * Works on all devices. Called when Critical/Warning status is detected.
 */
function playBeep(
  frequency: number = 800,
  duration: number = 300,
  type: "warning" | "critical" = "warning",
) {
  try {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = type === "critical" ? 1500 : frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1000,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (e) {
    console.warn("Audio beep failed:", e);
  }
}

/**
 * Live Dashboard — connects to your Flask backend (stream_server.py).
 *
 * Uses EventSource (SSE) to stream sensor readings from /api/stream/:machine_id
 * (proxied in next.config.js to Flask). If the backend is not running, we fall
 * back to a built-in simulator so the demo never looks broken on a portfolio
 * visit.
 *
 * The "Inject Fault" buttons POST to /api/set_mode, hitting your Flask
 * /set_mode endpoint exactly as the hackathon demo does.
 */

type Reading = {
  machine_id: string;
  temperature_C: number;
  vibration_mm_s: number;
  rpm: number;
  current_A: number;
};

type MachineState = {
  id: string;
  name: string;
  readings: Reading[];
  score: number;
  status: "healthy" | "warning" | "critical";
};

const MACHINES = [
  { id: "CNC_01", name: "CNC Mill · Line A" },
  { id: "CNC_02", name: "CNC Mill · Line B" },
  { id: "PUMP_03", name: "Hydraulic Pump" },
  { id: "CONVEYOR_04", name: "Main Conveyor" },
];

export default function LiveDashboard() {
  const [machines, setMachines] = useState<Record<string, MachineState>>(() =>
    Object.fromEntries(
      MACHINES.map((m) => [
        m.id,
        {
          id: m.id,
          name: m.name,
          readings: [],
          score: 92,
          status: "healthy" as const,
        },
      ]),
    ),
  );
  const [backendLive, setBackendLive] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"normal" | "overheat" | "vibration">(
    "normal",
  );

  const sourcesRef = useRef<EventSource[]>([]);
  const fallbackRef = useRef<number | null>(null);
  const beepIntervalRef = useRef<number | null>(null);
  const hasCriticalRef = useRef<boolean>(false);

  // Try connecting to real backend; fall back to simulator if it fails
  useEffect(() => {
    let cancelled = false;

    async function tryBackend() {
      try {
        // Probe: try opening one SSE connection
        const probe = new EventSource("/api/stream/CNC_01");
        const gotData = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 2500);
          probe.onmessage = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          probe.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
        });
        probe.close();

        if (cancelled) return;

        if (gotData) {
          setBackendLive(true);
          connectAll();
        } else {
          setBackendLive(false);
          startSimulator();
        }
      } catch {
        if (!cancelled) {
          setBackendLive(false);
          startSimulator();
        }
      }
    }

    tryBackend();
    return () => {
      cancelled = true;
      sourcesRef.current.forEach((s) => s.close());
      if (fallbackRef.current) window.clearInterval(fallbackRef.current);
      if (beepIntervalRef.current)
        window.clearInterval(beepIntervalRef.current);
    };
  }, []);

  // Continuous beep every 2 seconds while critical
  useEffect(() => {
    const criticalMachines = Object.values(machines).filter(
      (m) => m.status === "critical",
    );
    const hasCritical = criticalMachines.length > 0;

    // Update the ref so interval can access it
    hasCriticalRef.current = hasCritical;

    if (hasCritical) {
      // Start repeating beep every 2 seconds
      if (!beepIntervalRef.current) {
        beepIntervalRef.current = window.setInterval(() => {
          // Use ref to get current critical status (avoids stale closure)
          if (hasCriticalRef.current) {
            playBeep(1500, 600, "critical");
          }
        }, 2000); // Beep every 2 seconds
      }
    } else {
      // Stop beeping when no critical machines
      if (beepIntervalRef.current) {
        window.clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    }

    return () => {
      if (beepIntervalRef.current) {
        window.clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [machines]);

  function connectAll() {
    MACHINES.forEach((m) => {
      const es = new EventSource(`/api/stream/${m.id}`);
      es.onmessage = (e) => {
        try {
          const reading = JSON.parse(e.data) as Reading;
          pushReading(reading);
        } catch {}
      };
      sourcesRef.current.push(es);
    });
  }

  function startSimulator() {
    fallbackRef.current = window.setInterval(() => {
      MACHINES.forEach((m) => {
        const reading: Reading = {
          machine_id: m.id,
          temperature_C: 55 + Math.random() * 10,
          vibration_mm_s: 1.5 + Math.random() * 1.5,
          rpm: 2900 + Math.random() * 100,
          current_A: 18 + Math.random() * 4,
        };
        pushReading(reading);
      });
    }, 1000);
  }

  function pushReading(r: Reading) {
    setMachines((prev) => {
      const m = prev[r.machine_id];
      if (!m) return prev;
      const nextReadings = [...m.readings, r].slice(-30);

      // Score derivation — real project uses Isolation Forest; here we map
      // temp + vibration onto a 0–100 scale for display.
      let score = 100;
      if (r.temperature_C > 80) score -= 50;
      else if (r.temperature_C > 70) score -= 25;
      else if (r.temperature_C > 60) score -= 10;

      if (r.vibration_mm_s > 7) score -= 40;
      else if (r.vibration_mm_s > 4) score -= 20;
      else if (r.vibration_mm_s > 2.5) score -= 8;

      score = Math.max(0, Math.min(100, score));

      const status: MachineState["status"] =
        score < 60 ? "critical"
        : score < 75 ? "warning"
        : "healthy";

      // Beep on status change (immediate feedback)
      const prevStatus = m.status;
      if (status === "critical" && prevStatus !== "critical") {
        playBeep(1500, 600, "critical");
      } else if (status === "warning" && prevStatus !== "warning") {
        playBeep(900, 300, "warning");
      }

      return {
        ...prev,
        [r.machine_id]: { ...m, readings: nextReadings, score, status },
      };
    });
  }

  async function injectMode(newMode: "normal" | "overheat" | "vibration") {
    setMode(newMode);

    // ALWAYS call the backend to set the mode (even in simulator)
    try {
      const response = await fetch(`/api/set_mode?mode=${newMode}`);
      if (response.ok) {
        console.log(`✅ Mode set on backend: ${newMode}`);
      }
    } catch (err) {
      console.warn("Backend not running, using simulator fallback:", err);
    }

    // Keep the simulator fallback for when backend is offline
    if (!backendLive) {
      window.clearInterval(fallbackRef.current!);
      fallbackRef.current = window.setInterval(() => {
        MACHINES.forEach((m) => {
          const base: Reading = {
            machine_id: m.id,
            temperature_C: 55 + Math.random() * 10,
            vibration_mm_s: 1.5 + Math.random() * 1.5,
            rpm: 2900 + Math.random() * 100,
            current_A: 18 + Math.random() * 4,
          };
          if (newMode === "overheat" && m.id === "CNC_02") {
            base.temperature_C = 85 + Math.random() * 10;
          }
          if (newMode === "vibration" && m.id === "PUMP_03") {
            base.vibration_mm_s = 7 + Math.random() * 3;
          }
          pushReading(base);
        });
      }, 1000);
    }
  }

  return (
    <section id="dashboard" className="relative py-32 md:py-48 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mb-12"
        >
          <div className="font-mono text-xs text-cyan-glow tracking-[0.3em] mb-6">
            04 — LIVE DEMO
          </div>
          <h2 className="text-display-md font-black tracking-tight leading-[1.05]">
            <span className="text-white">See it react</span>
            <br />
            <span className="text-fog-400">in real time.</span>
          </h2>
          <p className="mt-6 text-lg text-fog-300 max-w-xl leading-relaxed">
            This dashboard is live — streaming data right now.{" "}
            {backendLive === true ?
              <span className="text-cyan-glow">
                Connected to the Flask backend.
              </span>
            : backendLive === false ?
              <span className="text-amber-warn">
                Running in simulator mode (start the Flask server for real
                data).
              </span>
            : <span className="text-fog-400">Connecting…</span>}
          </p>
        </motion.div>

        {/* Control bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mb-8 p-4 glass"
        >
          <span className="font-mono text-xs text-fog-300 tracking-widest mr-2">
            INJECT FAULT →
          </span>
          <ModeButton
            label="Normal"
            active={mode === "normal"}
            onClick={() => injectMode("normal")}
            tone="healthy"
          />
          <ModeButton
            label="Overheat CNC_02"
            active={mode === "overheat"}
            onClick={() => injectMode("overheat")}
            tone="critical"
          />
          <ModeButton
            label="Vibration PUMP_03"
            active={mode === "vibration"}
            onClick={() => injectMode("vibration")}
            tone="warning"
          />
          <div className="ml-auto flex items-center gap-2 font-mono text-xs text-fog-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow live-dot" />
            LIVE ·{" "}
            {Object.values(machines).reduce(
              (acc, m) => acc + m.readings.length,
              0,
            )}{" "}
            READINGS
          </div>
        </motion.div>

        {/* Machine grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MACHINES.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <MachineCard machine={machines[m.id]} />
            </motion.div>
          ))}
        </div>

        {/* Setup note */}
        <div className="mt-8 font-mono text-xs text-fog-400 text-center">
          Backend offline? Run{" "}
          <code className="text-cyan-glow bg-white/5 px-2 py-0.5 rounded">
            python stream_server.py
          </code>{" "}
          and refresh — the dashboard will auto-connect.
        </div>
      </div>
    </section>
  );
}

function ModeButton({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone: "healthy" | "warning" | "critical";
}) {
  const toneColor =
    tone === "healthy" ? "cyan-glow"
    : tone === "warning" ? "amber-warn"
    : "red-critical";
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-mono text-xs tracking-wider transition-all ${
        active ?
          `bg-${toneColor}/20 border border-${toneColor} text-${toneColor}`
        : "border border-white/10 text-fog-300 hover:border-white/30 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function MachineCard({ machine }: { machine: MachineState }) {
  const latest = machine.readings[machine.readings.length - 1];
  const statusColor =
    machine.status === "healthy" ? "#00E5FF"
    : machine.status === "warning" ? "#FFB800"
    : "#FF3366";
  const statusLabel =
    machine.status === "healthy" ? "HEALTHY"
    : machine.status === "warning" ? "WARNING"
    : "CRITICAL";

  return (
    <div
      className="relative p-5 glass group hover:border-white/20 transition-colors"
      style={{
        boxShadow:
          machine.status === "critical" ?
            `0 0 30px ${statusColor}20`
          : undefined,
      }}
    >
      {/* Status strip */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ backgroundColor: statusColor }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] text-fog-400 mb-1">
            {machine.id}
          </div>
          <div className="text-sm font-semibold text-white">{machine.name}</div>
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded"
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
          }}
        >
          {machine.status === "critical" && (
            <AlertTriangle className="w-3 h-3" />
          )}
          {machine.status === "warning" && <Zap className="w-3 h-3" />}
          {machine.status === "healthy" && <Activity className="w-3 h-3" />}
          <span className="font-mono text-[10px] tracking-widest">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Big score */}
      <div className="flex items-baseline gap-2 mb-4">
        <span
          className="text-5xl font-black tracking-tight"
          style={{ color: statusColor }}
        >
          {machine.score}
        </span>
        <span className="text-xs text-fog-400 font-mono">/ 100</span>
      </div>

      {/* Mini sparkline */}
      <Sparkline readings={machine.readings} color={statusColor} />

      {/* Live readings */}
      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-fog-400">TEMP</span>
          <span className="text-white">
            {latest ? `${latest.temperature_C.toFixed(1)}°C` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-fog-400">VIB</span>
          <span className="text-white">
            {latest ? `${latest.vibration_mm_s.toFixed(1)}` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-fog-400">RPM</span>
          <span className="text-white">
            {latest ? latest.rpm.toFixed(0) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-fog-400">AMP</span>
          <span className="text-white">
            {latest ? latest.current_A.toFixed(1) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Sparkline({
  readings,
  color,
}: {
  readings: Reading[];
  color: string;
}) {
  if (readings.length < 2) {
    return <div className="h-12 bg-white/[0.02] rounded" />;
  }

  const temps = readings.map((r) => r.temperature_C);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;

  const points = readings
    .map((r, i) => {
      const x = (i / (readings.length - 1)) * 100;
      const y = 100 - ((r.temperature_C - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full h-12"
    >
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,100 ${points} 100,100`}
        fill={`url(#grad-${color})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
