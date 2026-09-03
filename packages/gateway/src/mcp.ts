// stdio MCP server — VOL-10 §5.5 (LOCKED).
// JSON-RPC 2.0 over stdio. Tools-only server: initialize, ping, tools/list,
// tools/call; everything else → method-not-found. Starts < 300 ms cold with
// lazy auth; stdout carries JSON-RPC frames and nothing else.

import { fetchCatalog, fetchQuota, request, ApiError, codeOf, messageOf } from './api.js';

interface RpcRequest {
  jsonrpc: '2.0';
  id?: number | string | null;
  method: string;
  params?: Record<string, unknown>;
}

interface ToolSpec {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpServerDeps {
  endpoint: string;
  bearer: () => string | undefined;
  onDeadToken?: () => void;
}

const PROTOCOL_VERSION = '2025-06-18';

export function serveStdio(deps: McpServerDeps): void {
  let buffer = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk: string) => {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      handleLine(line, deps).catch((e) => {
        // a crashed gateway exits non-zero without poisoning stdin (§5.5)
        process.stderr.write(`gateway crash: ${String((e as Error)?.message ?? e)}\n`);
        process.exit(6);
      });
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

async function handleLine(line: string, deps: McpServerDeps): Promise<void> {
  let req: RpcRequest;
  try {
    req = JSON.parse(line) as RpcRequest;
  } catch {
    writeFrame({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }

  // notifications: no response frame
  if (req.id === undefined || req.id === null) {
    return; // e.g. notifications/initialized
  }

  try {
    switch (req.method) {
      case 'initialize': {
        writeFrame({
          jsonrpc: '2.0',
          id: req.id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: 'jontrix-gateway', version: '0.1.0' },
          },
        });
        return;
      }
      case 'ping': {
        writeFrame({ jsonrpc: '2.0', id: req.id, result: {} });
        return;
      }
      case 'tools/list': {
        const bearer = deps.bearer();
        if (!bearer) {
          writeFrame(authRequired(req.id));
          return;
        }
        try {
          const catalog = await fetchCatalog(deps.endpoint, bearer);
          writeFrame({
            jsonrpc: '2.0',
            id: req.id,
            result: {
              tools: catalog.tools,
              _meta: catalog.stale ? { 'jontrix.stale': true } : undefined,
            },
          });
        } catch (e) {
          writeFrame(apiError(req.id, e));
        }
        return;
      }
      case 'tools/call': {
        const bearer = deps.bearer();
        if (!bearer) {
          writeFrame(authRequired(req.id));
          return;
        }
        const name = String(req.params?.name ?? '');
        const args = (req.params?.arguments ?? {}) as Record<string, unknown>;
        try {
          // pre-flight (§7): refuse locally only what the server would refuse
          const quota = await fetchQuota(deps.endpoint, bearer);
          const mcp = quota.mcp as { calls_made_month: number; calls_limit_month: number; resets_at: string };
          if (mcp.calls_made_month >= mcp.calls_limit_month) {
            writeFrame({
              jsonrpc: '2.0',
              id: req.id,
              error: {
                code: -32000,
                message: 'QUOTA_EXCEEDED',
                data: { resets_at: mcp.resets_at, upgrade_url: '/?view=pricing', note: 'monthly MCP quota exhausted (pre-flight)' },
              },
            });
            return;
          }
          const { status, body } = await request(deps.endpoint, '/api/mcp/call', {
            method: 'POST',
            bearer,
            json: { tool: name, arguments: args },
          });
          if (status === 200) {
            const b = body as { result: unknown; usage: unknown };
            writeFrame({
              jsonrpc: '2.0',
              id: req.id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(b.result, null, 2) }],
                _meta: { 'jontrix.usage': b.usage },
              },
            });
          } else {
            writeFrame({
              jsonrpc: '2.0',
              id: req.id,
              error: { code: status === 404 ? -32602 : -32000, message: codeOf(body), data: messageOf(body) },
            });
            if (status === 401 && deps.onDeadToken) deps.onDeadToken();
          }
        } catch (e) {
          writeFrame(apiError(req.id, e));
        }
        return;
      }
      default: {
        writeFrame({
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32601, message: 'Method not found' },
        });
      }
    }
  } catch (e) {
    writeFrame(apiError(req.id, e));
  }
}

function authRequired(id: number | string): unknown {
  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32000, message: 'AUTH_REQUIRED', data: 'run: jontrix-gateway login' },
  };
}

function apiError(id: number | string, e: unknown): unknown {
  if (e instanceof ApiError) {
    return { jsonrpc: '2.0', id, error: { code: -32000, message: e.code, data: e.message } };
  }
  return { jsonrpc: '2.0', id, error: { code: -32000, message: 'INTERNAL', data: String((e as Error)?.message ?? e) } };
}

function writeFrame(obj: unknown): void {
  // stdout carries JSON-RPC frames and nothing else (§5.5 MUST)
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}
