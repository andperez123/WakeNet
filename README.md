# WakeNet

Event-driven wake infrastructure for AI agents. This repo has the **landing page** (live on Vercel) and will host the **MVP** as we build it.

## Deploy to Vercel (landing page live in ~2 min)

**Option A — Push to GitHub, then Vercel**

1. Create a new repo on GitHub (e.g. `wakenet`).
2. In this folder:
   ```bash
   git init
   git add .
   git commit -m "Landing page ready for Vercel"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wakenet.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo.
4. Leave defaults (Framework: Next.js, Root: `.`) → **Deploy**. Done.

**Option B — Vercel CLI**

```bash
npm i -g vercel
vercel
```

Follow prompts (link to existing project or create new). Then `vercel --prod` to go live.

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Stack

- **Next.js 14** (App Router), **Tailwind CSS**, **TypeScript**
- Fonts: Space Grotesk, JetBrains Mono (Google Fonts at runtime)
