import { McpServer, WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import type { JsonSchemaType, StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import { Hono } from "hono";

import type { AppServices } from "../services/types";
import { jsonError } from "../utils/http";
import { logError } from "../utils/logging";
import { callMcpTool, mcpTools } from "./tools";

const MCP_SERVER_NAME = "happyrobot-carrier-sales-tools";
const MCP_SERVER_VERSION = "0.1.0";
const MCP_JSON_RESPONSE_ACCEPT_HEADER = "application/json, text/event-stream";
const MCP_TOOL_FAILURE_MESSAGE = "MCP tool call failed.";

type McpToolDefinition = (typeof mcpTools)[number];

function safeMcpArgumentKeys(args: unknown) {
  return typeof args === "object" && args !== null && !Array.isArray(args) ? Object.keys(args) : [];
}

function structuredContent(result: unknown) {
  return typeof result === "object" && result !== null && !Array.isArray(result) ? (result as Record<string, unknown>) : undefined;
}

function toolCallResult(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    structuredContent: structuredContent(result),
  };
}

function requestWithMcpAcceptHeader(request: Request) {
  if (request.headers.has("Accept")) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("Accept", MCP_JSON_RESPONSE_ACCEPT_HEADER);
  return new Request(request, { headers });
}

function passThroughMcpInputSchema(schema: JsonSchemaType): StandardSchemaWithJSON<unknown, unknown> {
  const schemaJson = () => schema as Record<string, unknown>;

  return {
    "~standard": {
      version: 1,
      vendor: "happyrobot-challenge",
      validate: (value: unknown) => ({ value }),
      jsonSchema: {
        input: schemaJson,
        output: schemaJson,
      },
    },
  };
}

function logMcpToolError(toolName: string, args: unknown, error: unknown) {
  logError("mcp_tool_error", error, {
    operation: "mcp_tool",
    mcpToolName: toolName,
    mcpArgKeys: safeMcpArgumentKeys(args),
  });
}

function registerMcpTool(server: McpServer, services: AppServices, tool: McpToolDefinition) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: passThroughMcpInputSchema(tool.inputSchema as JsonSchemaType),
    },
    async (args) => {
      try {
        return toolCallResult(await callMcpTool(services, tool.name, args));
      } catch (error) {
        logMcpToolError(tool.name, args, error);
        throw new Error(MCP_TOOL_FAILURE_MESSAGE);
      }
    },
  );
}

function createSdkMcpServer(services: AppServices) {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });

  for (const tool of mcpTools) {
    registerMcpTool(server, services, tool);
  }

  return server;
}

export function createMcpRoutes(services: AppServices, mcpPathToken: string) {
  const mcp = new Hono();
  const server = createSdkMcpServer(services);
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });
  const connected = server.connect(transport);

  mcp.all("/:token", async (c) => {
    if (c.req.param("token") !== mcpPathToken) {
      return jsonError(c, 404, "mcp_not_found", "MCP server was not found.");
    }

    await connected;
    return transport.handleRequest(requestWithMcpAcceptHeader(c.req.raw));
  });

  return mcp;
}
