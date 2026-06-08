# HappyRobot SDK and Documentation Feedback

This report summarizes SDK and documentation mismatches found while building the Acme Logistics inbound carrier sales proof of concept with HappyRobot.

The integration is working, but it required several workarounds because the public SDK examples and local reference docs did not match the payloads accepted by the live HappyRobot API. These issues mostly affect developers trying to automate workflow setup, MCP registration, workflow variables, and tool-enabled voice agents.

## Validation Scope

- SDK package: `@happyrobot-ai/sdk@0.1.19`
- SDK source inspected: installed package files under `node_modules/@happyrobot-ai/sdk`
- Docs inspected: `reference/sdk/*`, `reference/tools/*`, and the installed SDK README
- Integration code used for comparison:
  - `scripts/happyrobot/sync-workflow.ts`
  - `apps/api/src/mcp/routes.ts`
  - `apps/api/src/mcp/tools.ts`

## Executive Summary

The SDK is usable, but the developer path is harder than it should be because the examples expose older or incomplete request shapes. The most important fixes are:

- Update workflow variable docs from `{ name, value }` to the environment-specific live API shape.
- Update MCP registration docs from `{ name, url }` to `server_name`, `server_url`, `auth_type`, and the relevant auth credential fields.
- Publish complete SDK declaration files, or replace generated-schema imports with concrete exported interfaces.
- Add practical examples for configuring Prompt, Tool, and MCP Call nodes through the SDK.
- Document the full MCP Streamable HTTP handshake and schema constraints HappyRobot expects during tool discovery.

## Priority Findings

### P0: Published SDK Types Reference Missing Schema Modules

The installed SDK declaration files export request and response aliases by importing generated route schema modules, but those modules are not included in the published package.

Example from the installed package:

```ts
import type {
  CreateVariableBodySchema,
  UpdateVariableBodySchema
} from "../../routes/workflows/:workflow_id/variables/schemas";
```

There is no `routes` directory in `node_modules/@happyrobot-ai/sdk`.

Why this matters:

- Developers cannot inspect the actual body types from the published package.
- Projects with `skipLibCheck: false` may fail on missing declaration imports.
- Projects with `skipLibCheck: true` may still compile, but the SDK loses much of its value as a source of request-shape guidance.

Requested fix:

Publish the referenced route schema declaration files, or replace these inferred aliases with concrete exported interfaces in the SDK package.

### P1: Workflow Variable Examples Use Legacy Field Names

The SDK README and resource docs currently show:

```ts
await client.variables.create("workflow-id", {
  name: "MY_VAR",
  value: "hello",
});

await client.variables.update("workflow-id", "variable-id", {
  value: "world",
});
```

The live API rejected that shape with this validation error:

```text
Request doesn't match the schema:
#/key/invalid_type: expected string, received undefined
#/value_production/invalid_type: expected string, received undefined
#/value_staging/invalid_type: expected string, received undefined
#/value_development/invalid_type: expected string, received undefined
```

The working payload is:

```ts
await client.variables.create("workflow-id", {
  key: "API_BASE_URL",
  value_production: "https://example.com",
  value_staging: "https://example.com",
  value_development: "https://example.com",
});
```

Why this matters:

Developers following the SDK examples hit a validation error on the first variable create or update call.

Requested fix:

Update the SDK README and resource docs to use `key`, `value_production`, `value_staging`, and `value_development`. Also clarify whether `name` and `value` are deprecated aliases, unsupported legacy fields, or valid only for older API versions.

### P1: MCP Registration Examples Use Legacy Field Names

The SDK README and resource docs currently show:

```ts
await client.mcp.create({
  name: "My MCP",
  url: "https://example.com/mcp",
});
```

The live API rejected that shape with this validation error:

```text
Request doesn't match the schema:
#/server_name/invalid_type: expected string, received undefined
#/server_url/invalid_type: expected string, received undefined
#/auth_type/invalid_value: expected one of "none"|"bearer"|"api_key"|"oauth2"
```

The working payload is:

```ts
await client.mcp.create({
  server_name: "Carrier Sales Hono MCP",
  server_url: "https://example.com/mcp/<path-token>",
  auth_type: "bearer",
  auth_token: "<bearer-token>",
});
```

Why this matters:

MCP is a key integration path for tool-backed agents. The current create example fails against the live API and does not explain the required auth fields.

Requested fix:

Update the SDK MCP examples to use `server_name`, `server_url`, and `auth_type`. Document the exact credential fields expected for `none`, `bearer`, `api_key`, and `oauth2`.

### P1: MCP Auth Support Is Mentioned, But Working SDK Payloads Are Not Documented

The MCP Server docs describe four auth modes in the UI:

- None
- Bearer Token
- API Key
- OAuth 2.0

The installed SDK README also includes this OAuth2 note:

```text
OAuth2 (`auth_type: "oauth2"`): set `oauth2_credential_id` to the UUID of an OAuth 2.0 integration credential ...
```

