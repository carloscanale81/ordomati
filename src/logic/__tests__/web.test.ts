import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { createWebServer } from '../../web/server';

test('Web Server: Static SPA file serving suite', async (t) => {
  const distDir = path.resolve(process.cwd(), 'dist');
  const webServer = createWebServer(distDir);

  await new Promise<void>(resolve => {
    webServer.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = webServer.address() as any;
  const port = addr.port;

  t.after(() => {
    (webServer as any).closeAllConnections?.();
    webServer.close();
  });

  // Test 1: GET / returns 200 with HTML content
  await t.test('GET / returns 200 with index.html', async () => {
    const res = await new Promise<{ status: number; text: string; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/`, res => {
        let text = '';
        res.on('data', chunk => (text += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 200, text, headers: res.headers }));
      }).on('error', reject);
    });

    assert.equal(res.status, 200);
    assert.ok(res.text.includes('Ordomática'));
    assert.ok(res.text.includes('<div id="root"></div>'));
  });

  // Test 2: SPA fallback for arbitrary client routes
  await t.test('GET /unknown-route falls back to 200 with index.html for SPA', async () => {
    const res = await new Promise<{ status: number; text: string }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/phase/aggregation`, res => {
        let text = '';
        res.on('data', chunk => (text += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 200, text }));
      }).on('error', reject);
    });

    assert.equal(res.status, 200);
    assert.ok(res.text.includes('Ordomática'));
  });
});
