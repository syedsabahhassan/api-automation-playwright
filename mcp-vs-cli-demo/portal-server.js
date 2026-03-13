/**
 * Portal static server
 *
 * Serves the loan portal HTML at http://localhost:3001.
 * The portal talks to the mock API server at http://localhost:3000.
 *
 * Usage:
 *   node portal-server.js              # default port 3001
 *   PORTAL_PORT=8080 node portal-server.js
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT      = process.env.PORTAL_PORT || 3001;
const PORTAL_DIR = path.join(__dirname, 'portal');

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  // Health check for CI
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP' }));
    return;
  }

  // Default to index.html for SPA
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(PORTAL_DIR, urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback to index.html for client-side routing
      fs.readFile(path.join(PORTAL_DIR, 'index.html'), (err2, fallback) => {
        if (err2) { res.writeHead(500); res.end('Server error'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fallback);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`[portal-server] Loan portal running at http://localhost:${PORT}`);
});
