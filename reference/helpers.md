> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Helpers

> Use pagination patterns and high-level helper utilities in the TypeScript SDK

## Pagination

List methods return a `PaginatedResponse<T>`:

```ts theme={null}
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    total_records: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}
```

**Manual pagination**

```ts theme={null}
const { data, pagination } = await client.workflows.list({ page: 1, limit: 20 });
console.log(`Page ${pagination.page} of ${pagination.total_pages}`);
```

**Automatic iteration with `listAll()`**

For resources that support it, use the async generator to iterate all pages:

```ts theme={null}
for await (const workflow of client.workflows.listAll({ folder_id: "..." })) {
  console.log(workflow.name);
}
```

## Helpers reference

High-level convenience functions available via `@happyrobot-ai/sdk/helpers`.

***

### triggerAndWaitForNodeOutput

Trigger a workflow run and poll until a specific node produces an output, then return that output's full payload. Use this when you need a result from a particular node without waiting for the entire workflow to finish.

```ts theme={null}
import { triggerAndWaitForNodeOutput } from "@happyrobot-ai/sdk/helpers";

const result = await triggerAndWaitForNodeOutput(client, {
  workflowId: "my-workflow",
  payload: { phone: "+1234567890" },
  nodePersistentId: "extract-order-details",
  timeoutMs: 300_000,
  pollIntervalMs: 2_000,
  environment: "production",
});

console.log(result.nodeOutput); // full output data from the node
```

| Option             | Type                      | Default        | Description                           |
| ------------------ | ------------------------- | -------------- | ------------------------------------- |
| `workflowId`       | `string`                  | —              | Workflow ID or slug                   |
| `nodePersistentId` | `string`                  | —              | Persistent ID of the node to wait for |
| `payload`          | `Record<string, unknown>` | `{}`           | Trigger payload                       |
| `timeoutMs`        | `number`                  | `300_000`      | Maximum wait time in milliseconds     |
| `pollIntervalMs`   | `number`                  | `2_000`        | Poll interval in milliseconds         |
| `environment`      | `string`                  | `"production"` | Target environment                    |

Returns an object with:

* `ok` — whether a node output was found
* `runId` — the triggered run's ID
* `status` — the run status at the time the output was retrieved
* `nodeOutput` — the full output payload from the node
* `completedAt` — when the run completed, or `null` if still running

Throws `TimeoutError` if the node does not produce output within `timeoutMs`, or an `Error` if the run reaches a terminal status before the node runs.

***

### triggerAndWait

Trigger a workflow run and poll until it reaches a terminal status (`completed`, `failed`, `canceled`, `succeeded`, or `skipped`). Use this when you need to synchronously wait for a workflow to finish before continuing.

```ts theme={null}
import { triggerAndWait } from "@happyrobot-ai/sdk/helpers";

const { run, sessions } = await triggerAndWait(client, {
  workflowId: "my-workflow",
  payload: { phone: "+1234567890" },
  timeoutMs: 300_000,
  pollIntervalMs: 2_000,
  fetchSessions: true,
  environment: "production",
});
```

| Option           | Type                      | Default        | Description                  |
| ---------------- | ------------------------- | -------------- | ---------------------------- |
| `workflowId`     | `string`                  | —              | Workflow ID or slug          |
| `payload`        | `Record<string, unknown>` | `{}`           | Trigger payload              |
| `timeoutMs`      | `number`                  | `300_000`      | Maximum wait time            |
| `pollIntervalMs` | `number`                  | `2_000`        | Poll interval                |
| `fetchSessions`  | `boolean`                 | `true`         | Fetch sessions on completion |
| `environment`    | `string`                  | `"production"` | Target environment           |

Throws `TimeoutError` if the run does not reach a terminal status within `timeoutMs`.

***

### createVoiceAgent

Create a voice agent workflow from a template with optional publishing. Use this to quickly spin up a new voice agent without manually configuring nodes.

```ts theme={null}
import { createVoiceAgent } from "@happyrobot-ai/sdk/helpers";

const { workflow, publishResult } = await createVoiceAgent(client, {
  name: "Sales Agent",
  template: "voice-agent",
  prompt: "You are a helpful sales assistant...",
  initialMessage: "Hi, how can I help you today?",
  publish: true,
  environment: "production",
  folderId: "folder-id",
});
```

| Option           | Type      | Default         | Description                                |
| ---------------- | --------- | --------------- | ------------------------------------------ |
| `name`           | `string`  | —               | Display name                               |
| `template`       | `string`  | `"voice-agent"` | `"voice-agent"` or `"inbound-voice-agent"` |
| `prompt`         | `string`  | —               | Agent system prompt                        |
| `initialMessage` | `string`  | —               | First message the agent speaks             |
| `publish`        | `boolean` | `false`         | Publish after creation                     |
| `environment`    | `string`  | `"production"`  | Target environment                         |
| `folderId`       | `string`  | —               | Optional folder ID                         |

***

### createFromTemplate

Create any workflow from a template with custom inputs. Use this for non-voice templates like email or SMS agents where you need to pass template-specific configuration.

```ts theme={null}
import { createFromTemplate } from "@happyrobot-ai/sdk/helpers";

const { workflow } = await createFromTemplate(client, {
  template: "email-agent",
  name: "Email Responder",
  prompt: "You handle customer emails...",
  inputs: { custom_field: "value" },
  publish: true,
});
```

| Option           | Type                      | Default        | Description                         |
| ---------------- | ------------------------- | -------------- | ----------------------------------- |
| `template`       | `string`                  | —              | Template identifier                 |
| `name`           | `string`                  | —              | Display name                        |
| `prompt`         | `string`                  | —              | Agent system prompt                 |
| `initialMessage` | `string`                  | —              | First message                       |
| `inputs`         | `Record<string, unknown>` | `{}`           | Additional template-specific inputs |
| `publish`        | `boolean`                 | `false`        | Publish after creation              |
| `environment`    | `string`                  | `"production"` | Target environment                  |
| `folderId`       | `string`                  | —              | Optional folder ID                  |