import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

export function getApiBaseUrl(): string {
  return process.env.API_URL || 'http://127.0.0.1:3001';
}
export const getApiUrl = getApiBaseUrl;
export const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3002;
export const MCP_HOST = process.env.MCP_HOST || '0.0.0.0';

/**
 * Helper to dispatch requests to the internal Ordomatics HTTP REST API.
 * The MCP server does not compute mathematical operations directly in-process;
 * it forwards all calculation, template, and serialization requests to the internal API.
 */
async function callInternalApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API returned HTTP ${res.status}: ${errorBody}`);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    throw new Error(
      `Internal API communication failed at ${url}. Ensure the internal API is running. Error: ${
        err.message || String(err)
      }`
    );
  }
}

// Define available MCP tools
const TOOLS: Tool[] = [
  {
    name: 'calculate_ordomatica',
    description:
      'Executes the full Ordomatics mathematical engine via the internal API on a provided dataset. Computes own values (V^P), affinity matrices (A, A^A, A^C), contextual values (V^C), relative adjustments (V^CRN), OWA/RWA weight redistribution, and the final alternative ranking.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: {
          type: 'object',
          description:
            'The complete Ordomatics dataset containing elements, characteristics, correlation matrix (cMatrix), and OWA weights. If omitted, default template is used.'
        }
      }
    }
  },
  {
    name: 'get_default_dataset',
    description:
      'Queries the internal API to return a fully configured standard Ordomatics dataset template (3 alternatives, 3 dimensions, default distances and OWA weights) ready for customization or execution.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'export_case_json',
    description:
      'Serializes an Ordomatics dataset into a standardized JSON case string through the internal API for persistent storage or session resumption.',
    inputSchema: {
      type: 'object',
      properties: {
        dataset: {
          type: 'object',
          description: 'The complete dataset object to serialize.'
        }
      },
      required: ['dataset']
    }
  },
  {
    name: 'import_case_json',
    description:
      'Parses and validates an Ordomatics JSON case string via the internal API, automatically repairing matrix dimensions and returning the restored dataset.',
    inputSchema: {
      type: 'object',
      properties: {
        jsonContent: {
          type: 'string',
          description: 'The serialized JSON string of the case file to restore.'
        }
      },
      required: ['jsonContent']
    }
  },
  {
    name: 'api_health_check',
    description:
      'Verifies the connectivity and health status of the internal Ordomatics REST API server.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * Factory that creates and configures an MCP Server instance with all tools registered.
 */
export function createOrdomaticsMcpServer(): Server {
  const server = new Server(
    {
      name: 'ordomatics-mcp-server',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'api_health_check': {
          const health = await callInternalApi<any>('/health');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(health, null, 2)
              }
            ]
          };
        }

        case 'get_default_dataset': {
          const dataset = await callInternalApi<any>('/api/default-dataset');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(dataset, null, 2)
              }
            ]
          };
        }

        case 'calculate_ordomatica': {
          const payload = args?.dataset ? { dataset: args.dataset } : {};
          const result = await callInternalApi<{
            elements: string[];
            scores: number[];
            ranking: Array<{ rankIndex: number; element: string; score: number }>;
            details: any;
          }>('/api/calculate', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          // Build a readable markdown summary alongside raw JSON
          const rankingTable = result.ranking
            .map((r, i) => `${i + 1}. **${r.element}** (Puntuación final: ${r.score.toFixed(4)})`)
            .join('\n');

          const summaryText =
            `### Resultado del Análisis Ordomática\n\n` +
            `**Ranking de Alternativas:**\n${rankingTable}\n\n` +
            `**Datos Detallados:**\n` +
            JSON.stringify(result, null, 2);

          return {
            content: [
              {
                type: 'text',
                text: summaryText
              }
            ]
          };
        }

        case 'export_case_json': {
          const dataset = args?.dataset;
          if (!dataset) throw new Error("Parámetro 'dataset' requerido para exportar.");
          const res = await callInternalApi<{ json: string }>('/api/export', {
            method: 'POST',
            body: JSON.stringify({ dataset })
          });
          return {
            content: [
              {
                type: 'text',
                text: res.json
              }
            ]
          };
        }

        case 'import_case_json': {
          const jsonContent = args?.jsonContent;
          if (!jsonContent) throw new Error("Parámetro 'jsonContent' requerido para importar.");
          const res = await callInternalApi<any>('/api/import', {
            method: 'POST',
            body: JSON.stringify({ json: jsonContent })
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(res, null, 2)
              }
            ]
          };
        }

        default:
          throw new Error(`Herramienta desconocida: ${name}`);
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error ejecutando ${name}: ${err.message || String(err)}`
          }
        ]
      };
    }
  });

  return server;
}

/**
 * Starts the MCP Server using the HTTP / Server-Sent Events (SSE) transport.
 * Allows remote LLM agents, Cursor, Windsurf, Antigravity, and Cline to connect over HTTP.
 */
export function startMcpSseServer(
  port: number = MCP_PORT,
  host: string = MCP_HOST
): http.Server {
  const sessions = new Map<string, SSEServerTransport>();

  const srv = http.createServer(async (req, res) => {
    // Enable CORS for external agents and browsers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Root status info
    if (req.method === 'GET' && pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify(
          {
            name: 'ordomatics-mcp-server',
            version: '1.0.0',
            status: 'running',
            transport: 'SSE',
            sseEndpoint: '/sse',
            messagesEndpoint: '/messages',
            internalApiUrl: getApiBaseUrl()
          },
          null,
          2
        )
      );
      return;
    }

    // Health check endpoint
    if (req.method === 'GET' && pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', transport: 'sse' }));
      return;
    }

    // Establish SSE Connection: GET /sse
    if (req.method === 'GET' && pathname === '/sse') {
      const transport = new SSEServerTransport('/messages', res);
      const serverInstance = createOrdomaticsMcpServer();

      sessions.set(transport.sessionId, transport);

      transport.onclose = () => {
        sessions.delete(transport.sessionId);
      };

      await serverInstance.connect(transport);
      return;
    }

    // Handle Client Messages: POST /messages?sessionId=...
    if (req.method === 'POST' && pathname === '/messages') {
      const sessionId = parsedUrl.searchParams.get('sessionId');
      const transport = sessionId ? sessions.get(sessionId) : undefined;

      if (!transport) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found or expired', sessionId }));
        return;
      }

      await transport.handlePostMessage(req, res);
      return;
    }

    // 404 for other endpoints
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));
  });

  srv.listen(port, host, () => {
    console.log(
      `Ordomatics MCP Server (SSE) listening on http://${host}:${port} (SSE endpoint: http://${host}:${port}/sse)`
    );
  });

  return srv;
}

/**
 * Starts the MCP Server using STDIO transport for CLI and local command execution.
 */
export async function startMcpStdioServer(): Promise<void> {
  const serverInstance = createOrdomaticsMcpServer();
  const transport = new StdioServerTransport();
  await serverInstance.connect(transport);
  console.error(
    `Ordomatics MCP Server running on STDIO transport (connecting to internal API: ${getApiBaseUrl()})`
  );
}

// Execution detection
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
  const useStdio =
    process.argv.includes('--stdio') || process.env.MCP_TRANSPORT === 'stdio';

  if (useStdio) {
    startMcpStdioServer().catch(err => {
      console.error('Fatal error in MCP STDIO server:', err);
      process.exit(1);
    });
  } else {
    startMcpSseServer(MCP_PORT, MCP_HOST);
  }
}
