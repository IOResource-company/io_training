#!/usr/bin/env node
// Daily training email.
//
// Curriculum:
//   - Most days: ONE brand in focus (rotating through DATA.brands in order) —
//     positioning, a slice of products/specs, verticals, talking points,
//     objections and a 3-question quiz on that brand only.
//   - Fridays: "general exam" — 8 questions across all brands + a scenario.
//
// Reads DATA straight out of IOR-Product-Training.html (single source of truth),
// renders a branded, dark-mode-resistant HTML email and sends it via Resend.
//
// Usage:
//   RESEND_API_KEY=re_xxx node scripts/daily-snippet.mjs            # send
//   node scripts/daily-snippet.mjs --dry-run                        # write out/preview.html, no send
//   node scripts/daily-snippet.mjs --dry-run --force-exam           # preview the exam format
//   node scripts/daily-snippet.mjs --dry-run --brand urovo          # preview a specific brand focus
//
// Env:
//   RESEND_API_KEY   required unless --dry-run
//   SNIPPET_TO       override recipient(s), comma-separated (default stephen.browne@ioresource.com)
//   SNIPPET_FROM     override sender (default onboarding@resend.dev)
//   SITE_URL         link to the full training app (default GitHub Pages URL)

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML_PATH = path.join(ROOT, 'IOR-Product-Training.html');
const SITE_URL = process.env.SITE_URL || 'https://io-training.vercel.app/IOR-Product-Training.html';
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_EXAM = process.argv.includes('--force-exam');
const FORCE_BRAND = (() => { const i = process.argv.indexOf('--brand'); return i > -1 ? process.argv[i + 1] : null; })();

// ---------- extract DATA from the training app ----------

function extractData(html) {
  const marker = 'const DATA =';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('const DATA = not found in training HTML');
  let i = html.indexOf('{', start + marker.length);
  const objStart = i;
  let depth = 0, inStr = null;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  if (depth !== 0) throw new Error('Unbalanced braces extracting DATA');
  const objText = html.slice(objStart, i + 1);
  return vm.runInNewContext(`(${objText})`, {}, { timeout: 5000 });
}

// ---------- date-seeded RNG (same email if re-run same day) ----------

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const today = new Date();
const dayNum = Math.floor(today.getTime() / 86400000);
const rand = mulberry32(dayNum * 2654435761);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
function pickN(arr, n) {
  const copy = [...arr], out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
}

// ---------- curriculum: which day is this? ----------

// dayNum % 7: 0=Thu 1=Fri 2=Sat 3=Sun 4=Mon 5=Tue 6=Wed  (epoch was a Thursday)
const isExamDay = FORCE_EXAM || (!FORCE_BRAND && dayNum % 7 === 1);

// Brand rotation counts only study days (Fridays are exams and don't consume
// a brand), so every brand gets equal airtime.
const fridaysSoFar = Math.floor((dayNum - 1) / 7) + 1;
const studyIndex = dayNum - fridaysSoFar;

const DATA = extractData(fs.readFileSync(HTML_PATH, 'utf8'));
const brands = DATA.brands;

const focus = FORCE_BRAND
  ? brands.find(b => b.slug === FORCE_BRAND) || brands[0]
  : brands[studyIndex % brands.length];

// ---------- render helpers (inline styles only — email-client safe) ----------

const NAVY = '#09246B', BLUE = '#0073E6', TINT = '#E6F1FD', STEEL = '#5A6B7C', SILVER = '#D7DCE3', CLOUD = '#F4F6F9';
const TEXT = '#1B2433';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const letters = ['A', 'B', 'C', 'D'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Outlook inverts background-color but not background-image, so every
// background is also painted with a single-colour linear-gradient.
const bg = (c) => `background-color:${c};background-image:linear-gradient(${c},${c});`;

// DATA positioning/talking-point strings carry light HTML (<p>, <strong>).
// Emails can't style nested <p> reliably, so flatten paragraphs to <br><br>.
const flattenHtml = (s) => String(s || '').replace(/<p>/g, '').replace(/<\/p>/g, '<br><br>').replace(/(<br><br>)+$/, '');

const dateStr = today.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = today.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });

