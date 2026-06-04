> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# AI Extract

> Extract structured data from unstructured text using AI

The AI Extract node uses a language model to pull structured data out of unstructured text. Give it a block of text — an email, a transcript, a document — and define the fields you want extracted. The node returns a clean, structured object with named values.

## Use cases

<CardGroup cols={3}>
  <Card title="Parse emails" icon="envelope">
    Extract sender, subject, dates, and key details from email bodies.
  </Card>

  <Card title="Extract entities" icon="bullseye">
    Pull names, phone numbers, addresses, and other entities from free-form text.
  </Card>

  <Card title="Structure documents" icon="file-lines">
    Convert unstructured documents into structured records with named fields.
  </Card>
</CardGroup>

## Configuration

### Model

Select the AI model to use for extraction.

| Model         | ID             | Notes                                              |
| ------------- | -------------- | -------------------------------------------------- |
| GPT-4.1       | `gpt-4.1`      | **Default** — best accuracy for complex extraction |
| GPT-4.1 mini  | `gpt-4.1-mini` | Faster, lower cost                                 |
| GPT-4.1 nano  | `gpt-4.1-nano` | Ultra-low latency                                  |
| GPT-4 (Turbo) | `gpt-4`        | Legacy turbo model                                 |
| GPT-5         | `gpt-5`        | Next-gen flagship                                  |
| GPT-5 mini    | `gpt-5-mini`   | Fast and capable                                   |
| GPT-5 nano    | `gpt-5-nano`   | Ultra-low latency                                  |
| o1            | `o1`           | Reasoning model                                    |
| o3            | `o3`           | Reasoning model                                    |
| o3 mini       | `o3-mini`      | Cost-efficient reasoning                           |
| o4 mini       | `o4-mini`      | Fast reasoning                                     |

### Prompt

System instructions that tell the model how to extract data. Use this to provide context about what the input text represents and any special extraction rules.

Supports variables — type `@` in the editor to insert values from previous nodes.

### Input

The text to extract data from. This is typically a variable reference to output from a previous node — a transcript, email body, or document content.

Supports variables — type `@` to pick from available node outputs.

### Extraction mode

Choose how to define the structure of extracted data:

<AccordionGroup>
  <Accordion title="Parameters mode">
    Define named parameters visually. For each parameter, configure:

    * **Name** — The field name in the output (e.g., `pickup_city`, `weight`)
    * **Description** — What this field represents (helps the model extract accurately)
    * **Example** — A sample value to guide the model
    * **Required** — Whether the field must be present in the output

    Add as many parameters as needed. The node returns an object with each parameter as a key.
  </Accordion>

  <Accordion title="JSON Schema mode">
    Provide a raw JSON schema that defines the extraction structure. This gives you full control over nested objects, arrays, enums, and complex types.

    The schema must be OpenAI-compatible with `additionalProperties: false` set on all object types (strict mode requirement).

    ```json theme={null}
    {
      "type": "object",
      "properties": {
        "pickup_city": { "type": "string" },
        "delivery_city": { "type": "string" },
        "weight_lbs": { "type": "number" }
      },
      "required": ["pickup_city", "delivery_city"],
      "additionalProperties": false
    }
    ```
  </Accordion>
</AccordionGroup>

## Example

An email arrives with load details. The AI Extract node receives the email body as input and extracts `origin`, `destination`, `weight`, `pickup_date`, and `reference_number` into structured fields that downstream nodes can use to create a TMS record.

<Tip>
  When using JSON Schema mode, every object in your schema must include `"additionalProperties": false`. This is required by OpenAI's strict mode — extraction will fail without it.
</Tip>

<Info>
  Prompt nodes (voice and text agents) support a broader model selection including Google Gemini, Anthropic Claude, and other providers. See [STT, TTS & LLM Configuration](/voice-agents/stt-tts-llm-configuration) for the full list of agent models.
</Info>

## Related

<CardGroup cols={2}>
  <Card title="AI Classify" icon="tags" href="/core-nodes/ai-classify">
    Classify text into predefined categories.
  </Card>

  <Card title="AI Generate" icon="sparkles" href="/core-nodes/ai-generate">
    Generate text content using AI.
  </Card>
</CardGroup>