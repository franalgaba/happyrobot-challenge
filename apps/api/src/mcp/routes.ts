import { Hono } from "hono";
import { McpServer, WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import type { AppServices } from "../services/types";
import { jsonError } from "../utils/http";
import { logError } from "../utils/logging";
import { callMcpTool, mcpTools } from "./tools";
import type { JsonSchemaType, StandardSchemaWithJSON } from "@modelcontextprotocol/server";

const MCP_SERVER_NAME = "happyrobot-carrier-sales-tools";
const MCP_SERVER_VERSION = "0.1.0";

function mcpTokenIsValid(token: string, expectedToken: string) {
  return token === expectedToken;
}

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
  headers.set("Accept", "application/json, text/event-stream");
  return new Request(request, { headers });
}

function passThroughMcpInputSchema(schema: JsonSchemaType): StandardSchemaWithJSON<unknown, unknown> {
  return {
    "~standard": {
      version: 1,
      vendor: "happyrobot-challenge",
      validate: (value: unknown) => ({ value }),
      jsonSchema: {
        input: () => schema as Record<string, unknown>,
        output: () => schema as Record<string, unknown>,
      },
    },
  };
}

function createSdkMcpServer(services: AppServices) {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });

  for (const tool of mcpTools) {
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
          logError("mcp_tool_error", error, {
            operation: "mcp_tool",
            mcpToolName: tool.name,
            mcpArgKeys: safeMcpArgumentKeys(args),
          });
          throw new Error("MCP tool call failed.");
        }
      },
    );
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
    if (!mcpTokenIsValid(c.req.param("token"), mcpPathToken)) {
      return jsonError(c, 404, "mcp_not_found", "MCP server was not found.");
    }

    await connected;
    return transport.handleRequest(requestWithMcpAcceptHeader(c.req.raw));
  });

  return mcp;
}
