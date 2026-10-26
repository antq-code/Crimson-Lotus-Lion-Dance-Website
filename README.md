Single-page Website Development for local lion dance team based in College Station, TX.

# Tools
- Design Mockup: Figma
- AI: Claude Code on VSCode
- Email Routing: Cloudflare
- Host & Deployment: Github, Cloudflare

# Tech Stack
- React, JS, HTML/CSS, Node.js, Vite
- Contact form backend: Cloudflare Workers, Cloudflare
- Turnstile, Cloudflare Email Routing

# Deployment
GitHub Actions deploys on every push to `main`:
- `.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages (skipped when only `worker/` changes).
- `.github/workflows/deploy-worker.yml` deploys the Worker to Cloudflare when files in `worker/` change. It uses the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

# Assets
- Photography Assets: Jonathan Nguyen
- Logo, Lettering, Color Assets: Crimson Lotus Lion Dance Team
- Interactive grid overlay, Glowing border edge: Found on ReactBits.dev
- Gradient background: Found on auragradients.vercel.app
- Font: Google Cinzel
