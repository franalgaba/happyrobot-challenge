> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# MCP Server Setup

> Connect external MCP servers to discover and use their tools in your workflows

Connect your own MCP (Model Context Protocol) servers to HappyRobot to discover and use their tools in your voice and text agent workflows. Once connected, the platform fetches the server's tool catalog and makes them available as [MCP Tools](/tools/mcp) in the workflow editor.

## Prerequisites

<Info>
  Your MCP server must implement the **Streamable HTTP** transport protocol. Other transports (stdio, SSE) are not supported. The server must be reachable from HappyRobot's infrastructure over HTTPS.
</Info>

## Connecting a server

<Steps>
  <Step title="Navigate to Integrations">
    Go to **Integrations** in the left sidebar and find the **MCP Server** integration.
  </Step>

  <Step title="Add a credential">
    Click **Add Credential** to create a new MCP server connection.
  </Step>

  <Step title="Enter server details">
    Fill in the server name, URL, and authentication configuration on the **Production** tab (see table below). Optionally configure separate URLs and tokens for the **Staging** and **Development** tabs.
  </Step>

  <Step title="Test the connection">
    Click **Test** to verify the platform can reach your server, complete the MCP handshake, and discover tools. If successful, the discovered tools are saved to the credential. On Staging and Development tabs, testing also compares the tool list against Production and flags any mismatches.
  </Step>
</Steps>

## Server configuration

| Field           | Required | Description                                                       |
| --------------- | -------- | ----------------------------------------------------------------- |
| **Server Name** | Yes      | A friendly label for this server (e.g., "Carrier Search API").    |
| **Server URL**  | Yes      | The HTTP(S) endpoint of your MCP server (Production environment). |
| **Auth Type**   | Yes      | Authentication method. One of the options below.                  |

### Authentication types

| Auth Type        | Fields                        | Behavior                                                                                                                                                                                   |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **None**         | —                             | No authentication headers are sent.                                                                                                                                                        |
| **Bearer Token** | Token                         | Sends `Authorization: Bearer <token>` header.                                                                                                                                              |
| **API Key**      | Token, Header Name (optional) | Sends the token in a custom header. Defaults to `X-API-Key` if no header name is specified.                                                                                                |
| **OAuth 2.0**    | OAuth 2.0 credential          | Fetches a short-lived access token from an OAuth 2.0 API Client credential in your organization and sends it as `Authorization: Bearer <token>`. The token is resolved at connection time. |

<Info>
  To use OAuth 2.0 authentication, first create an **OAuth 2.0 → API Client** credential in **Integrations**. Configure the token endpoint URL and any required parameters (query params, headers, body data) for your OAuth provider's client credentials flow. You can then select that credential when configuring the MCP server.
</Info>

## Per-environment configuration

MCP server credentials support separate connection details for **Production**, **Staging**, and **Development** environments. When your workflow is published to a given environment, the corresponding server URL and auth token are used.

The credential form has three tabs — **Production**, **Staging**, and **Development**. The Production tab is always required. Staging and Development fields are optional: if left blank, they fall back to the Production values.

| Tab         | Server URL field | Auth Token / OAuth 2.0 credential | Fallback                        |
| ----------- | ---------------- | --------------------------------- | ------------------------------- |
| Production  | Required         | Required                          | —                               |
| Staging     | Optional         | Optional                          | Falls back to Production values |
| Development | Optional         | Optional                          | Falls back to Production values |

<Info>
  Tool discovery only runs against the Production server. When you test the connection on a Staging or Development tab, the platform compares the discovered tools against Production and reports any mismatches — tools present in one environment but not the other are highlighted with a warning.
</Info>

## Managing servers

After connecting an MCP server, manage it from the **MCP Server** integration page:

* **Tools tab** — view all discovered tools across your connected servers in an expandable table. Each server row shows the number of tools and last connection time.
* **Refresh** — click the refresh button on a server row to re-discover tools. This fetches the latest tool list from the server and updates the stored catalog.
* **Tool details** — click on any tool to view its description, parameters (name, type, required/optional, description), and connection information.
* **Inspect** — click the **Inspect** button (search icon) on a server row to open the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) in a new browser tab. The inspector connects through a secure platform proxy, already authenticated, so you can interactively browse tools, invoke them with custom arguments, and inspect responses — useful for debugging server behavior before deploying to production.

## Troubleshooting

<AccordionGroup>
  <Accordion title="Server unreachable">
    The platform cannot reach your server URL. Verify the URL is correct, the server is running, and it is accessible from the public internet (or through your network configuration). Ensure you are using HTTPS.
  </Accordion>

  <Accordion title="Connection refused">
    The server is reachable but actively refusing connections. Check that the MCP server process is running and listening on the correct port. Verify firewall rules allow inbound connections.
  </Accordion>

  <Accordion title="Connection timeout">
    The server did not respond within the expected timeframe. This may indicate high server load, network latency, or that the server is behind a proxy that is not forwarding requests. Check server health and network configuration.
  </Accordion>

  <Accordion title="Authentication failed">
    The server rejected the provided credentials. Verify your token is correct and has not expired. For API Key auth, confirm the header name matches what your server expects.
  </Accordion>
</AccordionGroup>

## Related

<CardGroup cols={3}>
  <Card title="MCP Tools" icon="plug" href="/tools/mcp">
    Learn how to use discovered MCP tools in your workflows.
  </Card>

  <Card title="Credentials" icon="key" href="/integrations/credentials">
    Manage authentication credentials for all your integrations.
  </Card>

  <Card title="MCP for Developer Tools" icon="code" href="/developer-tools/mcp">
    Use HappyRobot from AI coding assistants like Claude Code and Cursor.
  </Card>
</CardGroup>