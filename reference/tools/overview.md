> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Tools Overview

> Introduction to tools in HappyRobot

Tools are functions attached to prompt nodes (voice and text agents) that the AI agent can invoke mid-conversation. When a tool is triggered, the agent pauses the conversation, executes the tool's logic, and uses the result to continue — enabling lookups, actions, and integrations without leaving the call or chat.

## Use cases

<CardGroup cols={3}>
  <Card title="Look up data" icon="magnifying-glass">
    Query a TMS, CRM, or database to retrieve real-time information during a conversation.
  </Card>

  <Card title="Trigger actions" icon="bolt">
    Send emails, create records, or call webhooks based on what the caller or user says.
  </Card>

  <Card title="Transfer calls" icon="phone-arrow-right">
    Navigate phone trees, press DTMF digits, or escalate to a human agent.
  </Card>
</CardGroup>

## How tools work

When an agent decides to use a tool, the following happens:

1. The agent identifies which tool to call and fills in the required parameters from the conversation context.
2. The platform executes the tool — running any child action nodes (webhooks, integrations, custom code) attached to it.
3. The result is returned to the agent, which incorporates it into the ongoing conversation.

<Info>
  Tools can have child action nodes nested beneath them in the workflow editor. These child nodes run when the tool is invoked and their output is passed back to the agent. See [Creating Tools](/tools/creating-tools) for details.
</Info>

## Tool types

<CardGroup cols={3}>
  <Card title="Custom tools" icon="wrench" href="/tools/creating-tools">
    Build your own tools with custom parameters, messages, and child action nodes.
  </Card>

  <Card title="Built-in tools" icon="cube" href="/tools/built-in-tools">
    Default tools that come with voice and text agents — hangup, voicemail, escalation, and more.
  </Card>

  <Card title="MCP tools" icon="plug" href="/tools/mcp">
    Import tools from external Model Context Protocol servers.
  </Card>
</CardGroup>

## Adding a tool

<Steps>
  <Step title="Open a prompt node">
    In the workflow editor, select the voice or text agent prompt node you want to add tools to.
  </Step>

  <Step title="Add a tool">
    Click the **+** button below the agent node and select **Tool**. A new tool node appears as a child of the prompt node.
  </Step>

  <Step title="Configure the tool">
    Give the tool a name, description, parameters, and message behavior. Optionally add child action nodes that execute when the tool is called.
  </Step>
</Steps>

## Related

<CardGroup cols={2}>
  <Card title="Node Types" icon="diagram-project" href="/workflows/node-types">
    Learn about all node types available in workflows.
  </Card>

  <Card title="Voice Agents" icon="microphone" href="/voice-agents/overview">
    Build AI-powered voice agents for inbound and outbound calls.
  </Card>
</CardGroup>