function card(title, inner, accent = BLUE) {
  return `<div class="card" style="${bg('#ffffff')}border:1px solid ${SILVER};border-left:4px solid ${accent};border-radius:8px;padding:18px 20px;margin:0 0 16px;">
    <div class="blue" style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BLUE};margin-bottom:8px;">${title}</div>
    ${inner}</div>`;
}

// Interactive quiz lives on the site (daily-quiz.html + today.json published
// with each send): answers turn green/red in place there — email clients
// can't do that inline (Outlook strips scripts and :checked CSS).
const QUIZ_URL = SITE_URL.replace(/[^/]*$/, '') + 'daily-quiz.html';

const quizButton =
  `<div style="text-align:center;margin:6px 0 2px;">
    <a href="${QUIZ_URL}" class="btn" style="display:inline-block;${bg(BLUE)}color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:6px;">Take today&rsquo;s quiz &mdash; instant answers &rarr;</a>
  </div>`;

// Box styling lives on a <div> wrapper: classic Outlook (Word engine) ignores
// display:block on <a>, so a bare styled anchor collapses options onto one
// line. A div per option guarantees one row per answer everywhere.
const optRow = (label, text, href) => {
  const boxStyle = `padding:6px 10px;margin:4px 0;${bg(CLOUD)}border:1px solid ${SILVER};border-radius:6px;font-size:14px;color:${TEXT};`;
  const inner = `<strong class="navy" style="color:${NAVY};">${label}.</strong> ${esc(text)}`;
  return href
    ? `<div class="opt" style="${boxStyle}"><a class="txt" href="${href.replace(/&/g, '&amp;')}" style="display:block;color:${TEXT};text-decoration:none;">${inner}</a></div>`
    : `<div class="opt txt" style="${boxStyle}">${inner}</div>`;
};

function quizBlock(q, idx, showBrand) {
  const brandTag = showBrand ? ` <span class="muted" style="font-weight:400;color:${STEEL};">(${esc(q.brand)})</span>` : '';
  return `<div style="margin:0 0 14px;">
    <div class="navy" style="font-size:14px;font-weight:600;color:${NAVY};margin-bottom:6px;">Q${idx + 1}${brandTag} — ${esc(q.q)}</div>
    ${q.o.map((o, i) => optRow(letters[i], o)).join('')}</div>`;
}

const objectionBox = (ob) =>
  `<div class="tint" style="margin:0 0 10px;padding:12px 14px;${bg(TINT)}border-radius:6px;">
    <div class="navy" style="font-size:12px;font-weight:700;color:${NAVY};margin-bottom:4px;">&ldquo;${esc(ob.q)}&rdquo;</div>
    <div class="txt" style="font-size:13px;color:${TEXT};line-height:1.55;">${esc(ob.a)}</div></div>`;

const answerLine = (label, q) =>
  `<p class="txt" style="margin:0 0 8px;font-size:13px;color:${TEXT};"><strong class="navy" style="color:${NAVY};">${label}: ${letters[q.c]}</strong> — ${esc(q.e || q.o[q.c])}</p>`;

// ---------- compose the day's email ----------

const sections = [];
let subject, headline, quizData;

// Plain-text alternative. Resend would otherwise auto-generate one that dumps
// every instant-answer URL inline — unreadable. Ours carries no per-option
// links; Outlook's "view in a web browser" and text-only clients get this.
const plain = (s) => String(s || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>\s*/gi, '\n\n')
  .replace(/<[^>]+>/g, '')
  .replace(/\n{3,}/g, '\n\n').trim()
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&rsquo;/g, '’')
  .replace(/&bull;/g, '•').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ');
const tl = [];
const T = (s = '') => tl.push(s);
const RULE = '----------------------------------------';

