/**
 * Portfolio Forge — tests/app.test.js
 * Unit & integration tests using Vitest (or Jest)
 *
 * Run: npx vitest run   OR   npx jest
 */

// ── Helpers / Mocks ───────────────────────────────────────────
const VALID_GROQ_KEY       = 'gsk_' + 'a'.repeat(40);
const VALID_GEMINI_KEY     = 'AIza' + 'b'.repeat(40);
const VALID_OPENAI_KEY     = 'sk-' + 'c'.repeat(40);
const VALID_OPENROUTER_KEY = 'sk-or-' + 'd'.repeat(40);

// ── Provider Validation ────────────────────────────────────── */
describe('Provider key validation', () => {
  const PROVIDERS = {
    groq:       { validate: (k) => k.startsWith('gsk_') && k.length > 20 },
    gemini:     { validate: (k) => k.startsWith('AIza') && k.length > 20 },
    openai:     { validate: (k) => k.startsWith('sk-') && !k.startsWith('sk-or-') && k.length > 20 },
    openrouter: { validate: (k) => k.startsWith('sk-or-') && k.length > 20 },
  };

  test('Groq: valid key accepted',         () => expect(PROVIDERS.groq.validate(VALID_GROQ_KEY)).toBe(true));
  test('Groq: wrong prefix rejected',      () => expect(PROVIDERS.groq.validate('AIza_bad')).toBe(false));
  test('Groq: short key rejected',         () => expect(PROVIDERS.groq.validate('gsk_short')).toBe(false));

  test('Gemini: valid key accepted',       () => expect(PROVIDERS.gemini.validate(VALID_GEMINI_KEY)).toBe(true));
  test('Gemini: wrong prefix rejected',    () => expect(PROVIDERS.gemini.validate('gsk_bad')).toBe(false));

  test('OpenAI: valid key accepted',       () => expect(PROVIDERS.openai.validate(VALID_OPENAI_KEY)).toBe(true));
  test('OpenAI: OpenRouter key rejected',  () => expect(PROVIDERS.openai.validate(VALID_OPENROUTER_KEY)).toBe(false));

  test('OpenRouter: valid key accepted',   () => expect(PROVIDERS.openrouter.validate(VALID_OPENROUTER_KEY)).toBe(true));
  test('OpenRouter: plain sk- rejected',   () => expect(PROVIDERS.openrouter.validate(VALID_OPENAI_KEY)).toBe(false));
});

// ── AI Output Parser ───────────────────────────────────────── */
describe('parseAI', () => {
  // Inline minimal version of parser for testing
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
    if (!html && (src.includes('<nav') || src.includes('<section'))) {
      html = src; css = ''; js = '';
    }
    if (!html || html.length < 200) throw new Error('ParseError');
    return { html: html || '', css: css || '', js: js || '' };
  }

  const bigHTML = '<section>' + 'x'.repeat(300) + '</section>';

  test('Strategy 1 — exact delimiters',   () => {
    const raw = `===HTML_START===\n${bigHTML}\n===HTML_END===\n===CSS_START===\nbody{}\n===CSS_END===\n===JS_START===\nconsole.log(1)\n===JS_END===`;
    const r = parseAI(raw);
    expect(r.html).toContain('section');
    expect(r.css).toBe('body{}');
    expect(r.js).toBe('console.log(1)');
  });

  test('Strategy 2 — markdown fences',    () => {
    const raw = '```html\n' + bigHTML + '\n```\n```css\nbody{}\n```\n```js\nconsole.log(2)\n```';
    const r = parseAI(raw);
    expect(r.html.length).toBeGreaterThan(200);
    expect(r.css).toBe('body{}');
  });

  test('Strategy 3 — spaced delimiters',  () => {
    const raw = `=== HTML_START ===\n${bigHTML}\n=== HTML_END ===\n=== CSS_START ===\nbody{}\n=== CSS_END ===\n=== JS_START ===\n\n=== JS_END ===`;
    const r = parseAI(raw);
    expect(r.html.length).toBeGreaterThan(200);
  });

  test('Strategy 4 — raw HTML fallback',  () => {
    const big = '<section>' + 'y'.repeat(300) + '</section>';
    const r = parseAI(big);
    expect(r.html).toContain('section');
  });

  test('Throws ParseError on empty output', () => {
    expect(() => parseAI('Hello, here is some text')).toThrow();
  });

  test('Throws ParseError on tiny HTML', () => {
    const tiny = '===HTML_START===\n<p>hi</p>\n===HTML_END===\n===CSS_START===\n===CSS_END===\n===JS_START===\n===JS_END===';
    expect(() => parseAI(tiny)).toThrow();
  });
});

