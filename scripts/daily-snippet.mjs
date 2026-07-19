#!/usr/bin/env node
// Daily training snippet emailer.
//
// Reads DATA straight out of IOR-Product-Training.html (single source of truth),
// picks a date-seeded random mix of training content, renders a branded HTML
// email and sends it via Resend.
//
// Usage:
//   RESEND_API_KEY=re_xxx node scripts/daily-snippet.mjs            # send
//   node scripts/daily-snippet.mjs --dry-run                        # write out/preview.html, no send
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
const SITE_URL = process.env.SITE_URL || 'https://ioresource-company.github.io/io_training/';
const DRY_RUN = process.argv.includes('--dry-run');

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

// ---------- build the day's mix ----------

const DATA = extractData(fs.readFileSync(HTML_PATH, 'utf8'));
const brands = DATA.brands;

const spotlight = pick(brands);
const talkingPoint = pick(spotlight.talkingPoints || []);
const objection = pick(spotlight.objections || []);

// global pools tagged with their brand
const allQuiz = brands.flatMap(b => (b.quiz || []).map(q => ({ ...q, brand: b.name })));
const allCards = brands.flatMap(b => (b.flashcards || []).map(c => ({ ...c, brand: b.name })));
const allScenarios = brands.flatMap(b => (b.scenarios || []).map(s => ({ ...s, brand: b.name })));

const quiz = pickN(allQuiz, 3);
const useScenario = dayNum % 2 === 1; // alternate: scenario one day, flashcards the next
const scenario = useScenario ? pick(allScenarios) : null;
const cards = useScenario ? [] : pickN(allCards, 2);

// ---------- render (inline styles only — email-client safe) ----------

const NAVY = '#09246B', BLUE = '#0073E6', TINT = '#E6F1FD', STEEL = '#5A6B7C', SILVER = '#D7DCE3', CLOUD = '#F4F6F9';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const letters = ['A', 'B', 'C', 'D'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const dateStr = today.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = today.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });

function card(title, inner, accent = BLUE) {
  return `<div style="background:#ffffff;border:1px solid ${SILVER};border-left:4px solid ${accent};border-radius:8px;padding:18px 20px;margin:0 0 16px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${BLUE};margin-bottom:8px;">${title}</div>
    ${inner}</div>`;
}

function quizBlock(q, idx) {
  const opts = q.o.map((o, i) =>
    `<div style="padding:6px 10px;margin:4px 0;background:${CLOUD};border:1px solid ${SILVER};border-radius:6px;font-size:14px;color:#1B2433;"><strong style="color:${NAVY};">${letters[i]}.</strong> ${esc(o)}</div>`).join('');
  return `<div style="margin:0 0 14px;">
    <div style="font-size:14px;font-weight:600;color:${NAVY};margin-bottom:6px;">Q${idx + 1} <span style="font-weight:400;color:${STEEL};">(${esc(q.brand)})</span> — ${esc(q.q)}</div>${opts}</div>`;
}

const answersHtml = [
  ...quiz.map((q, i) => `<p style="margin:0 0 8px;font-size:13px;color:#1B2433;"><strong style="color:${NAVY};">Q${i + 1}: ${letters[q.c]}</strong> — ${esc(q.e || q.o[q.c])}</p>`),
  ...(scenario ? [`<p style="margin:0 0 8px;font-size:13px;color:#1B2433;"><strong style="color:${NAVY};">Scenario: ${letters[scenario.c]}</strong> — ${esc(scenario.e || scenario.o[scenario.c])}</p>`] : []),
].join('');

const sections = [];

sections.push(card(`Brand spotlight — ${esc(spotlight.name)}`,
  `<div style="font-size:16px;font-weight:700;color:${NAVY};margin-bottom:4px;">${esc(spotlight.name)}</div>
   <div style="font-size:13px;color:${STEEL};margin-bottom:12px;">${esc(spotlight.tagline || '')}</div>
   <div style="font-size:14px;color:#1B2433;line-height:1.6;">${talkingPoint}</div>
   ${objection ? `<div style="margin-top:14px;padding:12px 14px;background:${TINT};border-radius:6px;">
     <div style="font-size:12px;font-weight:700;color:${NAVY};margin-bottom:4px;">Objection: &ldquo;${esc(objection.q)}&rdquo;</div>
     <div style="font-size:13px;color:#1B2433;line-height:1.55;">${esc(objection.a)}</div></div>` : ''}`, NAVY));

sections.push(card('Quick quiz — answers at the bottom, no peeking', quiz.map(quizBlock).join('')));

if (scenario) {
  sections.push(card(`Scenario — ${esc(scenario.brand)}`,
    `<div style="font-size:14px;color:#1B2433;line-height:1.6;margin-bottom:8px;">${esc(scenario.scenario)}</div>
     <div style="font-size:14px;font-weight:600;color:${NAVY};margin-bottom:6px;">${esc(scenario.q)}</div>
     ${scenario.o.map((o, i) => `<div style="padding:6px 10px;margin:4px 0;background:${CLOUD};border:1px solid ${SILVER};border-radius:6px;font-size:14px;"><strong style="color:${NAVY};">${letters[i]}.</strong> ${esc(o)}</div>`).join('')}`));
}

for (const c of cards) {
  sections.push(card(`Flashcard — ${esc(c.brand)}`,
    `<div style="font-size:14px;font-weight:600;color:${NAVY};margin-bottom:8px;">${esc(c.q)}</div>
     <div style="font-size:14px;color:#1B2433;line-height:1.55;">${esc(c.a)}</div>`));
}

sections.push(card('Answers', answersHtml, '#2E8B57'));

const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>IO Resource — Daily Product Training</title></head>
<body style="margin:0;padding:0;">
<div style="background:${CLOUD};padding:24px 12px;font-family:${FONT};">
<div style="max-width:640px;margin:0 auto;">
  <div style="background:${NAVY};border-radius:10px 10px 0 0;padding:22px 24px;">
    <div style="color:#ffffff;font-size:19px;font-weight:700;">IO<span style="color:${BLUE};">Resource</span> &mdash; Daily Product Training</div>
    <div style="color:#B8C4DF;font-size:13px;margin-top:4px;">${dateStr}</div>
  </div>
  <div style="background:${CLOUD};padding:20px 0 4px;">${sections.join('')}</div>
  <div style="background:#ffffff;border:1px solid ${SILVER};border-radius:0 0 10px 10px;padding:16px 24px;text-align:center;">
    <a href="${SITE_URL}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:6px;">Open the full training app</a>
    <div style="font-size:11px;letter-spacing:1.5px;color:${STEEL};margin-top:14px;text-transform:uppercase;">Supply. Configure. Support.</div>
  </div>
</div></div>
</body></html>`;

const subject = `IOR Daily Training — ${spotlight.name} spotlight + quiz (${shortDate})`;

// ---------- send ----------

const outDir = path.join(ROOT, 'out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'preview.html'), emailHtml);

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
  body: JSON.stringify({ from, to, subject, html: emailHtml }),
});
const body = await res.text();
if (!res.ok) { console.error(`Resend returned ${res.status}: ${body}`); process.exit(1); }
console.log(`Sent: ${subject}`);
console.log(body);
