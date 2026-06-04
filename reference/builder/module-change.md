> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Module Change

> Jump to a different module within a workflow

The Module Change node transfers workflow execution to a different module. Use it to break complex workflows into reusable, modular components — a shared notification module, a common data validation sequence, or any logic you want to reuse across workflows.

## Configuration

### Module

Select the target module to jump to. The dropdown lists all available modules in your workflow.

### Context

Define key-value pairs that are passed as variables to the target module. Each entry maps a key name to a value:

* **Key** — The variable name available inside the target module
* **Value** — The value to pass (supports variables — type `@` to insert outputs from previous nodes)

Variables defined here are accessible in the target module just like any other workflow variable.

## How module context works

When the Module Change node executes, it:

1. Packages the context key-value pairs into a variable set
2. Transfers execution to the first node of the target module
3. Makes context variables available to all nodes in the target module via the `@` picker
4. Returns execution to the calling workflow when the target module completes

## Use cases

<AccordionGroup>
  <Accordion title="Reusable notification sequences">
    Create a "Send Notification" module that handles email, SMS, and Slack alerts. Jump to it from any workflow by passing the recipient, channel, and message as context variables.
  </Accordion>

  <Accordion title="Shared data validation">
    Build a validation module that checks and normalizes phone numbers, addresses, or other data. Multiple workflows can call it without duplicating logic.
  </Accordion>

  <Accordion title="Splitting complex workflows">
    Break a large automation into logical sections — intake, processing, and follow-up — each as a separate module. The main workflow uses Module Change nodes to orchestrate them in sequence.
  </Accordion>
</AccordionGroup>

## Example

An inbound call workflow extracts load details and needs to send a formatted update to the operations team. Instead of building the notification logic inline, it uses a Module Change node to jump to the "Ops Notification" module, passing `load_number`, `status`, and `carrier_name` as context. The notification module formats and sends the message, then execution returns to the main workflow.

## Related

<CardGroup cols={2}>
  <Card title="Node Types" icon="shapes" href="/workflows/node-types">
    Learn about module change nodes and other node types.
  </Card>

  <Card title="Variables" icon="brackets-curly" href="/workflows/variables">
    How variables flow between nodes and modules.
  </Card>
</CardGroup>