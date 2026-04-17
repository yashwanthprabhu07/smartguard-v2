"use client";

import { motion } from "framer-motion";
import { Github, Mail, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Giant wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-16 select-none"
        >
          <h3 className="text-[clamp(4rem,16vw,16rem)] font-black tracking-tighter leading-none">
            <span className="text-white">Smart</span>
            <span className="gradient-text">Guard</span>
          </h3>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 mb-16">
          <div>
            <div className="font-mono text-xs text-cyan-glow tracking-widest mb-4">
              PROJECT
            </div>
            <p className="text-fog-300 text-sm leading-relaxed max-w-xs">
              Built solo for Hack with Malenadu. AI-powered predictive
              maintenance agent — open source on GitHub.
            </p>
          </div>

          <div>
            <div className="font-mono text-xs text-cyan-glow tracking-widest mb-4">
              LINKS
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/yashwanthprabhu07/smartguard-v2"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white hover:text-cyan-glow transition-colors flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  Repository
                </a>
              </li>
              <li>
                <a
                  href="#dashboard"
                  className="text-white hover:text-cyan-glow transition-colors flex items-center gap-2"
                >
                  Live Demo
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs text-cyan-glow tracking-widest mb-4">
              CONTACT
            </div>
            <p className="text-fog-300 text-sm mb-4">
              Want to take this further? Let's talk.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/yashwanthprabhu07"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full border border-white/10 grid place-items-center hover:border-cyan-glow hover:text-cyan-glow transition-all"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-white/10 grid place-items-center hover:border-cyan-glow hover:text-cyan-glow transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-white/10 grid place-items-center hover:border-cyan-glow hover:text-cyan-glow transition-all"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs text-fog-400">
          <div>© 2025 Yashwanth Prabhu · Built at Hack with Malenadu</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow live-dot" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
