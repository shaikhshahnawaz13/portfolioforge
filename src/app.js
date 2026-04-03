/**
 * Portfolio Forge — app.js
 * AI-powered portfolio generator. No server required.
 * Features: multi-key pool with automatic rotation on rate-limit.
 */

/* ─── PDF.js worker setup ─────────────────────────────────── */
window.addEventListener('load', () => {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
});

/* ─── App State ───────────────────────────────────────────── */
const STATE = {
  provider:   'groq',
  keyPool:    [],   // [{ key, valid, rateLimited, uses }]
  file:       null,
  resumeText: '',
  html:       '',
  css:        '',
  js:         '',
  activeTab:  'html',
  loading:    false,
};

/* ─── DOM helpers ────────────────────────────────────────────*/
const $  = (id)  => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ─── Provider Definitions ────────────────────────────────── */
const PROVIDERS = {
  groq: {
    label:       'GROQ · LLAMA 3.3 70B',
    model:       'llama-3.3-70b-versatile',
    endpoint:    'https://api.groq.com/openai/v1/chat/completions',
    type:        'openai',
    placeholder: 'Paste Groq key — gsk_...',
    helpHTML:    'Free keys at <a href="https://console.groq.com" target="_blank" rel="noopener" class="link-warning">console.groq.com</a>',
    validate:    (k) => k.startsWith('gsk_') && k.length > 20,
    hint:        'Must start with gsk_',
  },
  gemini: {
    label:       'GOOGLE · GEMINI 2.0 FLASH',
    model:       'gemini-2.0-flash',
    endpoint:    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    type:        'gemini',
    placeholder: 'Paste Google AI key — AIza...',
    helpHTML:    'Free keys at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="link-warning">aistudio.google.com</a>',
    validate:    (k) => k.startsWith('AIza') && k.length > 20,
    hint:        'Must start with AIza',
  },
  openai: {
    label:       'OPENAI · GPT-4O MINI',
    model:       'gpt-4o-mini',
    endpoint:    'https://api.openai.com/v1/chat/completions',
    type:        'openai',
    placeholder: 'Paste OpenAI key — sk-...',
    helpHTML:    'Keys at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" class="link-warning">platform.openai.com</a>',
    validate:    (k) => k.startsWith('sk-') && !k.startsWith('sk-or-') && k.length > 20,
    hint:        'Must start with sk-',
  },
  openrouter: {
    label:       'OPENROUTER · MISTRAL 7B (FREE)',
    model:       'mistralai/mistral-7b-instruct:free',
    endpoint:    'https://openrouter.ai/api/v1/chat/completions',
    type:        'openai',
    placeholder: 'Paste OpenRouter key — sk-or-...',
    helpHTML:    'Free keys at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" class="link-warning">openrouter.ai</a>',
    validate:    (k) => k.startsWith('sk-or-') && k.length > 20,
    hint:        'Must start with sk-or-',
  },
};

/* ─── Prompt Presets ──────────────────────────────────────── */
const PROMPT_PRESETS = {
  'dark-minimal':  'Sophisticated dark portfolio. Background #0d0d0d, accent electric cyan #00f5d4. Fonts: Space Grotesk headings, DM Sans body. Split-screen hero: bold typographic left, animated CSS geometric shape right. Sharp lines, no rounded corners.',
  'clean-minimal': 'Swiss editorial. Off-white #fafaf8, ink black, terracotta accent #c0392b. Playfair Display italic headings, Plus Jakarta Sans body. Large baseline-aligned name hero, 1px rule section dividers, generous whitespace.',
  'bold-colorful': 'Maximalist energy. Deep navy #0a0a2e, neon gradient #ff6b6b→#feca57→#48dbfb. Syne display, Outfit body. Giant oversized name hero, floating skill badges, animated stat counters.',
  'terminal':      'Hacker terminal. Pure #000, phosphor green #00ff41. JetBrains Mono everywhere. Boot-sequence hero with typing animation. Skills as ls -la output. Projects as git log. ASCII section dividers.',
  'glassmorphism': 'Premium glass. Dark gradient #1a0533→#0d1b2a. Cards: rgba(255,255,255,0.06) + backdrop-filter blur(20px). Raleway headings, DM Sans body. Violet accent #b794f4. Frosted hero card over particle mesh.',
  'editorial':     'Magazine editorial. Cream #fffdf5, ink black, brick red #b5451b. DM Serif Display italic, Nunito body. Grid-breaking layout, newspaper timeline for experience, pull-quote project cards.',
};

