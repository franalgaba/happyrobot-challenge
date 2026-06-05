import { McpServer, WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import type { JsonSchemaType, StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import { Hono } from "hono";

import type { AppServices } from "../services/types";
import { jsonError } from "../utils/http";
import { logError, logInfo } from "../utils/logging";
import { matchesSecret } from "../utils/secrets";
import { callMcpTool, mcpTools } from "./tools";

const MCP_SERVER_NAME = "happyrobot-carrier-sales-tools";
const MCP_SERVER_VERSION = "0.1.0";
const MCP_JSON_RESPONSE_ACCEPT_HEADER = "application/json, text/event-stream";
const MCP_TOOL_FAILURE_MESSAGE = "MCP tool call failed.";
const MCP_BEARER_CHALLENGE = 'Bearer realm="mcp"';

type McpToolDefinition = (typeof mcpTools)[number];

type McpRouteConfig = {
  pathToken: string;
  authToken: string;
};

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
  const accept = request.headers.get("Accept");
  if (hasMcpCompatibleAcceptHeader(accept)) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set("Accept", MCP_JSON_RESPONSE_ACCEPT_HEADER);
  return new Request(request, { headers });
}

function hasMcpCompatibleAcceptHeader(accept: string | null): boolean {
  return Boolean(accept && accept !== "*/*");
}

function bearerToken(authorizationHeader: string | undefined): string | undefined {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function isAuthorizedMcpRequest(request: Request, authToken: string): boolean {
  return matchesSecret(bearerToken(request.headers.get("Authorization") ?? undefined), authToken);
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
        const result = await callMcpTool(services, tool.name, args);
        logInfo("mcp_tool_completed", {
          operation: "mcp_tool",
          mcpToolName: tool.name,
          mcpArgKeys: safeMcpArgumentKeys(args),
        });
        return toolCallResult(result);
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

export function createMcpRoutes(services: AppServices, config: McpRouteConfig) {
  const mcp = new Hono();
  const server = createSdkMcpServer(services);
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });
  const connected = server.connect(transport);

  mcp.all("/:token", async (c) => {
    if (c.req.param("token") !== config.pathToken) {
      return jsonError(c, 404, "mcp_not_found", "MCP server was not found.");
    }

    if (!isAuthorizedMcpRequest(c.req.raw, config.authToken)) {
      c.header("WWW-Authenticate", MCP_BEARER_CHALLENGE);
      return jsonError(c, 401, "mcp_unauthorized", "Missing or invalid MCP bearer token.");
    }

    await connected;
    return transport.handleRequest(requestWithMcpAcceptHeader(c.req.raw));
  });

  return mcp;
}
