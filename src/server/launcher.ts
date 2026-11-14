import { startServer as startApiServer, PORT as API_PORT, HOST as API_HOST } from '../api/server.js';
import { startMcpSseServer, MCP_PORT, MCP_HOST, getApiBaseUrl } from '../mcp/server.js';
import { startWebServer, WEB_PORT, WEB_HOST } from '../web/server.js';

/**
 * Unified application launcher for Docker and Local Production Environments.
 * 
 * Coordinates the 3 architectural services:
 * 1. 🔒 Internal HTTP REST API: Bound to 127.0.0.1:3001 (Internal only, not exposed to host).
 * 2. 🤖 MCP Server: Bound to 0.0.0.0:3002 (Exposed via SSE for LLMs, delegates to Internal API).
 * 3. 🌐 Web Application: Bound to 0.0.0.0:3000 (Exposed for human users in browsers).
 */

async function main() {
  console.log('='.repeat(72));
  console.log('🚀 INICIALIZANDO PLATAFORMA INTEGRADA ORDOMÁTICA');
  console.log('='.repeat(72));

  // 1. Iniciar API interna
  const apiServer = startApiServer(API_PORT, API_HOST);

  // 2. Iniciar Servidor MCP (SSE)
  const mcpServer = startMcpSseServer(MCP_PORT, MCP_HOST);

  // 3. Iniciar Servidor Web
  const webServer = startWebServer(WEB_PORT, WEB_HOST);

  console.log('-'.repeat(72));
  console.log(`🌐 Interfaz Web:       http://localhost:${WEB_PORT}`);
  console.log(`🤖 Servidor MCP (SSE): http://localhost:${MCP_PORT}/sse (para LLMs/Agentes)`);
  console.log(`🔒 API Interna:        http://${API_HOST}:${API_PORT} (Privada / Solo interna)`);
  console.log(`🔗 Enlace MCP -> API:  ${getApiBaseUrl()}`);
  console.log('='.repeat(72));
  console.log('✅ Todos los servicios se han iniciado y están listos para recibir peticiones.');

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n🛑 Cerrando servicios de Ordomática...');
    webServer.close(() => {
      console.log('  ✓ Servidor Web cerrado.');
    });
    mcpServer.close(() => {
      console.log('  ✓ Servidor MCP cerrado.');
    });
    apiServer.close(() => {
      console.log('  ✓ API interna cerrada.');
      process.exit(0);
    });

    // Force exit after 5s if connections hang
    setTimeout(() => {
      process.exit(0);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => {
  console.error('❌ Error fatal al iniciar los servicios de Ordomática:', err);
  process.exit(1);
});