/* ═══════════════════════════════════════════════════════════
   KEY POOL MANAGEMENT
   ═══════════════════════════════════════════════════════════ */

/** Re-render the key pool badges from STATE.keyPool */
function renderKeyPool() {
  const cfg      = PROVIDERS[STATE.provider];
  const list     = $('key-pool-list');
  const counter  = $('key-count');
  const validKeys = STATE.keyPool.filter(e => cfg.validate(e.key));

  counter.textContent = validKeys.length
    ? `${validKeys.length} key${validKeys.length > 1 ? 's' : ''} · rotates automatically`
    : '';

  list.innerHTML = '';
  STATE.keyPool.forEach((entry, idx) => {
    const valid = cfg.validate(entry.key);
    const badge = document.createElement('div');
    badge.className = 'key-badge' + (entry.rateLimited ? ' rate-limited' : valid ? ' valid' : ' invalid');
    badge.innerHTML = `
      <span class="key-badge-label">
        ${valid ? '✓' : '✗'} Key ${idx + 1}
        <span class="key-badge-preview">${entry.key.slice(0, 8)}…</span>
        ${entry.rateLimited ? '<span class="key-badge-tag">rate limited</span>' : ''}
        ${entry.uses > 0    ? `<span class="key-badge-tag">${entry.uses} use${entry.uses > 1 ? 's' : ''}</span>` : ''}
      </span>
      <button class="key-badge-remove" onclick="removeKey(${idx})" aria-label="Remove key ${idx + 1}">✕</button>`;
    list.appendChild(badge);
  });

  refreshBtn();
}

/** Add the key currently typed in the input box to the pool */
function addKeyToPool() {
  const inp = $('api-key-input');
  const k   = inp.value.trim();
  const cfg = PROVIDERS[STATE.provider];

  if (!k) { toast('Paste a key first.', 'error'); return; }
  if (!cfg.validate(k)) { toast(cfg.hint, 'error'); return; }
  if (STATE.keyPool.some(e => e.key === k)) { toast('That key is already in the pool.', 'error'); return; }

  STATE.keyPool.push({ key: k, rateLimited: false, uses: 0 });
  inp.value = '';
  onKeyInput(); // clear validation state
  renderKeyPool();
  toast(`Key ${STATE.keyPool.length} added to pool!`, 'success');
}

/** Remove a key from the pool by index */
function removeKey(idx) {
  STATE.keyPool.splice(idx, 1);
  renderKeyPool();
}

/** Clear all rate-limited flags (called before each generation) */
function resetKeyPoolLimits() {
  STATE.keyPool.forEach(e => { e.rateLimited = false; });
}

/**
 * Pick the next available (non-rate-limited, valid) key.
 * Returns the key string, or null if all keys are exhausted.
 */
function getNextKey() {
  const cfg = PROVIDERS[STATE.provider];
  const available = STATE.keyPool.filter(e => cfg.validate(e.key) && !e.rateLimited);
  return available.length ? available[0] : null;
}

/** Mark a key as rate-limited so the next call uses a different one */
function markKeyRateLimited(key) {
  const entry = STATE.keyPool.find(e => e.key === key);
  if (entry) entry.rateLimited = true;
  renderKeyPool();
}

/** Increment usage counter for a key */
function markKeyUsed(key) {
  const entry = STATE.keyPool.find(e => e.key === key);
  if (entry) entry.uses++;
  renderKeyPool();
}