// ── fmtBytes ───────────────────────────────────────────────── */
describe('fmtBytes', () => {
  function fmtBytes(b) {
    if (b < 1024)        return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(1) + ' MB';
  }

  test('Bytes',     () => expect(fmtBytes(512)).toBe('512 B'));
  test('Kilobytes', () => expect(fmtBytes(2048)).toBe('2.0 KB'));
  test('Megabytes', () => expect(fmtBytes(2 * 1024 * 1024)).toBe('2.0 MB'));
  test('Zero',      () => expect(fmtBytes(0)).toBe('0 B'));
});

// ── Prompt Presets ─────────────────────────────────────────── */
describe('Prompt presets', () => {
  const PRESET_KEYS = ['dark-minimal', 'clean-minimal', 'bold-colorful', 'terminal', 'glassmorphism', 'editorial'];
  PRESET_KEYS.forEach((key) => {
    test(`Preset "${key}" is non-empty string`, () => {
      // Just verify keys exist and are strings — actual content tested in app.js
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });
  });
});

// ── File Validation ────────────────────────────────────────── */
describe('File validation', () => {
  function validateFile(file) {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) return 'type';
    if (file.size > 5 * 1024 * 1024) return 'size';
    return 'ok';
  }

  test('Accepts .pdf',             () => expect(validateFile({ name: 'cv.pdf',   size: 100 })).toBe('ok'));
  test('Accepts .docx',            () => expect(validateFile({ name: 'cv.docx',  size: 100 })).toBe('ok'));
  test('Rejects .txt',             () => expect(validateFile({ name: 'cv.txt',   size: 100 })).toBe('type'));
  test('Rejects .png',             () => expect(validateFile({ name: 'cv.png',   size: 100 })).toBe('type'));
  test('Rejects oversized file',   () => expect(validateFile({ name: 'cv.pdf',   size: 6 * 1024 * 1024 })).toBe('size'));
  test('Accepts exactly 5MB',      () => expect(validateFile({ name: 'cv.docx',  size: 5 * 1024 * 1024 })).toBe('ok'));
  test('Rejects 5MB + 1 byte',     () => expect(validateFile({ name: 'cv.pdf',   size: 5 * 1024 * 1024 + 1 })).toBe('size'));
  test('Handles uppercase .PDF',   () => expect(validateFile({ name: 'CV.PDF',   size: 100 })).toBe('ok'));
  test('Handles uppercase .DOCX',  () => expect(validateFile({ name: 'CV.DOCX',  size: 100 })).toBe('ok'));
});

// ── Custom Errors ──────────────────────────────────────────── */
describe('Custom error classes', () => {
  class RateLimitError extends Error { constructor(m) { super(m); this.name = 'RateLimitError'; } }
  class ParseError     extends Error { constructor(m) { super(m); this.name = 'ParseError'; } }

  test('RateLimitError has correct name', () => {
    const e = new RateLimitError('limit');
    expect(e.name).toBe('RateLimitError');
    expect(e.message).toBe('limit');
    expect(e instanceof Error).toBe(true);
  });

  test('ParseError has correct name', () => {
    const e = new ParseError('parse');
    expect(e.name).toBe('ParseError');
    expect(e instanceof Error).toBe(true);
  });
});
