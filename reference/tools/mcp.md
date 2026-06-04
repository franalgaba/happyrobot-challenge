> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# MCP Tools

> Import tools from external Model Context Protocol servers into your workflows

MCP (Model Context Protocol) tools let you import functions from external MCP servers and use them as tools in your voice and text agents. Instead of building a custom tool with child action nodes, you connect to an MCP server that already exposes the capabilities you need.

## How MCP tools work

<Steps>
  <Step title="Connect an MCP server">
    Add your MCP server as a credential in the [Integrations](/integrations/overview) section. See [MCP Server Setup](/tools/mcp-server) for details.
  </Step>

  <Step title="Discover tools">
    The platform connects to your server, fetches its tool list, and displays them in the MCP Server tools tab.
  </Step>

  <Step title="Add to a workflow">
    In the workflow editor, add a tool to a prompt node and select an MCP tool from the discovered tools list. The platform creates a tool node linked to a child **MCP Call** action node automatically.
  </Step>

  <Step title="Configure behavior">
    Customize the message type, hold music, and parameter test values. The tool description and parameter structure are read-only — they come from the MCP server.
  </Step>
</Steps>

## What you can configure

When an MCP tool is added to a workflow, some fields are set by the server and some are editable:

| Field                         | Source     | Editable                                                                                         |
| ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| **Description**               | MCP server | No — displayed as read-only text.                                                                |
| **Parameter names and types** | MCP server | No — structure is fixed by the server.                                                           |
| **Parameter test values**     | You        | Yes — enter example values for testing.                                                          |
| **Tool arguments**            | You        | Yes — override or supply default values for each parameter; editor adapts to the parameter type. |
| **Message type and content**  | You        | Yes — choose AI, Fixed, or None.                                                                 |
| **Hold music**                | You        | Yes — select from built-in or custom audio.                                                      |
| **Custom headers**            | You        | Yes — define HTTP headers sent with every MCP tool call.                                         |

### Tool argument types

The tool argument editor on the MCP Call node adapts to the type each parameter declares on the MCP server:

| Parameter type                | Editor                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `string`, `number`, `boolean` | A single templated text input. Type `@` to insert workflow variables.                                                |
| `array`                       | A list editor — add or remove items with **Add value**. Each item supports variables.                                |
| `object`                      | A templated text input expecting a JSON object (e.g., `{"key":"value"}`). Variables can be embedded inside the JSON. |

### Custom headers

The MCP Call action node supports custom HTTP headers. Use this to pass authentication tokens, tenant identifiers, or other metadata that your MCP server needs on each request.

Add key-value pairs in the **Custom Headers** section of the MCP Call node configuration. Both keys and values support variable templating — type `@` to insert workflow variables into a header value.

Use custom headers to forward context from the workflow to the MCP server, such as a customer ID, session token, or any per-call metadata the server needs to process the request.

For example, to forward a session token from your workflow:

| Key               | Value                    |
| ----------------- | ------------------------ |
| `X-Session-Token` | `@trigger.session_token` |
| `X-Tenant-ID`     | `acme-corp`              |

## MCP tool architecture

When you add an MCP tool to a prompt node, the platform creates two linked nodes:

1. **Tool node** — contains the tool description, parameters, and message configuration.
2. **MCP Call action node** — a child node that handles the actual call to the MCP server at runtime.

<Warning>
  Do not delete the child MCP Call action node independently. It is required for the tool to function. If you need to remove an MCP tool, delete the parent tool node — the child node will be removed automatically.
</Warning>

## Example

An MCP server at your company exposes a `find_carriers` tool that searches for available carriers by lane and equipment type.

1. Connect the MCP server in Integrations with the server URL and authentication credentials.
2. The platform discovers `find_carriers` with parameters: `origin` (string), `destination` (string), `equipment_type` (string).
3. Add the `find_carriers` MCP tool to your voice agent's prompt node.
4. Set message type to **AI** with the guidance: "Tell the caller you're searching for available carriers."
5. Set hold music to **Acoustic**.

During a call, when the caller asks about carrier availability, the agent calls `find_carriers` with the extracted parameters, the MCP server returns results, and the agent relays them to the caller.

## Related

<CardGroup cols={2}>
  <Card title="MCP Server Setup" icon="server" href="/tools/mcp-server">
    Connect and manage external MCP servers.
  </Card>

  <Card title="Creating Tools" icon="wrench" href="/tools/creating-tools">
    Build custom tools when you need full control over parameters and child nodes.
  </Card>
</CardGroup>