/* ─── Provider Selector ───────────────────────────────────── */
function selectProvider(id) {
  STATE.provider  = id;
  STATE.keyPool   = [];
  const cfg = PROVIDERS[id];

  $$('.pvdr-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.p === id);
    b.setAttribute('aria-checked', b.dataset.p === id ? 'true' : 'false');
  });

  const inp       = $('api-key-input');
  inp.value       = '';
  inp.placeholder = cfg.placeholder;

  $('key-help').innerHTML         = cfg.helpHTML + ' · Keys stay in memory — never stored.';
  $('provider-label').textContent = cfg.label;
  $('model-label').textContent    = 'Model: ' + cfg.model;
  $('key-status').textContent     = '';
  $('api-key-section').classList.remove('key-ok');

  renderKeyPool();
}

function onKeyInput() {
  const k   = $('api-key-input').value.trim();
  const cfg = PROVIDERS[STATE.provider];
  const ks  = $('key-status');
  const sec = $('api-key-section');

  // Just validate the field — adding happens via the + button
  const poolValid = STATE.keyPool.filter(e => cfg.validate(e.key)).length > 0;

  if (cfg.validate(k)) {
    ks.textContent = '✓ Valid — click + to add';
    ks.style.color = 'rgba(74,222,128,0.8)';
  } else if (k.length > 0) {
    ks.textContent = cfg.hint;
    ks.style.color = 'rgba(255,165,0,0.7)';
  } else {
    ks.textContent = poolValid ? '' : 'Add at least one key';
    ks.style.color = '';
  }

  if (poolValid) {
    sec.classList.add('key-ok');
  } else {
    sec.classList.remove('key-ok');
  }

  refreshBtn();
}

function toggleKeyVis() {
  const inp = $('api-key-input');
  inp.type  = inp.type === 'password' ? 'text' : 'password';
}

/* ─── File Handling ───────────────────────────────────────── */
function onDrop(e) {
  e.preventDefault();
  $('upload-zone').classList.remove('drag-over');
  const f = e.dataTransfer?.files?.[0];
  if (f) onFileChange(f);
}

function onFileChange(file) {
  if (!file) return;
  const name = file.name.toLowerCase();
  if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
    toast('Only PDF and DOCX supported.', 'error'); return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast('Max file size is 5MB.', 'error'); return;
  }
  STATE.file       = file;
  STATE.resumeText = '';
  $('upload-zone').classList.add('loaded');
  $('upload-label').textContent = '✓ File selected — ready to go';
  $('file-name').textContent    = file.name;
  $('file-size').textContent    = fmtBytes(file.size);
  $('file-bar').classList.add('show');
  setStep(2);
  setStatus('Resume ready. Write a prompt and generate.');
  refreshBtn();
}

function removeFile() {
  STATE.file = null; STATE.resumeText = '';
  $('file-input').value = '';
  $('upload-zone').classList.remove('loaded');
  $('upload-label').innerHTML = 'Drop your résumé here or <u>browse</u>';
  $('file-bar').classList.remove('show');
  setStep(1);
  setStatus('Upload your resume to continue.');
  refreshBtn();
}

function refreshBtn() {
  const cfg      = PROVIDERS[STATE.provider];
  const hasKey   = STATE.keyPool.some(e => cfg.validate(e.key));
  const ok       = hasKey && !!STATE.file && !STATE.loading;
  $('gen-btn').disabled = !ok;
  if (ok)          setStatus('All set! Click Generate Portfolio.');
  else if (!hasKey) setStatus('Add at least one API key to the pool.');
  else              setStatus('Upload your resume to continue.');
}

function setPrompt(key) { $('prompt').value = PROMPT_PRESETS[key] || ''; }

/* ─── Resume Text Extraction ──────────────────────────────── */
async function extractPDF(file) {
  const ab  = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    let line = '', lastY = null;
    for (const item of content.items) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 5) { text += line.trim() + '\n'; line = ''; }
      line += item.str + ' '; lastY = y;
    }
    text += line.trim() + '\n';
  }
  return text.trim();
}

async function extractDOCX(file) {
  const ab = await file.arrayBuffer();
  return (await mammoth.extractRawText({ arrayBuffer: ab })).value.trim();
}

