# ⚡ Portfolio Forge

> Upload your résumé → write a design prompt → get a stunning portfolio in seconds.  
> **100% in the browser. No server. No backend.**

[![CI](https://github.com/shaikhshahnawaz13/portfolioforge/actions/workflows/ci.yml/badge.svg)](https://github.com/shaikhshahnawaz13/portfolioforge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## How it Works

1. **Pick an AI provider** — Groq (free), Google Gemini (free), OpenAI, or OpenRouter
2. **Paste your API key** — stays in your browser memory, never sent anywhere else
3. **Upload your résumé** — PDF or DOCX, text is extracted client-side
4. **Write a design prompt** — or pick a preset (Dark Minimal, Terminal, Editorial…)
5. **Click Generate** — AI crafts a complete HTML/CSS/JS portfolio
6. **Download as ZIP** — deploy to GitHub Pages, Netlify, or Vercel in minutes

---

## Project Structure

```
portfolioforge/
├── index.html                # App shell — structure only (no inline styles/scripts)
├── src/
│   ├── style.css             # All styles — editorial monochrome design system
│   └── app.js                # App logic — providers, extraction, AI calls, UI
├── tests/
│   └── app.test.js           # Unit tests (Vitest/Jest)
├── .github/
│   └── workflows/
│       └── ci.yml            # CI: test + deploy to GitHub Pages on main push
├── package.json              # Scripts and dev dependencies
├── .gitignore
├── LICENSE                   # MIT
└── README.md
```

---

## Getting Started

### Run locally

```bash
# Clone the repo
git clone https://github.com/shaikhshahnawaz13/portfolioforge.git
cd portfolioforge

# Serve (no build step needed — it's plain HTML/CSS/JS)
npx serve . --listen 3000
# open http://localhost:3000
```

### Run tests

```bash
npm install
npm test
```

---

## Design Prompt Presets

| Preset          | Style                                                   |
|-----------------|---------------------------------------------------------|
| Modern Dark     | Charcoal bg, electric cyan accent, sharp geometric lines |
| Clean Minimal   | Swiss editorial, off-white, terracotta accent, serif     |
| Bold Colorful   | Deep navy, neon rainbow gradient, maximalist energy      |
| Terminal        | Black bg, phosphor green, monospace everywhere           |
| Glassmorphism   | Dark gradient mesh, frosted glass cards, violet glow     |
| Editorial       | Cream paper, serif display font, magazine layout         |

---

## Supported AI Providers

| Provider    | Free Tier | Model                        | Key Prefix  |
|-------------|-----------|------------------------------|-------------|
| Groq        | ✅ Yes    | llama-3.3-70b-versatile      | `gsk_`      |
| Google Gemini | ✅ Yes  | gemini-2.0-flash             | `AIza`      |
| OpenAI      | ❌ No     | gpt-4o-mini                  | `sk-`       |
| OpenRouter  | ✅ Partial| mistral-7b-instruct (free)   | `sk-or-`    |

---

## Deployment

The generated portfolio is a static ZIP — 3 files: `index.html`, `style.css`, `script.js`.

**GitHub Pages:**
```bash
git init my-portfolio
cp -r extracted-zip/* my-portfolio/
cd my-portfolio && git add . && git commit -m "portfolio"
git push origin main
# Enable Pages in repo Settings → Pages → main branch
```

**Netlify Drop:** drag the extracted folder to [netlify.com/drop](https://app.netlify.com/drop)

**Vercel:** `cd extracted-zip && npx vercel`

---

## Privacy

- API keys are stored in JavaScript memory only — never in `localStorage`, `sessionStorage`, or sent to any server other than the selected AI provider
- Resume text is extracted entirely in the browser (PDF.js, Mammoth.js)
- No analytics, no tracking, no cookies

---

## Contributing

PRs welcome! Please:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Add tests for new logic
4. Open a pull request

---

## License

[MIT](LICENSE) © Shahnawaz Shaikh
