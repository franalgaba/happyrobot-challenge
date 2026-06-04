> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Trigger a workflow run and read the results in under five minutes

This guide walks you through installing the SDK, triggering a workflow run, waiting for it to complete, and reading the session messages.

## Steps

<Steps>
  <Step title="Install the SDK">
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
  </Step>

  <Step title="Initialize the client">
    ```ts theme={null}
    import { HappyRobotClient } from "@happyrobot-ai/sdk";

    const client = new HappyRobotClient({
      apiKey: process.env.HAPPYROBOT_API_KEY!,
    });
    ```
  </Step>

  <Step title="Trigger a run">
    ```ts theme={null}
    const { run_id } = await client.workflows.triggerRun("my-workflow", {
      payload: { phone: "+1234567890" },
    });

    console.log("Run started:", run_id);
    ```
  </Step>

  <Step title="Poll until completion">
    Instead of writing your own polling loop, use the `triggerAndWait` helper:

    ```ts theme={null}
    import { triggerAndWait } from "@happyrobot-ai/sdk/helpers";

    const { run, sessions } = await triggerAndWait(client, {
      workflowId: "my-workflow",
      payload: { phone: "+1234567890" },
      timeoutMs: 300_000,      // 5 minutes
      pollIntervalMs: 2_000,   // check every 2 seconds
    });

    console.log("Run status:", run.status);
    ```

    | Option           | Default        | Description                  |
    | ---------------- | -------------- | ---------------------------- |
    | `workflowId`     | —              | Workflow ID or slug          |
    | `payload`        | `{}`           | Trigger payload              |
    | `timeoutMs`      | `300_000`      | Maximum wait time in ms      |
    | `pollIntervalMs` | `2_000`        | Poll interval in ms          |
    | `fetchSessions`  | `true`         | Fetch sessions on completion |
    | `environment`    | `"production"` | Target environment           |
  </Step>

  <Step title="Read sessions and messages">
    ```ts theme={null}
    for (const session of sessions) {
      console.log(`Session ${session.id} — ${session.type} — ${session.status}`);

      const { data: messages } = await client.sessions.getMessages(session.id);
      for (const msg of messages) {
        console.log(`  [${msg.role}] ${msg.content}`);
      }
    }
    ```
  </Step>
</Steps>

## Full script

Copy and paste this to run a complete workflow trigger-and-read cycle:

```ts theme={null}
import { HappyRobotClient } from "@happyrobot-ai/sdk";
import { triggerAndWait } from "@happyrobot-ai/sdk/helpers";

const client = new HappyRobotClient({
  apiKey: process.env.HAPPYROBOT_API_KEY!,
});

async function main() {
  // 1. Trigger and wait for completion
  const { run, sessions } = await triggerAndWait(client, {
    workflowId: "my-workflow",
    payload: { phone: "+1234567890" },
  });

  console.log(`Run ${run.id} finished with status: ${run.status}`);

  // 2. Read session messages
  for (const session of sessions) {
    console.log(`\nSession ${session.id} (${session.type}):`);

    const { data: messages } = await client.sessions.getMessages(session.id);
    for (const msg of messages) {
      console.log(`  [${msg.role}] ${msg.content}`);
    }
  }
}

main().catch(console.error);
```

<Tip>
  Replace `"my-workflow"` with your workflow slug or ID. You can find it on the workflow settings page or by calling `client.workflows.list()`.
</Tip>