/* ─── Resume Cleaner ──────────────────────────────────────── */
function cleanResume(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 1800);  // ~450 tokens — safe for Groq's free tier
}

/* ─── Custom Errors ───────────────────────────────────────── */
class RateLimitError extends Error { constructor(m) { super(m); this.name = 'RateLimitError'; } }
class ParseError     extends Error { constructor(m) { super(m); this.name = 'ParseError'; } }
class AllKeysError   extends Error { constructor(m) { super(m); this.name = 'AllKeysError'; } }

/* ─── Main Generate Flow ──────────────────────────────────── */
async function generate() {
  if (STATE.loading) return;
  const cfg     = PROVIDERS[STATE.provider];
  const hasKey  = STATE.keyPool.some(e => cfg.validate(e.key));
  if (!hasKey)        { toast('Add at least one API key.', 'error'); return; }
  if (!STATE.file)    { toast('Upload your resume first.', 'error'); return; }

  STATE.loading = true;
  resetKeyPoolLimits();
  refreshBtn();
  $('loading-box').hidden = false;
  $('preview-sec').hidden = true;
  setStep(3);

  try {
    if (!STATE.resumeText) {
      setLoadStep('Extracting resume text');
      stageSet('st1', 'active');
      setStatus('Reading your resume...');
      STATE.resumeText = STATE.file.name.toLowerCase().endsWith('.pdf')
        ? await extractPDF(STATE.file)
        : await extractDOCX(STATE.file);
      if (!STATE.resumeText || STATE.resumeText.length < 50)
        throw new Error('Could not extract text. Is it a scanned/image PDF?');
      stageSet('st1', 'done');
    }

    stageSet('st2', 'active');
    setStatus('AI is generating your portfolio...');
    const promptText = $('prompt').value.trim() || PROMPT_PRESETS['dark-minimal'];
    const { html, css, js } = await callWithKeyRotation(promptText);
    STATE.html = html; STATE.css = css; STATE.js = js;
    stageSet('st2', 'done');

    setLoadStep('Rendering preview');
    stageSet('st3', 'active');
    setStatus('Rendering...');
    await sleep(300);
    renderPreview();
    stageSet('st3', 'done');

    $('loading-box').hidden = false;  // keep visible briefly
    $('loading-box').hidden = true;
    $('preview-sec').hidden = false;
    setStep(4);
    setStatus('Portfolio forged! Preview below ↓');
    setTimeout(() => $('preview-sec').scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    toast('Portfolio generated successfully!', 'success');

  } catch (err) {
    console.error('[PortfolioForge]', err);
    $('loading-box').hidden = true;
    setStatus('Failed: ' + err.message);
    toast(err.message, 'error');
    setStep(2);
  } finally {
    STATE.loading = false;
    refreshBtn();
  }
}

/* ─── Key-Rotating Call Engine ────────────────────────────── */
/**
 * Tries each key in the pool in order. If a key hits a rate-limit,
 * marks it and immediately switches to the next one. If all keys are
 * rate-limited, waits and retries from the first key.
 */
async function callWithKeyRotation(promptText, maxRounds = 3) {
  const cfg        = PROVIDERS[STATE.provider];
  const validKeys  = () => STATE.keyPool.filter(e => cfg.validate(e.key));
  let lastErr;

  for (let round = 1; round <= maxRounds; round++) {
    // Reset rate-limit flags for a fresh round (except on first round)
    if (round > 1) {
      const wait = round * 15;
      for (let s = wait; s > 0; s--) {
        setLoadStep(`All keys rate-limited — retrying in ${s}s (round ${round}/${maxRounds})`);
        setStatus(`Waiting ${s}s before round ${round}...`);
        await sleep(1000);
      }
      resetKeyPoolLimits();
    }

    const keys = validKeys();
    if (!keys.length) throw new AllKeysError('No valid keys in pool.');

    for (let ki = 0; ki < keys.length; ki++) {
      const entry = keys[ki];
      const keyLabel = `Key ${STATE.keyPool.indexOf(entry) + 1}`;
      setLoadStep(`Calling AI with ${keyLabel}…`);
      setStatus(`Generating with ${keyLabel} of ${keys.length}…`);
      updateProviderLabel(STATE.keyPool.indexOf(entry));

      try {
        const result = await callAI(STATE.provider, cleanResume(STATE.resumeText), promptText, entry.key);
        markKeyUsed(entry.key);
        return result; // success — return immediately
      } catch (err) {
        lastErr = err;

        if (err.name === 'RateLimitError') {
          toast(`${keyLabel} rate-limited — switching to next key…`, 'error');
          markKeyRateLimited(entry.key);
          continue; // try next key immediately
        }

        if (err.name === 'ParseError') {
          toast('AI output malformed, retrying with same key…', 'error');
          await sleep(1500);
          ki--; // retry same key (don't advance)
          if (ki < -1) throw err; // prevent infinite retry
          continue;
        }

        // Fatal errors — don't retry
        throw err;
      }
    }
    // All keys in this round were rate-limited → loop to next round
  }

  throw lastErr || new AllKeysError('All keys exhausted after ' + maxRounds + ' rounds. Add more keys or wait a minute.');
}

/** Show which key slot is currently active in the header */
function updateProviderLabel(keyIdx) {
  const cfg = PROVIDERS[STATE.provider];
  const total = STATE.keyPool.filter(e => cfg.validate(e.key)).length;
  $('provider-label').textContent = cfg.label + (total > 1 ? ` [Key ${keyIdx + 1}/${total}]` : '');
}

/* ─── AI Dispatcher ───────────────────────────────────────── */
function callAI(provider, resumeText, userPrompt, apiKey) {
  const cfg = PROVIDERS[provider];
  return cfg.type === 'gemini'
    ? callGemini(resumeText, userPrompt, apiKey, cfg)
    : callOpenAICompat(resumeText, userPrompt, apiKey, cfg);
}

/* ─── System Prompt ───────────────────────────────────────── */
function buildSystem() {
  return `You are a world-class frontend engineer. Build a visually stunning, unique portfolio website.

OUTPUT FORMAT — STRICT RULE. Your ENTIRE response = only these 3 blocks, zero text outside them:
===HTML_START===
[body HTML only — no DOCTYPE/html/head/body tags]
===HTML_END===
===CSS_START===
[@import Google Fonts MUST be line 1, then all styles]
===CSS_END===
===JS_START===
[vanilla JS only]
===JS_END===

DESIGN RULES:
- CSS line 1: @import url('https://fonts.googleapis.com/css2?family=...')
- Define :root variables: --bg, --accent, --accent2, --text, --text-muted, --border, --gradient-hero, --gradient-accent, --font-heading, --font-body, --transition, --radius
- Pick a BOLD distinctive palette (NOT purple on white)
- Fonts by field: Tech→Space Grotesk+JetBrains Mono, Creative→Syne+Plus Jakarta Sans, Business→Raleway+DM Sans

BANNED: "Hi I'm [Name] a passionate developer", circular placeholders, "Let's Work Together", generic % skill bars.

SECTIONS (in order): fixed nav + blur, full-viewport hero, about + stat cards, skills by category, experience timeline, projects grid (2-col), contact + form, footer.

HERO: NAME huge (clamp(56px,9vw,110px)), pure-CSS decorative element, bio + 2 CTA buttons, scroll indicator.
EXPERIENCE: Centered timeline, alternating cards, glowing dot markers, company name in accent color.
PROJECTS: 2-col grid, unique gradient header per card, tech tag pills.

JS in DOMContentLoaded: nav scroll (.scrolled), hamburger, IntersectionObserver (.reveal/.reveal-left/.reveal-right→.visible), stagger delays, form success handler.
RESPONSIVE: 768px → 1-col, hamburger nav.`;
}

/* ─── User Prompt ─────────────────────────────────────────── */
function buildUser(resumeText, userPrompt) {
  return `Portfolio website for the person below. Use ALL real data from their resume.

RESUME:
${resumeText}

DESIGN: ${userPrompt}

Start output immediately with ===HTML_START===`;
}

/* ─── OpenAI-Compatible API Call ──────────────────────────── */
async function callOpenAICompat(resumeText, userPrompt, apiKey, cfg) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
  if (cfg === PROVIDERS.openrouter) {
    headers['HTTP-Referer'] = 'https://portfolio-forge.app';
    headers['X-Title']     = 'Portfolio Forge';
  }

  const res = await fetch(cfg.endpoint, {
    method: 'POST', headers,
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: buildSystem() },
        { role: 'user',   content: buildUser(resumeText, userPrompt) },
      ],
      max_tokens: 8000,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `API error (${res.status})`;
    if (res.status === 401)  throw new Error('Invalid API key — check it and try again.');
    if (res.status === 429 || msg.includes('rate_limit') || msg.includes('Rate limit'))
      throw new RateLimitError('Rate limit hit on this key.');
    if (res.status === 413 || msg.toLowerCase().includes('too large') || msg.toLowerCase().includes('context'))
      throw new Error('Resume text too large. It has been truncated — please try again.');
    throw new Error(msg.slice(0, 120));
  }

  const data   = await res.json();
  const aiText = data?.choices?.[0]?.message?.content || '';
  if (!aiText) throw new ParseError('Empty response from AI.');
  return parseAI(aiText);
}

