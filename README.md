<div align="center">

<img src="https://img.shields.io/badge/⚡-Portfolio%20Forge-black?style=for-the-badge&labelColor=black&color=6C63FF" height="40"/>

<h3>Turn your résumé into a stunning portfolio website — instantly.</h3>

<p>
  <a href="https://shaikhshahnawaz13.github.io/portfolioforge/">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20Now-6C63FF?style=for-the-badge"/>
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Groq%20API-F55036?style=flat-square&logoColor=white"/>
  <img src="https://img.shields.io/badge/Gemini%20API-4285F4?style=flat-square&logo=google&logoColor=white"/>
</p>

<br/>

</div>

---

## What is Portfolio Forge?

Portfolio Forge is a browser-based tool that reads your resume and generates a complete, deployable portfolio website — with real HTML, CSS, and JavaScript — in under 30 seconds.

No templates. No drag and drop. Just upload your resume, describe the style you want, and get a fully custom portfolio ready to deploy.

Everything runs in your browser. No server, no account, no data stored anywhere.

---

## Features

- **Resume Upload** — Supports PDF and DOCX. Text is extracted directly in the browser using PDF.js and Mammoth.js.
- **4 AI Providers** — Choose between Groq, Google Gemini, OpenAI, or OpenRouter. Two of them are completely free.
- **Design Prompts** — Describe exactly how you want your portfolio to look. Use presets or write your own.
- **Live Preview** — See your generated portfolio instantly in a sandboxed iframe. Toggle between desktop and mobile views.
- **Download as ZIP** — Get `index.html`, `style.css`, and `script.js` packaged and ready to deploy.
- **Code Viewer** — Inspect and copy the generated code file by file.
- **Auto Retry** — Handles rate limits and malformed responses automatically — retries up to 3 times.
- **Zero Data Collection** — Your API key and resume text never leave your browser except to reach the AI provider directly.

---

## Live Demo

