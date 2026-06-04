> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Voice agent tutorial

> Create a voice agent, trigger an outbound call, and stream live messages with the TypeScript SDK

This tutorial walks through the full lifecycle of a voice agent: create it from a template, publish it, trigger an outbound call, stream the conversation in real time, and clean up.

## Steps

<Steps>
  <Step title="Create a voice agent">
    Use the `createVoiceAgent` helper to create a workflow from the built-in voice agent template:

    ```ts theme={null}
    import { HappyRobotClient } from "@happyrobot-ai/sdk";
    import { createVoiceAgent } from "@happyrobot-ai/sdk/helpers";

    const client = new HappyRobotClient({
      apiKey: process.env.HAPPYROBOT_API_KEY!,
    });

    const { workflow, publishResult } = await createVoiceAgent(client, {
      name: "Sales Agent",
      template: "voice-agent",           // "voice-agent" (outbound) or "inbound-voice-agent"
      prompt: "You are a helpful sales assistant for Acme Corp...",
      initialMessage: "Hi, this is Alex from Acme. How can I help you today?",
      publish: true,
      environment: "production",
      folderId: "optional-folder-id",
    });

    console.log("Workflow created:", workflow.id);
    ```

    | Option           | Default         | Description                                           |
    | ---------------- | --------------- | ----------------------------------------------------- |
    | `name`           | —               | Display name for the workflow                         |
    | `template`       | `"voice-agent"` | `"voice-agent"` (outbound) or `"inbound-voice-agent"` |
    | `prompt`         | —               | Agent system prompt                                   |
    | `initialMessage` | —               | First message the agent speaks                        |
    | `publish`        | `false`         | Publish immediately after creation                    |
    | `environment`    | `"production"`  | Target environment                                    |
    | `folderId`       | —               | Optional folder to organize the workflow              |
  </Step>

  <Step title="Trigger an outbound call">
    ```ts theme={null}
    const { run_id } = await client.workflows.triggerRun(workflow.id, {
      payload: { phone: "+1234567890" },
    });

    console.log("Call triggered, run:", run_id);
    ```
  </Step>

  <Step title="Wait for the session to start">
    Poll the run until a session is available:

    ```ts theme={null}
    import { triggerAndWait } from "@happyrobot-ai/sdk/helpers";

    const { run, sessions } = await triggerAndWait(client, {
      workflowId: workflow.id,
      payload: { phone: "+1234567890" },
      timeoutMs: 120_000,
    });

    const session = sessions[0];
    console.log("Session started:", session?.id);
    ```
  </Step>

  <Step title="Stream live messages via SSE">
    Once you have a session ID, open a server-sent events stream to receive messages in real time:

    ```ts theme={null}
    if (session) {
      const stream = await client.sessions.stream(session.id);

      for await (const event of stream) {
        switch (event.event) {
          case "message":
            console.log(`[${event.data.role}] ${event.data.content}`);
            break;
          case "session_ended":
            console.log("Session ended");
            break;
        }
      }
    }
    ```

    See [Sessions and messages](/developer-tools/sdk/sessions-and-messages) for the full list of SSE event types.
  </Step>

  <Step title="Clean up">
    Delete the workflow when you're done testing:

    ```ts theme={null}
    await client.workflows.delete(workflow.id);
    console.log("Workflow deleted");
    ```
  </Step>
</Steps>

## Full script

```ts theme={null}
import { HappyRobotClient } from "@happyrobot-ai/sdk";
import { createVoiceAgent, triggerAndWait } from "@happyrobot-ai/sdk/helpers";

const client = new HappyRobotClient({
  apiKey: process.env.HAPPYROBOT_API_KEY!,
});

async function main() {
  // 1. Create and publish a voice agent
  const { workflow } = await createVoiceAgent(client, {
    name: "Sales Agent",
    prompt: "You are a helpful sales assistant for Acme Corp...",
    initialMessage: "Hi, this is Alex from Acme. How can I help you today?",
    publish: true,
  });

  // 2. Trigger a call and wait for completion
  const { run, sessions } = await triggerAndWait(client, {
    workflowId: workflow.id,
    payload: { phone: "+1234567890" },
    timeoutMs: 120_000,
  });

  console.log(`Run ${run.id} finished: ${run.status}`);

  // 3. Stream messages from the session
  const session = sessions[0];
  if (session) {
    const stream = await client.sessions.stream(session.id);
    for await (const event of stream) {
      if (event.event === "message") {
        console.log(`[${event.data.role}] ${event.data.content}`);
      }
      if (event.event === "session_ended") break;
    }
  }

  // 4. Clean up
  await client.workflows.delete(workflow.id);
}

main().catch(console.error);
```