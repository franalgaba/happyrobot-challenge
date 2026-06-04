> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# File Operations

> Upload, parse, search, and extract text from files in workflows

File Operations nodes let you work with files in your workflows — upload spreadsheets, parse their contents, search knowledge bases, and extract text from documents and images using OCR.

## File Upload

Upload a CSV, XLS, or XLSX file to make it available for processing in the workflow.

**Configuration:**

* **File** — Drag and drop or click to upload a single file (supported formats: CSV, XLS, XLSX)

The uploaded file is stored and can be referenced by downstream nodes like Parse File.

## Parse File

Parse the contents of an uploaded file into structured data that other nodes can use.

**Configuration:**

* **File** — Reference to a file from a previous File Upload node or other file source (type `@` to select)

The node returns the parsed file contents as structured data — rows and columns for spreadsheets, or text content for other formats.

## Knowledge Base

Search a knowledge base using semantic similarity to find relevant information. Knowledge bases are collections of documents you upload and index for retrieval.

**Configuration:**

* **Knowledge Base** — Select which knowledge base to search
* **File filter** *(optional)* — Restrict search to specific files within the knowledge base
* **Query** — The search query (supports variables — type `@` to insert dynamic values)
* **Strategy** — Search strategy to use
* **Top results** — Number of results to return (1–1000)
* **Max characters** — Maximum total characters across all results
* **Max chunks** — Maximum number of text chunks to return

### Advanced search options

* **Hybrid search** — Combine vector similarity and keyword matching for better results
* **Vector weight** — How much to weight semantic similarity (0–1)
* **Keyword weight** — How much to weight exact keyword matches (0–1)

<Tip>
  For best results, adjust the balance between vector and keyword weights based on your use case. Keyword-heavy searches work well for exact terms like reference numbers, while vector-heavy searches work better for conceptual queries.
</Tip>

See [Knowledge Bases](/assets/knowledge-bases) for how to create and manage knowledge bases.

## OCR Extract

Extract text from documents and images using optical character recognition. Choose between two extraction modes depending on document complexity.

### Standard mode (Gemini)

Fast extraction powered by Google Gemini. Best for simple documents with straightforward layouts.

**Configuration:**

* **Source URI** — URL of the document or image to process (supports variables)
* **Headers** *(optional)* — Custom headers for accessing the source URL
* **Prompt** *(optional)* — Instructions for the extraction model
* **Output schema** *(optional)* — JSON schema defining the structure of extracted data

### Advanced mode (Reducto)

High-accuracy extraction powered by Reducto. Best for complex layouts, multi-column documents, scanned PDFs, and images with tables.

**Configuration:**

* **Source URI** — URL of the document or image to process (supports variables)
* **Headers** *(optional)* — Custom headers for accessing the source URL
* **Prompt** *(optional)* — Instructions for the extraction model
* **Output schema** *(optional)* — JSON schema defining the structure of extracted data

**Advanced options (Reducto only):**

* **Merge overlapping arrays** — Combine arrays that span across pages or sections
* **Complex layout** — Enable enhanced handling for multi-column and non-linear layouts
* **Confidence scores** — Include confidence values for each extracted field
* **Citations** — Include source location references for extracted data
* **Deep Extract** — Agentic extraction with iterative verification for near-perfect accuracy. Best for complex documents. Uses more credits than standard Advanced mode.

## Example

A workflow receives an email with a PDF invoice attached. The OCR Extract node (Advanced mode) processes the attachment URL, extracts the invoice number, line items, and total amount using a JSON schema, then passes the structured data to an AI Generate node to draft a confirmation email.

## Related

<CardGroup cols={2}>
  <Card title="Knowledge Bases" icon="book" href="/assets/knowledge-bases">
    Create and manage knowledge bases for semantic search.
  </Card>

  <Card title="AI Extract" icon="wand-magic-sparkles" href="/core-nodes/ai-extract">
    Extract structured data from text (without OCR).
  </Card>
</CardGroup>