That is useful, but the SDK section still does not show complete working `client.mcp.create(...)` payloads for each auth mode. The only working auth payload validated in this POC was bearer auth:

```ts
await client.mcp.create({
  server_name: "Carrier Sales Hono MCP",
  server_url: "https://example.com/mcp/<path-token>",
  auth_type: "bearer",
  auth_token: "<bearer-token>",
});
```

Why this matters:

MCP authentication is not just a UI detail. Developers setting up MCP servers from code need exact SDK payloads, especially for bearer and API-key auth. OAuth2 is partly documented, but the primary SDK example still fails and the auth modes are not presented as copyable SDK examples.

Requested fix:

Add a dedicated `client.mcp.create(...)` auth section with one working payload per auth mode:

- `auth_type: "none"` with no credential field.
- `auth_type: "bearer"` with the correct bearer token field.
- `auth_type: "api_key"` with the token field and custom header-name field.
- `auth_type: "oauth2"` with `oauth2_credential_id` and no `auth_token`.

Also confirm whether these auth fields are per-environment or only production-scoped when configured through the SDK.

### P1: Node Update Docs Do Not Match Real Configuration Payloads

The workflow docs currently show a generic update example:

```ts
await client.nodes.update("version-id", "node-id", {
  config: { ... },
});
```

For real workflow setup, that was not enough. Prompt and MCP Call nodes required top-level fields and a `configuration` object, not a `config` object.

Working Prompt node payload:

```ts
await client.nodes.update(versionId, promptNode.id, {
  type: "prompt",
  name: "Prompt",
  parent_id: null,
  sort_index: -1,
  prompt_md: prompt,
  initial_message: initialMessage,
  model,
});
```

Working MCP Call node payload:

```ts
await client.nodes.update(versionId, mcpCallNode.id, {
  type: "action",
  name: "MCP Call",
  parent_id: toolNode.id,
  sort_index: 0,
  event_id: mcpCallEventId,
  integration_id: mcpIntegrationId,
  configuration: {
    credentialId,
    credential: {
      type: "static",
      static: { id: credentialId, name: "Carrier Sales Hono MCP" },
    },
    tool_name: "verify_carrier",
    tool_args: [],
    dynamic_headers: [],
  },
});
```

Why this matters:

Developers can list nodes and fetch config schemas, but the docs do not show how to turn that information into valid update payloads for common voice-agent nodes.

Requested fix:

Add node-type-specific SDK examples for Prompt, Tool, Inbound Voice Agent, and MCP Call nodes. At minimum, replace the generic `config` example with the actual `configuration` field where appropriate and document required top-level fields such as `type`, `parent_id`, `sort_index`, `prompt_md`, `event_id`, and `integration_id`.

### P2: `addBatch` and `update` Use Different Parent Field Names

Creating child nodes required `parent_node_id`:

```ts
await client.nodes.addBatch(versionId, {
  nodes: [
    {
      type: "tool",
      name: "verify_carrier",
      parent_node_id: promptNode.id,
      sort_index: 0,
      configuration: {},
    },
  ],
});
```

Updating those nodes used `parent_id`:

```ts
await client.nodes.update(versionId, toolNode.id, {
  type: "tool",
  name: "verify_carrier",
  parent_id: promptNode.id,
  sort_index: 0,
  function: toolFunction,
});
```

Why this matters:

This is easy to miss because the docs only show `nodes: [...]` for `addBatch`. A developer can reasonably assume the same parent field works for create and update.

Requested fix:

Document the create-vs-update parent field names, or normalize the API/SDK so both operations accept the same field.

### P2: MCP Tool Discovery Requires Inline Object Schemas

HappyRobot rejected a valid JSON Schema where the tool `inputSchema` was a top-level `$ref`:

```json
{
  "$ref": "#/definitions/VerifyCarrierRequest",
  "definitions": {
    "VerifyCarrierRequest": {
      "type": "object",
      "properties": {}
    }
  }
}
```

The validation error was:

```text
tools[0].inputSchema.type: expected "object"
tools[1].inputSchema.type: expected "object"
tools[2].inputSchema.type: expected "object"
tools[3].inputSchema.type: expected "object"
```

The accepted shape was an inline object schema:

```json
{
  "type": "object",
  "properties": {
    "mcNumber": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": ["mcNumber"],
  "additionalProperties": false
}
```

Why this matters:

Many developers generate JSON Schema from Zod or similar libraries. Those generators often emit `$ref` plus `definitions` by default. The HappyRobot docs should make the current constraint explicit.

Requested fix:

Document that HappyRobot MCP tool discovery currently expects each `inputSchema` to be an inline JSON Schema object with top-level `"type": "object"`. If `$ref` is intentionally unsupported, call that out and recommend dereferencing generated schemas before returning `tools/list`.

### P2: MCP Streamable HTTP Handshake Needs Clearer Docs

During MCP registration, HappyRobot sent this notification:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