if (isExamDay) {
  // ----- Friday: general exam across every brand -----
  const allQuiz = brands.flatMap(b => (b.quiz || []).map(q => ({ ...q, brand: b.name })));
  const allScenarios = brands.flatMap(b => (b.scenarios || []).map(s => ({ ...s, brand: b.name })));
  const exam = pickN(allQuiz, 8);
  const scenario = pick(allScenarios);

  subject = `IOR Weekly Exam — all brands (${shortDate})`;
  headline = 'Weekly General Exam';

  sections.push(card('This week’s exam',
    `<div class="txt" style="font-size:14px;color:${TEXT};line-height:1.6;margin-bottom:10px;">Eight questions across the whole range, plus one scenario. Take it interactively — answers turn green or red as you tap, score at the top. Or read on and check yourself against the answers at the bottom.</div>
     ${quizButton}`, NAVY));

  sections.push(card('Questions', exam.map((q, i) => quizBlock(q, i, true)).join('')));

  sections.push(card(`Scenario — ${esc(scenario.brand)}`,
    `<div class="txt" style="font-size:14px;color:${TEXT};line-height:1.6;margin-bottom:8px;">${esc(scenario.scenario)}</div>
     <div class="navy" style="font-size:14px;font-weight:600;color:${NAVY};margin-bottom:6px;">${esc(scenario.q)}</div>
     ${scenario.o.map((o, i) => optRow(letters[i], o)).join('')}`));

  quizData = {
    d: dayNum, mode: 'exam', date: dateStr,
    questions: [
      ...exam.map(q => ({ q: q.q, o: q.o, c: q.c, e: q.e || '', brand: q.brand })),
      { scenario: scenario.scenario, q: scenario.q, o: scenario.o, c: scenario.c, e: scenario.e || '', brand: scenario.brand },
    ],
  };

  sections.push(card('Answers',
    exam.map((q, i) => answerLine(`Q${i + 1}`, q)).join('') + answerLine('Scenario', scenario), '#2E8B57'));

  // plain-text version
  T(`IOResource — Weekly General Exam`); T(dateStr); T();
  T(`Eight questions across the whole range, plus one scenario.`);
  T(`Answers at the bottom. Score yourself out of 9.`);
  T(`Full training app: ${SITE_URL}`); T(); T(RULE); T();
  exam.forEach((q, i) => {
    T(`Q${i + 1} (${q.brand}) — ${plain(q.q)}`);
    q.o.forEach((o, j) => T(`  ${letters[j]}. ${plain(o)}`));
    T();
  });
  T(`SCENARIO (${scenario.brand})`); T(plain(scenario.scenario)); T(plain(scenario.q));
  scenario.o.forEach((o, j) => T(`  ${letters[j]}. ${plain(o)}`)); T(); T(RULE); T();
  T('ANSWERS');
  exam.forEach((q, i) => T(`Q${i + 1}: ${letters[q.c]} — ${plain(q.e || q.o[q.c])}`));
  T(`Scenario: ${letters[scenario.c]} — ${plain(scenario.e || scenario.o[scenario.c])}`);

} else {
  // ----- Study day: one brand in focus, module-style -----
  const products = pickN(focus.products || [], Math.min(2, (focus.products || []).length));
  const talkingPoints = pickN(focus.talkingPoints || [], 2);
  const objections = pickN(focus.objections || [], 2);
  const quiz = pickN((focus.quiz || []).map(q => ({ ...q, brand: focus.name })), 3);
  const flashcard = pick(focus.flashcards || []);

  subject = `IOR Daily Training — Focus: ${focus.name} (${shortDate})`;
  headline = `Brand Focus — ${focus.name}`;

  sections.push(card(`Today’s brand — ${esc(focus.name)}`,
    `<div class="navy" style="font-size:18px;font-weight:700;color:${NAVY};margin-bottom:2px;">${esc(focus.name)}</div>
     <div class="muted" style="font-size:13px;color:${STEEL};margin-bottom:12px;">${esc(focus.tagline || '')}</div>
     <div class="txt" style="font-size:14px;color:${TEXT};line-height:1.6;">${flattenHtml(focus.positioning)}</div>`, NAVY));

  if (products.length) {
    sections.push(card('Products to know', products.map(p =>
      `<div style="margin:0 0 16px;">
        <div class="navy" style="font-size:15px;font-weight:700;color:${NAVY};">${esc(p.name)}</div>
        <div class="txt" style="font-size:13px;color:${TEXT};margin:2px 0 8px;line-height:1.5;">${esc(p.what || '')}</div>
        ${(p.specs || []).map(s => `<div class="opt txt" style="padding:5px 10px;margin:3px 0;${bg(CLOUD)}border:1px solid ${SILVER};border-radius:6px;font-size:13px;color:${TEXT};"><strong class="navy" style="color:${NAVY};">${esc(s.k)}:</strong> ${esc(s.v)}</div>`).join('')}
        ${p.use ? `<div class="muted" style="font-size:12px;color:${STEEL};margin-top:6px;"><em>Where it wins: ${esc(p.use)}</em></div>` : ''}
      </div>`).join('')));
  }

  if (focus.verticals?.length) {
    sections.push(card('Where it fits',
      focus.verticals.map(v => `<div class="txt" style="font-size:13px;color:${TEXT};line-height:1.55;margin:0 0 6px;">&bull; ${esc(v)}</div>`).join('')));
  }

  if (talkingPoints.length) {
    sections.push(card('Talking points',
      talkingPoints.map(tp => `<div class="txt" style="font-size:14px;color:${TEXT};line-height:1.6;margin:0 0 10px;">${flattenHtml(tp)}</div>`).join('')));
  }

  if (objections.length) {
    sections.push(card('Objection handling', objections.map(objectionBox).join('')));
  }

  sections.push(card(`Quick quiz — ${esc(focus.name)} only`,
    quiz.map((q, i) => quizBlock(q, i, false)).join('') + quizButton));

  quizData = {
    d: dayNum, mode: 'study', brand: focus.name, date: dateStr,
    questions: quiz.map(q => ({ q: q.q, o: q.o, c: q.c, e: q.e || '', brand: focus.name })),
  };

  if (flashcard) {
    sections.push(card('One to remember',
      `<div class="navy" style="font-size:14px;font-weight:600;color:${NAVY};margin-bottom:6px;">${esc(flashcard.q)}</div>
       <div class="txt" style="font-size:14px;color:${TEXT};line-height:1.55;">${esc(flashcard.a)}</div>`));
  }

  sections.push(card('Answers', quiz.map((q, i) => answerLine(`Q${i + 1}`, q)).join(''), '#2E8B57'));

  // plain-text version
  T(`IOResource — Brand Focus: ${focus.name}`); T(dateStr); T();
  T(`${focus.name} — ${plain(focus.tagline)}`); T();
  T(plain(focus.positioning)); T();
  T(`Full training app: ${SITE_URL}`); T(); T(RULE); T();
  if (products.length) {
    T('PRODUCTS TO KNOW'); T();
    for (const p of products) {
      T(`${p.name} — ${plain(p.what)}`);
      (p.specs || []).forEach(s => T(`  ${plain(s.k)}: ${plain(s.v)}`));
      if (p.use) T(`  Where it wins: ${plain(p.use)}`);
      T();
    }
  }
  if (focus.verticals?.length) {
    T('WHERE IT FITS');
    focus.verticals.forEach(v => T(`  • ${plain(v)}`)); T();
  }
  if (talkingPoints.length) {
    T('TALKING POINTS');
    talkingPoints.forEach(tp => T(`  • ${plain(tp)}`)); T();
  }
  if (objections.length) {
    T('OBJECTION HANDLING');
    objections.forEach(ob => { T(`  “${plain(ob.q)}”`); T(`  ${plain(ob.a)}`); T(); });
  }
  T(`QUICK QUIZ — ${focus.name} only (answers below)`); T();
  quiz.forEach((q, i) => {
    T(`Q${i + 1} — ${plain(q.q)}`);
    q.o.forEach((o, j) => T(`  ${letters[j]}. ${plain(o)}`));
    T();
  });
  if (flashcard) { T('ONE TO REMEMBER'); T(`  ${plain(flashcard.q)}`); T(`  ${plain(flashcard.a)}`); T(); }
  T(RULE); T();
  T('ANSWERS');
  quiz.forEach((q, i) => T(`Q${i + 1}: ${letters[q.c]} — ${plain(q.e || q.o[q.c])}`));
}