/* ─── Gemini API Call ─────────────────────────────────────── */
async function callGemini(resumeText, userPrompt, apiKey, cfg) {
  const url = `${cfg.endpoint}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystem() }] },
      contents: [{ role: 'user', parts: [{ text: buildUser(resumeText, userPrompt) }] }],
      generationConfig: { maxOutputTokens: 8000, temperature: 0.8 },
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `Gemini error (${res.status})`;
    if (res.status === 403)  throw new Error('Gemini key invalid or not enabled in AI Studio.');
    if (res.status === 429 || msg.includes('RESOURCE_EXHAUSTED'))
      throw new RateLimitError('Gemini rate limit hit on this key.');
    throw new Error(msg.slice(0, 120));
  }

  const data   = await res.json();
  const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!aiText) throw new ParseError('Empty Gemini response.');
  return parseAI(aiText);
}

/* ─── Multi-Strategy Parser ───────────────────────────────── */
function parseAI(raw) {
  const src = raw.trim();
  const extract = (s, e, t) => {
    const si = t.indexOf(s), ei = t.indexOf(e);
    return (si === -1 || ei === -1) ? null : t.slice(si + s.length, ei).trim();
  };

  let html = extract('===HTML_START===', '===HTML_END===', src);
  let css  = extract('===CSS_START===',  '===CSS_END===',  src);
  let js   = extract('===JS_START===',   '===JS_END===',   src);

  if (!html) {
    const hm = src.match(/```html[\r\n]+([\s\S]*?)```/i);
    const cm = src.match(/```css[\r\n]+([\s\S]*?)```/i);
    const jm = src.match(/```(?:js|javascript)[\r\n]+([\s\S]*?)```/i);
    if (hm) { html = hm[1].trim(); css = cm?.[1]?.trim() || ''; js = jm?.[1]?.trim() || ''; }
  }
  if (!html) {
    const norm = src.replace(/[ \t]*===[ \t]*/g, '===');
    html = extract('===HTML_START===', '===HTML_END===', norm);
    css  = extract('===CSS_START===',  '===CSS_END===',  norm);
    js   = extract('===JS_START===',   '===JS_END===',   norm);
  }
  if (!html && (src.includes('<nav') || src.includes('<section'))) { html = src; css = ''; js = ''; }
  if (!html || html.length < 200) throw new ParseError('AI returned invalid code. Auto-retrying…');

  return { html: html || '', css: css || 'body{margin:0;font-family:sans-serif;}', js: js || '' };
}

/* ─── Preview Renderer ────────────────────────────────────── */
function renderPreview() {
  $('pif').srcdoc = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>My Portfolio</title><style>*,*::before,*::after{box-sizing:border-box}body{margin:0}${STATE.css}</style></head><body>${STATE.html}<script>try{${STATE.js}}catch(e){console.warn('[Portfolio JS]',e)}<\/script></body></html>`;
}

