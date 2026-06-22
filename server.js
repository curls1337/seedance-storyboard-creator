const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // 1. Handle Proxy Route to bypass browser CORS policies
  if (req.url.startsWith('/proxy')) {
    const targetUrl = req.headers['x-target-url'];
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing x-target-url header' }));
      return;
    }

    // Clone headers and remove host/connection to avoid target mismatches
    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['x-target-url'];
    delete headers['connection'];

    const parsedUrl = new URL(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: headers
    };

    const clientModule = parsedUrl.protocol === 'https:' ? https : http;
    const clientReq = clientModule.request(options, (clientRes) => {
      // Forward the status code and headers back to the browser
      res.writeHead(clientRes.statusCode, clientRes.headers);
      clientRes.pipe(res);
    });

    clientReq.on('error', (err) => {
      console.error('Proxy Error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy request failed', details: err.message }));
    });

    req.pipe(clientReq);
    return;
  }

  // 2. Serve Static Web Files (index.html, styles.css, app.js, etc.)
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`CORS Proxy & Web Server running at http://localhost:${PORT}/`);
});
