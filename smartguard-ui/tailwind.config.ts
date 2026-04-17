import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          0: "#000000",
          50: "#0A0A0A",
          100: "#111111",
          200: "#1A1A1A",
          300: "#222222",
          400: "#2A2A2A",
          500: "#3A3A3A",
        },
        cyan: {
          glow: "#00E5FF",
          dim: "#00B8D4",
        },
        amber: {
          warn: "#FFB800",
        },
        red: {
          critical: "#FF3366",
        },
        fog: {
          100: "#E6E6E6",
          200: "#B8B8B8",
          300: "#8A8A8A",
          400: "#5A5A5A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(4rem, 12vw, 10rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(3rem, 8vw, 6.5rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(2rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "scan": "scan 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(0, 229, 255, 0.6)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "radial-glow": "radial-gradient(circle at center, rgba(0, 229, 255, 0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
