> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Schedule

> Add delays and timing control to workflows

The Schedule node pauses workflow execution for a specified duration or until a specific point in time. Use it for rate limiting, timed follow-ups, waiting for business hours, or any scenario where you need to delay the next step.

## Modes

### Sleep for

Pause execution for a fixed number of seconds.

**Configuration:**

* **Seconds** — The number of seconds to wait before continuing

Supports variables — type `@` in the field to insert a dynamic value from a previous node. This lets you calculate delay durations at runtime.

### Sleep until

Pause execution until a specific date and time.

**Configuration:**

* **Datetime** — The target datetime in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

Supports variables — type `@` to insert a datetime value from a previous node. This lets you schedule based on dynamically determined times.

## Use cases

<AccordionGroup>
  <Accordion title="Rate limiting API calls">
    Add a short delay between webhook requests to avoid hitting rate limits on external APIs. A 1-2 second sleep between loop iterations keeps your requests within limits.
  </Accordion>

  <Accordion title="Timed follow-ups">
    After an initial outbound call, wait 30 minutes before sending a follow-up SMS. Use Sleep For with a calculated delay or Sleep Until with a specific time.
  </Accordion>

  <Accordion title="Business hours scheduling">
    Wait until the next business day before executing a step. Use Sleep Until with a datetime calculated to the next 9:00 AM on a weekday.
  </Accordion>
</AccordionGroup>

<Tip>
  Use a [Custom Code](/core-nodes/custom-code) node before the Schedule node to calculate dynamic delay values. For example, compute the number of seconds until the next business hour and pass it to Sleep For via a variable.
</Tip>

## Related

<CardGroup cols={2}>
  <Card title="Loops" icon="arrows-rotate" href="/core-nodes/loops">
    Combine with loops for rate-limited batch processing.
  </Card>

  <Card title="Variables" icon="brackets-curly" href="/workflows/variables">
    Pass dynamic timing values between nodes.
  </Card>
</CardGroup>