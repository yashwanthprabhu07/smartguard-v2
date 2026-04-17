"use client";

import { motion } from "framer-motion";

const stack = [
  {
    group: "AI & ML",
    items: [
      { name: "Isolation Forest", sub: "scikit-learn" },
      { name: "Groq LLaMA 3.3 70B", sub: "reasoning agent" },
      { name: "Joblib", sub: "model persistence" },
    ],
  },
  {
    group: "Backend",
    items: [
      { name: "Flask", sub: "SSE streaming" },
      { name: "Python 3.11", sub: "threaded monitors" },
      { name: "sseclient-py", sub: "real-time pipe" },
    ],
  },
  {
    group: "Frontend",
    items: [
      { name: "Next.js 14", sub: "App Router" },
      { name: "Framer Motion", sub: "scroll animation" },
      { name: "Tailwind + Lenis", sub: "styling + smooth scroll" },
    ],
  },
];

export default function TechStack() {
  return (
    <section className="relative py-32 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="font-mono text-xs text-cyan-glow tracking-[0.3em] mb-6">
            05 — BUILT WITH
          </div>
          <h2 className="text-display-md font-black tracking-tight leading-[1.05] max-w-3xl">
            <span className="text-white">Boring tech, </span>
            <span className="text-fog-400">chosen deliberately.</span>
          </h2>
          <p className="mt-6 text-fog-300 max-w-2xl">
            Every piece of this stack is production-ready, widely used in
            industry, and deployable on a raspberry pi if needed. No hype-driven
            choices.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {stack.map((group, gi) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: gi * 0.15 }}
              className="glass p-8"
            >
              <div className="font-mono text-xs text-cyan-glow tracking-widest mb-6">
                {group.group}
              </div>
              <ul className="space-y-4">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-start justify-between pb-4 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <div className="text-white font-semibold">
                        {item.name}
                      </div>
                      <div className="text-xs text-fog-400 mt-1">
                        {item.sub}
                      </div>
                    </div>
                    <span className="w-1.5 h-1.5 bg-cyan-glow/60 rounded-full mt-2" />
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
