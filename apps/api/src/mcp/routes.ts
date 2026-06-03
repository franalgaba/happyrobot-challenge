import { Hono } from "hono";
import type { AppServices } from "../services/types";
import { ServiceError } from "../utils/errors";
import { jsonError } from "../utils/http";
import { callMcpTool, mcpTools } from "./tools";

const MCP_SERVER_NAME = "happyrobot-carrier-sales-tools";
const MCP_TRANSPORT = "streamable-http-json-rpc";
const MCP_PROTOCOL_VERSION = "2024-11-05";
const MCP_SERVER_VERSION = "0.1.0";
const JSON_RPC_PARSE_ERROR = -32700;
const JSON_RPC_METHOD_NOT_FOUND = -32601;
const JSON_RPC_TOOL_ERROR = -32000;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function jsonRpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data } };
}

function jsonRpcToolError(id: JsonRpcRequest["id"], error: unknown) {
  if (error instanceof ServiceError) {
    return jsonRpcError(id, JSON_RPC_TOOL_ERROR, "MCP tool call failed.", {
      code: error.code,
      status: error.status,
    });
  }

  return jsonRpcError(id, JSON_RPC_TOOL_ERROR, "MCP tool call failed.");
}

function mcpMetadata() {
  return {
    name: MCP_SERVER_NAME,
    transport: MCP_TRANSPORT,
    tools: mcpTools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  };
}

function initializeResult() {
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: { tools: {} },
    serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
  };
}

function mcpTokenIsValid(token: string, expectedToken: string) {
  return token === expectedToken;
}

function toolCallResult(result: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}

async function handleJsonRpcRequest(services: AppServices, body: JsonRpcRequest) {
  if (body.method === "initialize") {
    return jsonRpcResult(body.id, initializeResult());
  }

  if (body.method === "tools/list") {
    return jsonRpcResult(body.id, { tools: mcpTools });
  }

  if (body.method === "tools/call") {
    const toolName = String(body.params?.name ?? "");
    const args = body.params?.arguments ?? {};
    const result = await callMcpTool(services, toolName, args);
    return jsonRpcResult(body.id, toolCallResult(result));
  }

  return jsonRpcError(body.id, JSON_RPC_METHOD_NOT_FOUND, `Unsupported method: ${body.method}`);
}

export function createMcpRoutes(services: AppServices, mcpPathToken: string) {
  const mcp = new Hono();

  mcp.get("/:token", async (c) => {
    if (!mcpTokenIsValid(c.req.param("token"), mcpPathToken)) {
      return jsonError(c, 404, "mcp_not_found", "MCP server was not found.");
    }
    return c.json(mcpMetadata());
  });

  mcp.post("/:token", async (c) => {
    if (!mcpTokenIsValid(c.req.param("token"), mcpPathToken)) {
      return jsonError(c, 404, "mcp_not_found", "MCP server was not found.");
    }

    let body: JsonRpcRequest | undefined;
    try {
      body = (await c.req.json()) as JsonRpcRequest;

      if (body.method === "notifications/initialized") {
        return c.body(null, 202);
      }

      const result = await handleJsonRpcRequest(services, body);
      return c.json(result, "error" in result ? 400 : 200);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json(jsonRpcError(null, JSON_RPC_PARSE_ERROR, "Parse error"), 400);
      }

      return c.json(jsonRpcToolError(body?.id ?? null, error), 500);
    }
  });

  return mcp;
}
