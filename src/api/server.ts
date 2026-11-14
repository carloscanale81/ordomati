import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { calculateOrdomatica, createDefaultDataset, OrdomaticaDataset, scrapeMatchData, extractMatchCentreDataFromHtml } from '../logic/index';
import { serializeFullCase, deserializeFullCase } from '../io/serializer';
import { scrapeMatchServer } from './serverScraper';

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
export const HOST = process.env.HOST || '127.0.0.1';

/**
 * Lightweight HTTP REST API server for Ordomatics.
 * Allows external web apps, microservices, and scripts to run the calculation engine
 * and handle case files over standard HTTP without any UI dependencies.
 */

const setCorsHeaders = (res: http.ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const sendJson = (res: http.ServerResponse, statusCode: number, data: any) => {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

const readBody = (req: http.IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
};

const hasDatasetShape = (obj: any): boolean => {
  return Boolean(obj && typeof obj === 'object' && Array.isArray(obj.elements) && Array.isArray(obj.characteristics));
};

const resolveDataset = (parsed: any): OrdomaticaDataset => {
  if (hasDatasetShape(parsed?.dataset)) return parsed.dataset;
  if (hasDatasetShape(parsed)) return parsed;
  return createDefaultDataset();
};

export const createApiServer = (): http.Server => {
  return http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    try {
      // GET /health
      if (req.method === 'GET' && pathname === '/health') {
        sendJson(res, 200, {
          status: 'ok',
          service: 'ordomatics-api',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // GET /api/default-dataset
      if (req.method === 'GET' && pathname === '/api/default-dataset') {
        const dataset = createDefaultDataset();
        sendJson(res, 200, dataset);
        return;
      }

      // POST /api/calculate
      if (req.method === 'POST' && pathname === '/api/calculate') {
        const body = await readBody(req);
        const parsed = body ? JSON.parse(body) : {};
        const dataset: OrdomaticaDataset = resolveDataset(parsed);

        const calculation = calculateOrdomatica(dataset);
        sendJson(res, 200, {
          elements: dataset.elements,
          scores: calculation.agg.A_final,
          ranking: calculation.agg.ranking.map(idx => ({
            rankIndex: idx,
            element: dataset.elements[idx],
            score: calculation.agg.A_final[idx]
          })),
          details: calculation
        });
        return;
      }

      // POST /api/export
      if (req.method === 'POST' && pathname === '/api/export') {
        const body = await readBody(req);
        const parsed = body ? JSON.parse(body) : {};
        const dataset: OrdomaticaDataset = resolveDataset(parsed);

        const jsonStr = serializeFullCase(dataset);
        sendJson(res, 200, { json: jsonStr });
        return;
      }

      // POST /api/import
      if (req.method === 'POST' && pathname === '/api/import') {
        const body = await readBody(req);
        const parsed = body ? JSON.parse(body) : {};
        const jsonContent = parsed.json || parsed;

        const restoredDataset = deserializeFullCase(jsonContent);
        sendJson(res, 200, restoredDataset);
        return;
      }

      // POST /api/scrape-match
      if (req.method === 'POST' && pathname === '/api/scrape-match') {
        const body = await readBody(req);
        const parsed = body ? JSON.parse(body) : {};
        const targetUrl = parsed.url || '';
        const rawHtml = parsed.html || '';

        if (rawHtml) {
          const extracted = extractMatchCentreDataFromHtml(rawHtml);
          if (extracted) {
            sendJson(res, 200, {
              success: true,
              matchId: typeof extracted.matchId === 'number' ? extracted.matchId : 2007644,
              matchTitle: 'WhoScored Match Data',
              matchData: extracted,
              jsonString: JSON.stringify(extracted, null, 2),
              source: 'live-scraped'
            });
            return;
          }
        }

        const scrapeResult = await scrapeMatchServer(targetUrl);
        sendJson(res, 200, scrapeResult);
        return;
      }

      // 404 Not Found
      sendJson(res, 404, { error: 'Not Found', path: pathname });
    } catch (err: any) {
      sendJson(res, 400, {
        error: err.message || 'Internal Server Error'
      });
    }
  });
};

export const startServer = (port: number = PORT, host: string = HOST): http.Server => {
  const srv = createApiServer();
  srv.listen(port, host, () => {
    console.log(`Ordomatics HTTP API server listening on http://${host}:${port} (internal only)`);
  });
  return srv;
};

// Check if this file is executed directly (not imported as a module/test)
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
  startServer(PORT);
}
