import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/scrape-match') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { url, html } = JSON.parse(body || '{}');
              const { extractMatchCentreDataFromHtml } = await import('./src/logic/matchScraper');
              const { scrapeMatchServer } = await import('./src/api/serverScraper');

              if (html) {
                const extracted = extractMatchCentreDataFromHtml(html);
                if (extracted) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      success: true,
                      matchId: typeof extracted.matchId === 'number' ? extracted.matchId : 2007644,
                      matchTitle: 'WhoScored Match Data',
                      matchData: extracted,
                      jsonString: JSON.stringify(extracted, null, 2),
                      source: 'live-scraped',
                      isTestData: false
                    })
                  );
                  return;
                }
              }

              const result = await scrapeMatchServer(url);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Error' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});
