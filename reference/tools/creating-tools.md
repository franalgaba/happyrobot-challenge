> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Creating Tools

> How to create and configure tools for your agents

Custom tools let you define functions that your voice or text agent can call during a conversation. Each tool has a description (so the agent knows when to use it), parameters (the data the agent passes in), and a message configuration (what the caller hears or the user sees while the tool runs).

## Configuration

### Description

A rich-text description that tells the agent what this tool does and when to use it. The description is passed directly to the language model as part of the tool definition.

Supports variables — type `@` in the editor to insert values from previous nodes or workflow variables.

<Tip>
  Write the description from the agent's perspective. Instead of "This tool looks up load status", write "Use this tool when the caller asks about the status of a load. Requires a reference number."
</Tip>

### Message

Controls what happens while the tool is executing — what the caller hears (voice) or the user sees (text).

| Type      | Behavior                                                                                               | Configuration                                                             |
| --------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **AI**    | The agent generates a natural message before executing the tool (e.g., "Let me look that up for you.") | Optional description to guide the AI's message. Optional example message. |
| **Fixed** | A pre-written message is played or sent exactly as configured.                                         | Enter the exact message text.                                             |
| **None**  | No message — the tool runs silently.                                                                   | No additional configuration.                                              |

<AccordionGroup>
  <Accordion title="AI message">
    The agent generates a contextual message based on the conversation. You can provide a description (e.g., "Tell the caller you're checking their load status") and an example message to guide the tone.
  </Accordion>

  <Accordion title="Fixed message">
    A specific message that plays or sends every time the tool is invoked, regardless of context. Useful when you want consistent phrasing like "One moment while I check that for you."
  </Accordion>

  <Accordion title="No message">
    The tool executes silently. Best for fast-executing tools where a message would feel unnecessary or disruptive.
  </Accordion>
</AccordionGroup>

### Parameters

Parameters define the data the agent must collect from the conversation before calling the tool.

| Field           | Required | Description                                                                                  |
| --------------- | -------- | -------------------------------------------------------------------------------------------- |
| **Name**        | Yes      | The parameter key (e.g., `reference_number`, `email_address`).                               |
| **Description** | Yes      | Tells the agent what this parameter represents and how to extract it from the conversation.  |
| **Example**     | No       | A sample value to guide the model (e.g., `"ABC-12345"`).                                     |
| **Required**    | No       | When toggled on, the agent must collect this value before calling the tool. Defaults to off. |

<Info>
  Parameter values become available as variables in the tool's child action nodes. For example, a parameter named `reference_number` can be referenced as `@reference_number` in a child Webhook node's URL or body.
</Info>

### Hold music

Controls what the caller hears while the tool's child nodes execute (voice agents only).

| Option         | Description                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| **Acoustic**   | Built-in acoustic background music.                                          |
| **Ring tones** | Built-in ring tone audio.                                                    |
| **Custom**     | Upload or select a custom audio file from [Assets > Voices](/assets/voices). |
| **None**       | Silence while the tool runs.                                                 |

<Tip>
  For tools that execute quickly (under 1–2 seconds), consider setting hold music to **None** to avoid an abrupt audio clip.
</Tip>

### End call after tool

For voice agents, you can configure the tool to end the call immediately after its child nodes finish executing. Enable **End call after this tool** in the tool's Advanced settings. The call ends as soon as the tool returns — no further turn from the agent.

When end call is enabled, you can add custom SIP **BYE headers** that are sent on the BYE message back to the carrier. Useful for passing routing or metadata to your SBC or downstream systems. Each header is a key/value pair, and values support [variables](/workflows/variables).

Common header examples: `X-RouteReason`, `X-RouteType`, `X-RouteValue`, `X-MetaData`.

## Child nodes

Tools can have action nodes nested beneath them in the workflow editor. When the agent invokes the tool, these child nodes execute in sequence and their output is returned to the agent.

Common child node types include:

* **Webhook** — call an external API with the tool's parameters.
* **Custom Code** — run JavaScript or Python logic.
* **Integration actions** — interact with connected services (TMS, CRM, etc.).

The final child node's output is what the agent receives as the tool's result.

## Example

A freight broker's voice agent needs to look up load status during calls.

1. **Tool name:** `check_load_status`
2. **Description:** "Use this tool when the caller asks about the status of their load or shipment. Requires a reference number."
3. **Parameters:** `reference_number` (required) — "The load reference number, e.g., ABC-12345."
4. **Message:** AI — "Tell the caller you're checking their load status."
5. **Hold music:** Ring tones
6. **Child node:** A Webhook node that calls the TMS API with `@reference_number` and returns the load status.

When a caller says "Can you check on load ABC-12345?", the agent extracts the reference number, says "Let me check on that for you", plays ring tones while the webhook runs, and then relays the result back to the caller.

## Related

<CardGroup cols={2}>
  <Card title="MCP Tools" icon="plug" href="/tools/mcp">
    Import tools from external MCP servers instead of building them manually.
  </Card>

  <Card title="Webhook" icon="globe" href="/core-nodes/webhook">
    Call external APIs from your workflows.
  </Card>
</CardGroup>