**[shaikhshahnawaz13.github.io/portfolioforge](https://shaikhshahnawaz13.github.io/portfolioforge/)**

Open it, paste a free API key, upload your resume, and generate.

---

## Supported AI Providers

| Provider | Model | Cost | Get API Key |
|---|---|---|---|
| ⚡ Groq | `llama-3.3-70b-versatile` | Free | [console.groq.com](https://console.groq.com) |
| ✦ Google Gemini | `gemini-2.0-flash` | Free | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| ◆ OpenAI | `gpt-4o-mini` | Paid | [platform.openai.com](https://platform.openai.com/api-keys) |
| ⬡ OpenRouter | `mistral-7b-instruct:free` | Free models available | [openrouter.ai](https://openrouter.ai/keys) |

Start with **Groq** — fastest and easiest to set up for free.

---

## How to Use

**Step 1 — Get a free API key**

Go to [console.groq.com](https://console.groq.com), sign up, and create an API key. Takes about a minute. No credit card needed.

**Step 2 — Open Portfolio Forge**

Go to [shaikhshahnawaz13.github.io/portfolioforge](https://shaikhshahnawaz13.github.io/portfolioforge/)

**Step 3 — Set up**

- Select your AI provider (Groq recommended)
- Paste your API key
- Upload your resume (PDF or DOCX)

**Step 4 — Describe your style**

Write a prompt like:

```
Dark portfolio with purple and cyan gradient accents, glassmorphism cards,
animated hero section, smooth scroll animations, and a professional layout.
```

Or pick one of the preset styles — Modern Dark, Clean Minimal, Bold Colorful, or Terminal.

**Step 5 — Generate and deploy**

Click **Generate Portfolio →**, wait 15–30 seconds, preview the result, and download the ZIP.

Upload the files to GitHub Pages, Netlify, or Vercel and you're live.

---

## Run Locally

```bash
git clone https://github.com/shaikhshahnawaz13/portfolioforge.git
cd portfolioforge

# Just open the file — no install needed
open index.html
```

Or use Live Server in VS Code — right click `index.html` → Open with Live Server.

> This is a single static HTML file. There is no backend, no build step, and no dependencies to install.

---

## Prompt Examples

**Modern Dark:**
```
Dark background with vivid purple (#6C63FF) and cyan (#00D4AA) gradients.
Glassmorphism cards, gradient hero, animated skill bars, scroll reveal animations.
```

**Clean Minimal:**
```
White background, clean typography, lots of whitespace, subtle gray borders.
Simple hover effects. Professional and understated.
```

**Bold & Colorful:**
```
Bold gradient from deep purple to hot pink. Large typography, glowing card
shadows, animated gradient backgrounds, floating shapes in the hero.
```

**Terminal:**
```
Solid black background, matrix green text (#00FF41), monospace font,
typing animation on the hero, blinking cursor, ASCII-style dividers.
```

---

## How It Works

```
Resume (PDF/DOCX)
       │
       ▼
Text Extraction ──── PDF.js / Mammoth.js (browser-side)
       │
       ▼
   + Design Prompt
       │
       ▼
  AI Provider ──── Groq / Gemini / OpenAI / OpenRouter
       │
       ▼
 Generated Code
  ├── index.html
  ├── style.css
  └── script.js
       │
  ┌────┴────┐
  │         │
Preview   ZIP Download
(iframe)  (JSZip)
```

The AI is given a detailed design system specification covering color variables, spacing scale, typography, card components, button styles, animations, and responsive rules — so every generated portfolio follows a consistent professional structure.

The response parser uses 4 strategies to extract the code reliably:
1. Custom delimiters (`===HTML_START===` etc.)
2. Markdown code fences
3. Whitespace-normalized delimiter matching
4. Raw HTML body detection as a last resort

---

## Project Structure

```
portfolioforge/
└── index.html       # The entire application in one file
```

Single self-contained HTML file. No frameworks, no build tools, no package manager. Just plain HTML, CSS, and vanilla JavaScript with three CDN libraries:

| Library | Purpose |
|---|---|
| [PDF.js](https://mozilla.github.io/pdf.js/) | Extract text from PDF files |
| [Mammoth.js](https://github.com/mwilliamson/mammoth.js) | Extract text from DOCX files |
| [JSZip](https://stuk.github.io/jszip/) | Package generated files into a ZIP |

---

## Privacy

- API keys stored only in memory — cleared when you close the tab
- Resume text is processed locally and only sent to your chosen AI provider
- No analytics, no logging, no server of any kind
- Nothing ever stored in localStorage or cookies

> If you accidentally share an API key publicly, revoke it immediately from your provider's dashboard.

---

## Deploy Your Generated Portfolio

Once you download the ZIP:

```
my-portfolio.zip
├── index.html
├── style.css
└── script.js
```

**GitHub Pages** — Create a repo, upload the 3 files, enable Pages in Settings.

**Netlify** — Drag and drop the folder at [app.netlify.com/drop](https://app.netlify.com/drop).

**Vercel** — Run `vercel` in the unzipped folder.

---

## Known Issues

| Issue | Fix |
|---|---|
| Scanned PDF shows no text | Use a text-based PDF — export from Word or Google Docs |
| Rate limit error | Auto-retry handles it — if it keeps failing, wait 1 minute |
| Layout needs tweaking | Copy code from the viewer and edit in VS Code |

---

## Roadmap

- [ ] Template gallery — pick a visual style before generating
- [ ] Direct deploy to GitHub Pages from the UI
- [ ] Save and reload previous generations
- [ ] Custom model selection per provider
- [ ] In-browser code editor for live tweaks after generation

---

## Author

**Shahnawaz Ahmed Shaikh**
B.Sc. IT · Akbar Peerbhoy College · University of Mumbai

[Portfolio](https://shaikhshahnawaz13.github.io/portfolio) · [GitHub](https://github.com/shaikhshahnawaz13) · [Email](mailto:zenro911@gmail.com)

---

## License

MIT — free to use and modify.

A ⭐ on the repo is appreciated if this helped you!

---

<div align="center">
  <strong>⚡ Portfolio Forge — Built by Shahnawaz</strong><br/>
  <a href="https://shaikhshahnawaz13.github.io/portfolioforge/">shaikhshahnawaz13.github.io/portfolioforge</a>
</div>
