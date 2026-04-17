# SmartGuard — Scrollytelling UI

Portfolio-grade scrollytelling landing page for the SmartGuard predictive maintenance agent. Built with Next.js 14, Tailwind CSS, Framer Motion, and Lenis.

![SmartGuard](https://img.shields.io/badge/Next.js-14-black) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan) ![Framer](https://img.shields.io/badge/Framer_Motion-11-ff0055)

## What this is

A dark-premium, cinematic landing page that tells the SmartGuard story through scroll: hero → problem → solution → data-flow pipeline (the wow moment) → **live dashboard connected to your Flask backend** → tech stack → impact → close.

The Live Demo section is fully interactive — it connects to `stream_server.py` via SSE and can trigger fault injection through your existing `/set_mode` endpoint. If the backend is offline, the dashboard falls back to an internal simulator so the site never looks broken.

## Quick start

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env.local
# Edit FLASK_URL if your backend isn't on http://localhost:3000

# 3. Run dev
npm run dev
```

Open http://localhost:3000 (or whatever port Next picks if 3000 is taken by Flask).

## Running with your Flask backend

**Two terminals:**

```bash
# Terminal 1 — Flask
cd smartguard-v2
python stream_server.py        # runs on :3000

# Terminal 2 — Next.js
cd smartguard-ui
PORT=3001 npm run dev          # runs on :3001
```

Then visit http://localhost:3001. The Live Dashboard section will auto-detect the backend and show a "Connected to Flask backend" indicator. The "Inject Fault" buttons hit `/set_mode` on Flask just like your original demo.

### One-time Flask fix (CORS + SSE)

Your `stream_server.py` needs CORS headers for the browser to consume the SSE stream from a different port. Add this at the top:

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # allow Next.js dev origin
```

Install once:

```bash
pip install flask-cors
```

If you prefer no CORS changes, the `next.config.js` in this repo already proxies `/api/stream/*` and `/api/set_mode` to your Flask server — so the browser thinks everything is same-origin.

## Project structure

```
smartguard-ui/
├── app/
│   ├── layout.tsx          # Root layout, fonts, smooth scroll wrapper
│   ├── page.tsx            # Page composition (all sections)
│   └── globals.css         # Tailwind + custom utilities
├── components/
│   ├── Nav.tsx             # Floating top nav
│   ├── SmoothScroll.tsx    # Lenis wrapper
│   └── sections/
│       ├── Hero.tsx
│       ├── Problem.tsx     # Animated stat counters
│       ├── Solution.tsx    # Horizontal pinned scroll
│       ├── DataFlow.tsx    # The cinematic pipeline — scroll-driven
│       ├── LiveDashboard.tsx  # Connects to Flask via SSE
│       ├── TechStack.tsx
│       ├── Impact.tsx
│       └── Footer.tsx
├── tailwind.config.ts
├── next.config.js          # Proxies /api/* to Flask
└── package.json
```

## Design system

- **Background:** Near-black `#0A0A0A` with subtle grid + film-grain overlay
- **Accent:** Cyan `#00E5FF` (healthy, primary CTA)
- **Warning:** Amber `#FFB800`
- **Critical:** Red `#FF3366`
- **Type:** Inter (display + body) + JetBrains Mono (labels, code)
- **Motion:** Lenis smooth scroll + Framer Motion scroll-driven animations + GSAP-style pinning via `useScroll` + `useTransform`

## Deploy

```bash
# Vercel — zero config
npx vercel

# Or build static
npm run build
npm run start
```

Set `FLASK_URL` in Vercel env vars to your deployed Flask URL (or leave it pointing at a hosted mock). If the backend isn't deployed, the simulator fallback kicks in automatically.

## What to tweak

Common customizations you'll want:

1. **Your name / links** — `components/sections/Footer.tsx`
2. **GitHub repo link** — `components/Nav.tsx` + `Footer.tsx`
3. **Stat numbers** — `components/sections/Problem.tsx` + `Impact.tsx`
4. **Colors** — `tailwind.config.ts` under `theme.extend.colors`
5. **Section order** — `app/page.tsx`

## Credits

Built by Yashwanth Prabhu · Hack with Malenadu 2024
