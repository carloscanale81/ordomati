import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiServer } from '../../api/server';
import { createDefaultDataset } from '../index';

const makeRequest = (
  server: http.Server,
  path: string,
  method: string = 'GET',
  body?: any
): Promise<{ status: number; data: any }> => {
  return new Promise((resolve, reject) => {
    const address = server.address() as any;
    const port = address.port;

    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        agent: false,
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'close',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      res => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve({ status: res.statusCode || 200, data });
          } catch (e) {
            resolve({ status: res.statusCode || 200, data: raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

test('API Server: Endpoints test suite', async (t) => {
  const apiServer = createApiServer();

  await new Promise<void>(resolve => {
    apiServer.listen(0, () => resolve()); // Random available port
  });

  t.after(() => {
    (apiServer as any).closeAllConnections?.();
    apiServer.close();
  });

  // Test 1: GET /health
  await t.test('GET /health returns 200 ok', async () => {
    const res = await makeRequest(apiServer, '/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
  });

  // Test 2: GET /api/default-dataset
  await t.test('GET /api/default-dataset returns valid template', async () => {
    const res = await makeRequest(apiServer, '/api/default-dataset');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.elements), 'Elements array returned');
    assert.ok(Array.isArray(res.data.characteristics), 'Characteristics array returned');
  });

  // Test 3: POST /api/calculate
  await t.test('POST /api/calculate executes engine and returns ranking', async () => {
    const dataset = createDefaultDataset();
    const res = await makeRequest(apiServer, '/api/calculate', 'POST', { dataset });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.scores), 'Scores array returned');
    assert.ok(Array.isArray(res.data.ranking), 'Ranking array returned');
    assert.equal(res.data.ranking.length, dataset.elements.length);
  });

  // Test 4: POST /api/export and POST /api/import
  await t.test('POST /api/export and /api/import complete case round-trip', async () => {
    const dataset = createDefaultDataset();
    const exportRes = await makeRequest(apiServer, '/api/export', 'POST', { dataset });
    assert.equal(exportRes.status, 200);
    assert.ok(typeof exportRes.data.json === 'string', 'Returns JSON string');

    const importRes = await makeRequest(apiServer, '/api/import', 'POST', {
      json: exportRes.data.json
    });
    assert.equal(importRes.status, 200);
    assert.deepEqual(importRes.data.elements, dataset.elements, 'Imported elements match original');
  });

  // Test 5: POST /api/scrape-match
  await t.test('POST /api/scrape-match extracts match recreation JSON', async () => {
    const res = await makeRequest(apiServer, '/api/scrape-match', 'POST', {
      url: 'https://es.whoscored.com/matches/2007644/live/internacional-fifa-world-cup-2026-spain-argentina'
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.success, 'Scrape endpoint returns success');
    assert.equal(res.data.matchId, 2007644);
    assert.ok(typeof res.data.jsonString === 'string', 'Returns jsonString');
    const parsed = JSON.parse(res.data.jsonString);
    assert.equal(parsed.matchId, 2007644);
  });
});