Treating it as an unsupported JSON-RPC method caused HappyRobot to mark the MCP connection as failed.

The current working implementation delegates the handshake to `WebStandardStreamableHTTPServerTransport` and ensures requests have an MCP-compatible `Accept` header before passing them to the transport.

Why this matters:

Developers implementing a custom MCP server need to know the sequence HappyRobot expects, especially if they are not using a framework that handles MCP notifications correctly.

Requested fix:

Document the expected Streamable HTTP sequence:

1. `initialize`
2. `notifications/initialized`
3. `tools/list`

Also state that `notifications/initialized` is a notification and should be accepted without returning an unsupported-method JSON-RPC error.

### P2: Tool-Enabled Voice Agent Setup Needs A Complete SDK Example

The `createVoiceAgent(...)` helper works for creating a basic agent, but it was not enough to create and publish this MCP-backed inbound workflow by itself.

The final automated setup had to:

- Create from the `inbound-voice-agent` template.
- Update workflow metadata.
- Upsert workflow variables.
- Register and refresh the MCP server.
- Locate or fork an editable workflow version.
- Configure the existing Prompt node.
- Configure the Inbound Voice Agent node.
- Add Tool nodes under the Prompt node.
- Add MCP Call action nodes under those Tool nodes.
- Publish the configured version.

Why this matters:

A developer reading the current helper docs may expect `createVoiceAgent(..., { publish: true })` plus a prompt to be sufficient for a tool-using inbound agent. For an MCP-backed workflow, the missing node configuration steps are the hard part.

Requested fix:

Add a complete "tool-enabled voice agent" SDK example. It should show MCP registration, node discovery, Prompt node configuration, Tool node creation, MCP Call child node creation, editable-version handling, and final publish.

### P2: Updating An Existing Workflow Was Less Reliable Than Recreating It From Code

During the POC, updating the existing Builder-created workflow/version was not enough to get to a working published workflow. The existing workflow had the expected high-level shape, but parts of the version were left in an incomplete or inconsistent state. One visible symptom during this work was the workflow carrying odd room-name behavior after updates rather than behaving like a clean inbound voice-agent template.

The final automation now deletes the existing workflow, recreates it from the `inbound-voice-agent` template, configures it through the SDK, and then publishes the freshly configured version:

```ts
async function resolveWorkflow(client: HappyRobotClient, prompt: string) {
  const workflowId = process.env.HAPPYROBOT_WORKFLOW_ID;
  const existing = workflowId
    ? await findWorkflowById(client, workflowId)
    : await findWorkflowByName(client, WORKFLOW_NAME);

  if (existing) {
    await deleteWorkflow(client, existing);
  }

  return createWorkflow(client, prompt);
}
```

Why this matters:

A developer may expect an SDK sync script to be able to update an existing workflow in place. In practice, this POC needed a recreate-from-template path to avoid stale or partially configured version state. Without a documented reset/recreate strategy, developers can spend time debugging symptoms that are really caused by old workflow state.

Requested fix:

Document the supported lifecycle for programmatic workflow updates: when to update a version in place, when to fork, when to unpublish and republish, and when deleting and recreating from a template is the recommended recovery path. If existing workflow versions can retain room/session or template state that is not fully overwritten by node updates, document that explicitly.

## Workarounds Used In This POC

The Acme Logistics POC works around the issues above by:

- Matching existing variables by either `key` or legacy `name`.
- Sending workflow variable payloads with `value_production`, `value_staging`, and `value_development`.
- Matching MCP servers by either `server_name` / `server_url` or legacy `name` / `url`.
- Registering MCP with `auth_type: "bearer"` and `auth_token`.
- Treating OAuth2 MCP auth as partially documented in the SDK README, while bearer and API-key SDK payload examples remain undocumented.
- Using `WebStandardStreamableHTTPServerTransport` for MCP request handling.
- Adding an MCP-compatible `Accept` header before passing requests to the transport.
- Dereferencing generated Zod JSON Schemas before exposing MCP tools.
- Creating child nodes with `parent_node_id` and updating them with `parent_id`.
- Configuring Prompt, Tool, Inbound Voice Agent, and MCP Call nodes with live API payload shapes.
- Deleting and recreating the inbound workflow from code when an existing workflow/version carried stale or inconsistent state.

## Suggested Product Actions

1. Update SDK examples for variables, MCP registration, MCP auth, and node updates so they match live API validation.
2. Fix the published SDK type package so exported request body types resolve without missing internal schema modules.
3. Add one complete SDK tutorial for a production-style inbound voice agent with MCP tools.
4. Add MCP server implementation notes covering the Streamable HTTP handshake, required `Accept` behavior, and input schema limitations.
5. Document the recommended workflow lifecycle for update, fork, unpublish, republish, delete, and recreate operations.
6. Consider adding an SDK helper for attaching MCP tools to a voice agent, since that setup currently requires multiple undocumented node payloads.
