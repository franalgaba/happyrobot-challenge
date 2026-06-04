> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# TypeScript SDK

> Install and configure the HappyRobot TypeScript SDK to manage workflows, voice agents, and integrations programmatically

The `@happyrobot-ai/sdk` package provides a typed TypeScript client for the HappyRobot platform API. Use it to create workflows, trigger runs, manage voice agents, and access every platform resource from your own code.

## Prerequisites

<Info>
  Before installing, make sure you have:

  * **Node.js 18+** installed
  * A **HappyRobot API key** — generate one at [Settings → API Keys](/settings/api-keys)
</Info>

## Installation

<CodeGroup>
  ```bash npm theme={null}
  npm install @happyrobot-ai/sdk
  ```

  ```bash pnpm theme={null}
  pnpm add @happyrobot-ai/sdk
  ```

  ```bash yarn theme={null}
  yarn add @happyrobot-ai/sdk
  ```
</CodeGroup>

## Initialize the client

```ts theme={null}
import { HappyRobotClient } from "@happyrobot-ai/sdk";

const client = new HappyRobotClient({
  apiKey: "sk_live_...",
});
```

## Configuration

| Option       | Type           | Default        | Description                                                              |
| ------------ | -------------- | -------------- | ------------------------------------------------------------------------ |
| `apiKey`     | `string`       | —              | **Required.** Your API key (`sk_live_...` or `sk_test_...`).             |
| `cluster`    | `"us" \| "eu"` | `"us"`         | Regional cluster to connect to. Use `"eu"` for EU-hosted organizations.  |
| `timeout`    | `number`       | `30000`        | Request timeout in milliseconds.                                         |
| `maxRetries` | `number`       | `2`            | Automatic retries on `429` and `5xx` responses with exponential backoff. |
| `fetch`      | `typeof fetch` | global `fetch` | Custom fetch implementation (useful for testing or proxying).            |

```ts theme={null}
const client = new HappyRobotClient({
  apiKey: "sk_live_...",
  cluster: "eu", // omit for US (default)
  timeout: 30_000,
  maxRetries: 2,
  fetch: customFetch,
});
```

| Cluster        | Base URL                                   |
| -------------- | ------------------------------------------ |
| `us` (default) | `https://platform.happyrobot.ai/api/v2`    |
| `eu`           | `https://platform.eu.happyrobot.ai/api/v2` |

## Authentication

API keys come in two variants:

| Prefix     | Environment | Use case                                     |
| ---------- | ----------- | -------------------------------------------- |
| `sk_live_` | Production  | Live workflows and real calls                |
| `sk_test_` | Test        | Development and testing without side effects |

You can introspect the current key at any time:

```ts theme={null}
const info = await client.apiKey.describe();
console.log(info); // { id, name, org_id, ... }
```

<Warning>
  Never commit API keys to version control. Use environment variables and load them at runtime.
</Warning>

## Available resources

The client exposes every platform resource as a typed property:

| Property                   | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `client.workflows`         | Workflow CRUD, publishing, runs, and templates    |
| `client.versions`          | Version management (fork, publish, lock, test)    |
| `client.nodes`             | Node CRUD, config schema, and available variables |
| `client.runs`              | Run details, cancellation, and annotations        |
| `client.sessions`          | Session details, messages, and SSE streaming      |
| `client.messages`          | Message quality flags                             |
| `client.variables`         | Workflow-scoped variables                         |
| `client.phoneNumbers`      | Phone number management                           |
| `client.sipTrunks`         | SIP trunk management                              |
| `client.integrations`      | Integration and event discovery                   |
| `client.contacts`          | Contact lookup and history                        |
| `client.knowledgeBases`    | Knowledge base document management                |
| `client.workflowFolders`   | Workflow folder organization                      |
| `client.mcp`               | MCP server management                             |
| `client.billing`           | Billing usage details and totals                  |
| `client.apiKey`            | API key introspection                             |
| `client.chat`              | Chat token creation (server-side)                 |
| `client.voice`             | Voice call token creation (server-side)           |
| `client.artifacts`         | Artifact URL resolution                           |
| `client.adversarialSuites` | Adversarial suite management and execution        |
| `client.adversarialTests`  | Adversarial test management and execution         |
| `client.northstars`        | Northstar quality criteria management             |
| `client.customEvals`       | Custom eval management and execution              |
| `client.issues`            | Quality issue (flag) status management            |
| `client.auditRemarks`      | Audit remark feedback management                  |

### Browser clients (separate imports)

| Import                     | Class                   | Description                                                      |
| -------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `@happyrobot-ai/sdk/chat`  | `HappyRobotChatClient`  | Browser-side chat over WebSocket                                 |
| `@happyrobot-ai/sdk/voice` | `HappyRobotVoiceClient` | Browser-side voice calls over WebRTC (requires `livekit-client`) |

## Next steps

<CardGroup cols={2}>
  <Card title="Quickstart" icon="rocket" href="/developer-tools/sdk/quickstart">
    Trigger your first workflow run in under five minutes.
  </Card>

  <Card title="Voice agent tutorial" icon="phone" href="/developer-tools/sdk/voice-agent-tutorial">
    Create and call a voice agent end-to-end.
  </Card>

  <Card title="Voice call tutorial" icon="microphone" href="/developer-tools/sdk/voice-call-tutorial">
    Build a browser voice call UI with WebRTC.
  </Card>

  <Card title="Chatbot tutorial" icon="comments" href="/developer-tools/sdk/chatbot-tutorial">
    Build a custom chat UI with WebSocket streaming.
  </Card>
</CardGroup>