/* ─── Preview Device Toggle ───────────────────────────────── */
function setMode(m) {
  $('iw').classList.toggle('mobile', m === 'mobile');
  $('bdt').classList.toggle('active', m === 'desktop');
  $('bdm').classList.toggle('active', m === 'mobile');
}

/* ─── Download ZIP ────────────────────────────────────────── */
async function dlZip() {
  if (!STATE.html) { toast('Generate a portfolio first.', 'error'); return; }
  const zip = new JSZip();
  zip.file('index.html', `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>My Portfolio</title>\n<link rel="stylesheet" href="style.css"/>\n</head>\n<body>\n${STATE.html}\n<script src="script.js"><\/script>\n</body>\n</html>`);
  zip.file('style.css', STATE.css || '/* no styles */');
  zip.file('script.js', STATE.js  || '// no scripts');
  zip.file('README.md', `# My Portfolio\n\nGenerated by Portfolio Forge\n\n## Deploy\n- **Netlify Drop**: drag folder to app.netlify.com/drop\n- **GitHub Pages**: push to gh-pages branch\n- **Vercel**: run \`npx vercel\` in this folder\n\nGenerated: ${new Date().toLocaleString()}\n`);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'my-portfolio.zip' });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('Portfolio downloaded!', 'success');
}

/* ─── Code Modal ──────────────────────────────────────────── */
function openCode()  { if (!STATE.html) { toast('Generate a portfolio first.', 'error'); return; } $('code-modal').classList.add('open'); document.body.style.overflow = 'hidden'; switchTab('html'); }
function closeCode() { $('code-modal').classList.remove('open'); document.body.style.overflow = ''; }
function switchTab(t) {
  STATE.activeTab = t;
  ['html','css','js'].forEach(x => { const tab = $('tab-'+x); tab.classList.toggle('active', x===t); tab.setAttribute('aria-selected', x===t?'true':'false'); });
  $('code-display').textContent = ({html:STATE.html,css:STATE.css,js:STATE.js})[t]||'';
}
function copyCode() {
  navigator.clipboard.writeText(({html:STATE.html,css:STATE.css,js:STATE.js})[STATE.activeTab]||'').then(()=>{$('copy-btn').textContent='Copied!';setTimeout(()=>{$('copy-btn').textContent='Copy to Clipboard';},2000);});
}
document.addEventListener('keydown', e => { if (e.key==='Escape') closeCode(); });

