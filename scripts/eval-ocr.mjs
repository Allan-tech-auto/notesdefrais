import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { chromium } from 'playwright';
import { fields, matches } from './ocr-comparison.mjs';
const fixtures = resolve(process.env.OCR_FIXTURES_DIR || 'tests/ocr/fixtures');
const expected = JSON.parse(await readFile(resolve(fixtures, 'expected.json'), 'utf8').catch(() => { throw new Error('Ajoutez fixtures/expected.json et vos tickets réels : voir tests/ocr/README.md.'); }));
const entries = Object.entries(expected);
if (!entries.length) throw new Error('Aucun ticket dans expected.json.');
for (const [file, truth] of entries) {
  const path = relative(fixtures, resolve(fixtures, file));
  if (path.startsWith('..') || isAbsolute(path)) throw new Error(`Chemin hors fixtures : ${file}`);
  if (fields.some(f => !(f in truth))) throw new Error(`Vérité terrain incomplète : ${file}`);
}
const url = new URL(process.env.OCR_URL || '');
if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('HTTPS requis hors localhost.');
if (!process.env.OCR_TOKEN) throw new Error('OCR_TOKEN requis.');
const html = await readFile('public/index.html', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.OCR_CHROMIUM_PATH || undefined });
const rows = [];
try {
  const page = await browser.newPage();
  await page.route('https://ocr-eval.invalid/', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.route('**/api/**', route => route.abort());
  await page.goto('https://ocr-eval.invalid/', { waitUntil: 'load', timeout: 30000 });
  for (const [file, truth] of entries) {
    const row = { file, expected: truth };
    try {
      const bytes = await readFile(resolve(fixtures, file));
      const image = process.env.OCR_INPUT_PREPROCESSED === '1' ? `data:image/${/\.png$/i.test(file) ? 'png' : /\.webp$/i.test(file) ? 'webp' : 'jpeg'};base64,${bytes.toString('base64')}` : await page.evaluate(async ({base64, name}) => {
        if (/\.pdf$/i.test(name)) {
          if (!window.pdfjsLib) throw new Error('PDF.js indisponible : vérifier accès au CDN du front.');
        }
        return await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Prétraitement interrompu : ' + document.getElementById('ocr-message').textContent)), 30000);
          runOCR = data => { clearTimeout(timer); resolve(data); };
          showError = message => { clearTimeout(timer); reject(new Error(message)); };
          const data = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          handlePhoto({target:{files:[new File([data], name, {type:/\.pdf$/i.test(name) ? 'application/pdf' : ''})]}});
        });
      }, { base64: bytes.toString('base64'), name: file });
      const body = JSON.stringify({image});
      row.requestBytes = Buffer.byteLength(body);
      const start = performance.now();
      const response = await fetch(url, { method:'POST', redirect:'error', headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OCR_TOKEN}`},body,signal:AbortSignal.timeout(90000) });
      row.durationMs = Math.round(performance.now() - start);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      row.actual = await response.json();
      row.results = Object.fromEntries(fields.map(f => [f, matches(f,row.actual[f],truth[f])]));
    } catch (error) { row.error = error.message; row.results = Object.fromEntries(fields.map(f => [f,false])); }
    rows.push(row);
    console.log(`Progression : ${rows.length}/${entries.length}${row.error ? ' (erreur)' : ''}`);
  }
} finally { await browser.close(); }
console.table(fields.map(field => ({champ:field, réussites:rows.filter(r=>r.results[field]).length, tickets:rows.length, précision:`${(100*rows.filter(r=>r.results[field]).length/rows.length).toFixed(1)} %`})));
const completed = rows.filter(r => typeof r.durationMs === 'number');
console.log('Latence API moyenne (ms) :', completed.length ? Math.round(completed.reduce((sum,r)=>sum+r.durationMs,0)/completed.length) : 'non mesurée');
console.log('Taille moyenne requête (octets) :', Math.round(rows.reduce((sum,r)=>sum+(r.requestBytes||0),0)/rows.length));
for (const row of rows) {
  if (row.error) console.log(row.file, row.error);
  else for (const field of fields) if (!row.results[field]) console.log(row.file, field, JSON.stringify({attendu:row.expected[field],obtenu:row.actual[field]}));
}
await writeFile('tests/ocr/results.json', JSON.stringify({at:new Date().toISOString(),inputPreprocessed:process.env.OCR_INPUT_PREPROCESSED === '1',rows},null,2));
if (rows.some(r=>r.error)) process.exitCode = 1;
