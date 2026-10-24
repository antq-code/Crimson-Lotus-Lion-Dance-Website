Single-page Website Development for local lion dance team based in College Station, TX.

# Tools
Design Mockup: Figma
AI: Claude Code on VSCode
Email Routing: Cloudflare
Host & Deployment: Github, Cloudflare

# Tech Stack
React, JS, HTML/CSS, Node.js, Vite
Contact form backend: Cloudflare Workers, Cloudflare Turnstile, Cloudflare Email Routing

# Contact Form
The booking form on the site sends messages to the team's Gmail through a Cloudflare Worker.

**How it works**
1. A visitor fills in the form (name, email, event date, event type, message) and passes the Cloudflare Turnstile check.
2. The site POSTs the form as JSON to `https://api.crimsonlotusld.com/contact`.
3. The Worker (`/worker`) checks the request came from crimsonlotusld.com, ignores bots that fill the hidden "website" honeypot field, validates the fields, and verifies the Turnstile token with Cloudflare.
4. It emails the request through Cloudflare Email Routing, from `contact@crimsonlotusld.com`, with Reply-To set to the visitor, so hitting Reply in Gmail answers them directly.

The address is also shown next to the form (with a Copy button and a Gmail link) as a fallback.

**Where things live**
- `src/components/Contact.jsx`: the form, the fallback email row, and the success/error messages
- `src/components/Turnstile.jsx`: the Turnstile widget
- `src/content.js`: the Worker URL, Turnstile site key, event types, and fallback email address
- `worker/src/index.js`: the Worker (CORS, validation, Turnstile check, email)
- `worker/wrangler.toml`: Worker name, custom domain, email binding, and destination address

**Changing the destination email**
1. In Cloudflare: **Email → Email Routing → Destination addresses**, add the new address and click the verification link sent to it.
2. In `worker/wrangler.toml`, change both `destination_address` (under `[[send_email]]`) and `CONTACT_TO` to the new address.
3. In `src/content.js`, change `contact.email` (the fallback address shown on the site) and the `mailto:` in `socials.email`.
4. Commit and push. GitHub Actions redeploys the Worker and the site.

**Secrets**
`TURNSTILE_SECRET` is set in Cloudflare (**Workers & Pages → crimson-lotus-contact → Settings → Variables and Secrets**), never in the code.

**Testing locally**
```
cd worker
npm install
cp .dev.vars.example .dev.vars    # Turnstile test secret + allows localhost:5173
npm run dev                       # Worker on http://localhost:8787
```
In another terminal, from the project root:
```
VITE_CONTACT_API=http://localhost:8787/contact npm run dev
```
(PowerShell: `$env:VITE_CONTACT_API="http://localhost:8787/contact"; npm run dev`)
In development the site uses Cloudflare's Turnstile test key, which always passes. Emails aren't really sent locally; wrangler saves them as `.eml` files and prints the path.

# Deployment
GitHub Actions deploys on every push to `main`:
- `.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages (skipped when only `worker/` changes).
- `.github/workflows/deploy-worker.yml` deploys the Worker to Cloudflare when files in `worker/` change. It uses the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.


# Assets
Photography Assets: Jonathan Nguyen
Logo, Lettering, Color Assets: Crimson Lotus Lion Dance Team
Interactive grid overlay, Glowing border edge: Found on ReactBits.dev
Font: Google Cinzel