// ---------- colour re-assertions for dark mode ----------
// - @media (prefers-color-scheme: dark): Apple Mail & friends
// - [data-ogsc] (text) / [data-ogsb] (backgrounds): Outlook.com / new Outlook dark mode

const darkModeCss = `
  :root { color-scheme: light; supported-color-schemes: light; }
  @media (prefers-color-scheme: dark) {
    body, .page { background: ${CLOUD} !important; }
    .card, .foot { background: #ffffff !important; }
    .opt { background: ${CLOUD} !important; }
    .tint { background: ${TINT} !important; }
    .hdr { background: ${NAVY} !important; }
    .txt { color: ${TEXT} !important; }
    .navy { color: ${NAVY} !important; }
    .muted { color: ${STEEL} !important; }
    .blue { color: ${BLUE} !important; }
    .hdr-t { color: #ffffff !important; }
    .hdr-d { color: #B8C4DF !important; }
    .btn { background: ${BLUE} !important; color: #ffffff !important; }
  }
  [data-ogsb] body, [data-ogsb] .page { background: ${CLOUD} !important; }
  [data-ogsb] .card, [data-ogsb] .foot { background: #ffffff !important; }
  [data-ogsb] .opt { background: ${CLOUD} !important; }
  [data-ogsb] .tint { background: ${TINT} !important; }
  [data-ogsb] .hdr { background: ${NAVY} !important; }
  [data-ogsb] .btn { background: ${BLUE} !important; }
  [data-ogsc] .txt { color: ${TEXT} !important; }
  [data-ogsc] .navy { color: ${NAVY} !important; }
  [data-ogsc] .muted { color: ${STEEL} !important; }
  [data-ogsc] .blue { color: ${BLUE} !important; }
  [data-ogsc] .hdr-t { color: #ffffff !important; }
  [data-ogsc] .hdr-d { color: #B8C4DF !important; }
  [data-ogsc] .btn { color: #ffffff !important; }
`;

