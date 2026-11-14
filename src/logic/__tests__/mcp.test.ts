import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiServer } from '../../api/server';
import { createOrdomaticsMcpServer } from '../../mcp/server';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

test('MCP Server: Tools calling internal API suite', async (t) => {
  // 1. Start an ephemeral API server on a random port
  const apiServer = createApiServer();
  await new Promise<void>(resolve => {
    apiServer.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = apiServer.address() as any;
  const originalApiUrl = process.env.API_URL;
  process.env.API_URL = `http://127.0.0.1:${addr.port}`;

  t.after(() => {
    process.env.API_URL = originalApiUrl;
    (apiServer as any).closeAllConnections?.();
    apiServer.close();
  });

  const mcpServer = createOrdomaticsMcpServer();

  // Test 1: ListTools lists all registered tools
  await t.test('MCP lists all 5 tools', async () => {
    // In SDK, request handler for ListToolsRequestSchema can be tested directly or through server
    const handler = (mcpServer as any)._requestHandlers?.get(ListToolsRequestSchema.shape.method.value);
    assert.ok(handler, 'ListTools handler registered');

    const result = await handler({ method: 'tools/list', params: {} });
    assert.ok(Array.isArray(result.tools));
    const toolNames = result.tools.map((x: any) => x.name);
    assert.ok(toolNames.includes('calculate_ordomatica'));
    assert.ok(toolNames.includes('get_default_dataset'));
    assert.ok(toolNames.includes('export_case_json'));
    assert.ok(toolNames.includes('import_case_json'));
    assert.ok(toolNames.includes('api_health_check'));
  });

  // Test 2: CallTool api_health_check
  await t.test('MCP calls api_health_check successfully via internal API', async () => {
    const handler = (mcpServer as any)._requestHandlers?.get(CallToolRequestSchema.shape.method.value);
    assert.ok(handler, 'CallTool handler registered');

    const result = await handler({
      method: 'tools/call',
      params: {
        name: 'api_health_check',
        arguments: {}
      }
    });

    assert.equal(result.isError, undefined);
    assert.ok(result.content[0].text.includes('ok'));
    assert.ok(result.content[0].text.includes('ordomatics-api'));
  });

  // Test 3: CallTool get_default_dataset
  await t.test('MCP calls get_default_dataset via internal API', async () => {
    const handler = (mcpServer as any)._requestHandlers?.get(CallToolRequestSchema.shape.method.value);

    const result = await handler({
      method: 'tools/call',
      params: {
        name: 'get_default_dataset',
        arguments: {}
      }
    });

    assert.equal(result.isError, undefined);
    const parsed = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(parsed.elements));
    assert.equal(parsed.elements.length, 4);
  });

  // Test 4: CallTool calculate_ordomatica
  await t.test('MCP calls calculate_ordomatica via internal API and returns ranking', async () => {
    const handler = (mcpServer as any)._requestHandlers?.get(CallToolRequestSchema.shape.method.value);

    const result = await handler({
      method: 'tools/call',
      params: {
        name: 'calculate_ordomatica',
        arguments: {}
      }
    });

    assert.equal(result.isError, undefined);
    assert.ok(result.content[0].text.includes('Ranking de Alternativas'));
    assert.ok(result.content[0].text.includes('Puntuación final'));
  });

  // Test 5: CallTool export_case_json and import_case_json
  await t.test('MCP exports and imports case through internal API', async () => {
    const handler = (mcpServer as any)._requestHandlers?.get(CallToolRequestSchema.shape.method.value);

    // Export
    const exportResult = await handler({
      method: 'tools/call',
      params: {
        name: 'export_case_json',
        arguments: {
          dataset: {
            elements: ['X', 'Y'],
            characteristics: [],
            cMatrix: [[1, 0], [0, 1]],
            owa: [0.5, 0.5]
          }
        }
      }
    });
    assert.equal(exportResult.isError, undefined);
    const jsonStr = exportResult.content[0].text;
    assert.ok(typeof jsonStr === 'string' && jsonStr.length > 0);

    // Import
    const importResult = await handler({
      method: 'tools/call',
      params: {
        name: 'import_case_json',
        arguments: {
          jsonContent: jsonStr
        }
      }
    });
    assert.equal(importResult.isError, undefined);
    const restored = JSON.parse(importResult.content[0].text);
    assert.deepEqual(restored.elements, ['X', 'Y']);
  });
});
