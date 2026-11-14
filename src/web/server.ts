import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const WEB_PORT = process.env.WEB_PORT ? parseInt(process.env.WEB_PORT, 10) : 3000;
export const WEB_HOST = process.env.WEB_HOST || '0.0.0.0';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

/**
 * Finds the dist directory containing the built web client assets.
 */
function getDistDir(): string {
  if (process.env.DIST_DIR && fs.existsSync(process.env.DIST_DIR)) {
    return process.env.DIST_DIR;
  }
  // Try relative to current file or process.cwd()
  const candidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }

  return path.resolve(process.cwd(), 'dist');
}

/**
 * Creates an HTTP static file server serving the single-page application (SPA).
 */
export function createWebServer(distDir: string = getDistDir()): http.Server {
  return http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let reqPath = decodeURIComponent(url.pathname);
    if (reqPath === '/') {
      reqPath = '/index.html';
    }

    let filePath = path.join(distDir, reqPath);

    // Prevent directory traversal attacks
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // Check if the requested file exists
    fs.stat(filePath, (err, stats) => {
      // If file doesn't exist and request has no extension, fallback to index.html for SPA routing
      if (err || !stats.isFile()) {
        const ext = path.extname(reqPath);
        if (!ext || ext === '.html') {
          filePath = path.join(distDir, 'index.html');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
      }

      fs.stat(filePath, (err2, finalStats) => {
        if (err2 || !finalStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Web app build not found. Please run "npm run build" first.');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Cache static immutable assets aggressively; index.html no-cache
        const isImmutable = filePath.includes('assets') && ext !== '.html';
        const cacheControl = isImmutable
          ? 'public, max-age=31536000, immutable'
          : 'no-cache';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': finalStats.size,
          'Cache-Control': cacheControl
        });

        if (req.method === 'HEAD') {
          res.end();
          return;
        }

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', streamErr => {
          console.error('File stream error:', streamErr);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
          }
        });
      });
    });
  });
}

/**
 * Starts the Web server.
 */
export function startWebServer(
  port: number = WEB_PORT,
  host: string = WEB_HOST,
  distDir: string = getDistDir()
): http.Server {
  const srv = createWebServer(distDir);
  srv.listen(port, host, () => {
    console.log(`Ordomatics Web App listening on http://${host}:${port}`);
  });
  return srv;
}

// Direct execution
const isDirectExecution = () => {
  if (!process.argv[1]) return false;
  try {
    const currentFilePath = fileURLToPath(import.meta.url).toLowerCase().replace(/\\/g, '/');
    const executedFilePath = process.argv[1].toLowerCase().replace(/\\/g, '/');
    return currentFilePath === executedFilePath;
  } catch {
    return false;
  }
};

if (isDirectExecution() && process.env.NODE_ENV !== 'test') {
  startWebServer(WEB_PORT, WEB_HOST);
}