const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>IO Resource — Daily Product Training</title>
<style>${darkModeCss}</style></head>
<body style="margin:0;padding:0;">
<div class="page" style="${bg(CLOUD)}padding:24px 12px;font-family:${FONT};">
<div style="max-width:640px;margin:0 auto;">
  <div class="hdr" style="${bg(NAVY)}border-radius:10px 10px 0 0;padding:22px 24px;">
    <div class="hdr-t" style="color:#ffffff;font-size:19px;font-weight:700;">IO<span class="blue" style="color:${BLUE};">Resource</span> &mdash; ${headline}</div>
    <div class="hdr-d" style="color:#B8C4DF;font-size:13px;margin-top:4px;">${dateStr}</div>
    <div style="margin-top:10px;"><a href="${SITE_URL}" class="hdr-t" style="color:#ffffff;font-size:13px;font-weight:600;text-decoration:underline;">Open the full training app &rarr;</a></div>
  </div>
  <div style="padding:20px 0 4px;">${sections.join('')}</div>
  <div class="foot" style="${bg('#ffffff')}border:1px solid ${SILVER};border-radius:0 0 10px 10px;padding:16px 24px;text-align:center;">
    <a href="${SITE_URL}" class="btn" style="display:inline-block;${bg(BLUE)}color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:6px;">Open the full training app</a>
    <div class="muted" style="font-size:11px;letter-spacing:1.5px;color:${STEEL};margin-top:14px;text-transform:uppercase;">Supply. Configure. Support.</div>
  </div>
</div></div>
</body></html>`;

// ---------- send ----------

const emailText = tl.join('\n') + `\n\n${RULE}\nOpen the full training app: ${SITE_URL}\nSupply. Configure. Support.\n`;

const outDir = path.join(ROOT, 'out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'preview.html'), emailHtml);
fs.writeFileSync(path.join(outDir, 'preview.txt'), emailText);
// published alongside the site so daily-quiz.html can render today's questions
fs.writeFileSync(path.join(ROOT, 'today.json'), JSON.stringify(quizData, null, 1));

if (DRY_RUN) {
  console.log(`Dry run — wrote out/preview.html\nSubject: ${subject}`);
  process.exit(0);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error('RESEND_API_KEY not set'); process.exit(1); }

const to = (process.env.SNIPPET_TO || 'stephen.browne@ioresource.com').split(',').map(s => s.trim()).filter(Boolean);
const from = process.env.SNIPPET_FROM || 'IO Resource Training <onboarding@resend.dev>';

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from, to, subject, html: emailHtml, text: emailText }),
});
const body = await res.text();
if (!res.ok) { console.error(`Resend returned ${res.status}: ${body}`); process.exit(1); }
console.log(`Sent: ${subject}`);
console.log(body);
