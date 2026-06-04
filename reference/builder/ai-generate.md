> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# AI Generate

> Generate text content using AI

The AI Generate node uses a language model to produce text content. Provide a prompt with instructions and context, and the node returns generated text — a draft email, a summary, a formatted response, or any other text output.

## Use cases

<CardGroup cols={3}>
  <Card title="Draft responses" icon="pen">
    Generate follow-up emails, SMS messages, or chat replies based on conversation context.
  </Card>

  <Card title="Summarize content" icon="file-lines">
    Condense long transcripts, documents, or data into concise summaries.
  </Card>

  <Card title="Create content" icon="sparkles">
    Produce formatted text, reports, or structured output from raw data.
  </Card>
</CardGroup>

## Configuration

### Model

Select the AI model to use for generation. Default is **GPT-5 mini**.

See [AI Extract](/core-nodes/ai-extract#model) for the full list of available models.

### Prompt

The generation instructions. This is where you define what the model should produce, including format, tone, and any specific content requirements.

Supports variables — type `@` in the editor to insert values from previous nodes. Use variables to inject dynamic context like transcripts, extracted data, or customer information.

## Output

The node returns the generated text as a string. Downstream nodes can use this output in emails, messages, API requests, or any other text field.

## Example

After a voice agent completes a call, the AI Generate node receives the transcript and extracted load details. Its prompt instructs: "Write a professional follow-up email summarizing the call and confirming the load details." The generated email is then sent via a Gmail action node.

<Tip>
  Use variables liberally in your prompt to inject context. The more relevant data you provide, the better the generated output. For example: "Summarize the following transcript for @customer\_name: @call\_transcript".
</Tip>

<Info>
  Prompt nodes (voice and text agents) support a broader model selection including Google Gemini, Anthropic Claude, and other providers. See [STT, TTS & LLM Configuration](/voice-agents/stt-tts-llm-configuration) for the full list of agent models.
</Info>

## Related

<CardGroup cols={2}>
  <Card title="AI Extract" icon="wand-magic-sparkles" href="/core-nodes/ai-extract">
    Extract structured data from unstructured text.
  </Card>

  <Card title="AI Classify" icon="tags" href="/core-nodes/ai-classify">
    Classify text into predefined categories.
  </Card>
</CardGroup>