/* ─── UI State Helpers ────────────────────────────────────── */
function setStep(n) {
  [1,2,3,4].forEach(i => {
    $('sn'+i).className = 'step-num'+(i===n?' active':i<n?' done':'');
    const c=$('sc'+i); if(c) c.className='step-conn'+(i<n?' done':'');
  });
}
function setStatus(m)   { $('status-line').textContent  = m; }
function setLoadStep(m) { $('loading-step').textContent = m; }
function stageSet(id, state) {
  const el = $(id), label = el.textContent.replace(/\[.+?\] /,'');
  const icons = {active:'[→]',done:'[✓]','':`[ ]`};
  el.textContent = (icons[state]||'[ ]')+' '+label;
  el.className   = 'stage'+(state?' '+state:'');
}

/* ─── Toast ───────────────────────────────────────────────── */
let _toastTimer;
function toast(msg, type='error') {
  const t=$('toast'); t.textContent=msg; t.className=`toast show ${type}`;
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>{t.className='toast';},4500);
}

/* ─── Utilities ───────────────────────────────────────────── */
function fmtBytes(b) { if(b<1024) return b+' B'; if(b<1024*1024) return (b/1024).toFixed(1)+' KB'; return (b/1024/1024).toFixed(1)+' MB'; }
function sleep(ms)   { return new Promise(r=>setTimeout(r,ms)); }

/* ─── Init ────────────────────────────────────────────────── */
renderKeyPool();
setStatus('Add at least one API key, then upload your resume.');
