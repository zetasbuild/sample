import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API status check
  if (reqUrl.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', proxySupported: true }));
    return;
  }

  // Proxy endpoint to bypass X-Frame-Options and CSP headers
  if (reqUrl.pathname === '/proxy') {
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url query parameter');
      return;
    }

    let parsedTarget;
    try {
      parsedTarget = new URL(target.startsWith('http') ? target : `https://${target}`);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid URL');
      return;
    }

    try {
      const response = await fetch(parsedTarget.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow'
      });

      const contentType = response.headers.get('content-type') || 'text/html';

      // Forward status code
      res.statusCode = response.status;
      res.setHeader('Content-Type', contentType);
      // Explicitly omit X-Frame-Options and Content-Security-Policy

      if (contentType.includes('text/html')) {
        let html = await response.text();
        const baseTag = `<base href="${response.url || parsedTarget.toString()}">`;
        
        // Inject <base> tag right after <head> or at the top if no <head>
        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
        } else {
          html = `${baseTag}${html}`;
        }

        res.end(html);
      } else {
        const buffer = Buffer.from(await response.arrayBuffer());
        res.end(buffer);
      }
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'text/html' });
      res.end(`
        <div style="font-family:sans-serif;padding:2rem;text-align:center;color:#333;">
          <h2>Unable to load page via proxy</h2>
          <p>${err.message}</p>
          <a href="${parsedTarget.toString()}" target="_blank" style="display:inline-block;margin-top:1rem;padding:8px 16px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none;">Open Directly in New Tab</a>
        </div>
      `);
    }
    return;
  }

  // Static file serving
  let filePath = path.join(__dirname, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
  
  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const data = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

