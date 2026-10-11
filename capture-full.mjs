// Full-page capture that scrolls first so lazy images load.
// Usage: node capture-full.mjs <url> <out.png> [width=1440] [height=900]
import puppeteer from 'puppeteer';
const [url, out, w = 1440, h = 900] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  window.scrollTo(0, 0);
  document.querySelectorAll('img[loading="lazy"]').forEach(i => (i.loading = 'eager'));
  await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
});
await p.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;transition:none!important}' });
await new Promise(r => setTimeout(r, 1200));
await p.screenshot({ path: out, fullPage: true });
await b.close();
