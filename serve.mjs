import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const ROOT = path.join(__dirname, 'site');

// Mirror the production headers from netlify.toml ("/*" block) so local previews enforce the same CSP.
const toml = fs.readFileSync(path.join(__dirname, 'netlify.toml'), 'utf8');
const siteBlock = toml.split('[[headers]]').find((b) => /for\s*=\s*"\/\*"/.test(b)) || '';
const siteHeaders = Object.fromEntries(
  [...siteBlock.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"(.*)"\s*$/gm)].filter(([, k]) => k !== 'for').map(([, k, v]) => [k, v])
);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(ROOT, urlPath.endsWith('/') ? urlPath + 'index.html' : (path.extname(urlPath) ? urlPath : urlPath + '/index.html'));
  // Refuse anything that resolves outside site/ (e.g. /../../etc/passwd)
  if (!path.resolve(filePath).startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mime[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }
    res.writeHead(200, { ...siteHeaders, 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`✓ CreativIT dev server running at http://localhost:${PORT}`);
});
