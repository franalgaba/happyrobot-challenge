> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Webhook

> Send and receive HTTP requests in workflows

The Webhook node lets your workflow send HTTP requests to external APIs and receive incoming webhooks from other systems. Use it to call REST APIs, submit form data, fetch remote resources, or trigger workflows from external events.

## HTTP methods

### Incoming Webhook

Receive HTTP requests from external systems to trigger or interact with your workflow. When configured, HappyRobot generates a unique URL that external services can call.

**Configuration:**

* **Webhook URL** — Auto-generated unique URL for receiving requests
* **Security** — Optional authentication requirements for incoming requests

### GET

Fetch data from an external API or resource.

**Configuration:**

* **URL** — The endpoint to request (supports variables — type `@` to insert dynamic values)
* **Query parameters** — Key-value pairs appended to the URL
* **Headers** — Custom HTTP headers
* **Authentication** — See [Authentication](#authentication) below

### POST

Send data to an external API.

**Configuration:**

* **URL** — The endpoint to send data to (supports variables)
* **Headers** — Custom HTTP headers
* **Body** — The request payload (see [Body modes](#body-modes) below)
* **Content type** — The format of the request body
* **Authentication** — See [Authentication](#authentication) below
* **Error handling** — See [Error handling](#error-handling) below

### PUT

Replace a resource on an external API. Configuration is the same as POST.

### PATCH

Partially update a resource on an external API. Configuration is the same as POST.

## Authentication

Configure how the webhook authenticates with the target API.

| Method           | Description                                               |
| ---------------- | --------------------------------------------------------- |
| **None**         | No authentication                                         |
| **API Key**      | Send an API key as a header or query parameter            |
| **Bearer Token** | Send a token in the `Authorization: Bearer` header        |
| **Basic Auth**   | Send username and password with HTTP Basic authentication |
| **OAuth2**       | Use OAuth2 client credentials flow                        |

All authentication values support variables — type `@` to insert credentials stored in [environment variables](/settings/environment-variables).

## Body modes

For POST, PUT, and PATCH requests, choose how to define the request body:

* **Builder** — Visual key-value editor. Add fields by name and value, with variable support on each field. Best for simple payloads.
* **Raw** — A free-form text area for writing the full request body. Use this for complex JSON structures, nested objects, or non-JSON formats.

## Content types

| Content Type                        | Use for                     |
| ----------------------------------- | --------------------------- |
| `application/json`                  | JSON payloads (most common) |
| `application/x-www-form-urlencoded` | Form submissions            |
| `application/xml`                   | XML payloads                |

## Error handling

* **Ignore 5XX errors** — When enabled, the workflow continues even if the API returns a server error (500-599). When disabled, 5XX responses cause the node to fail.
* **XSS protection** — Toggle to enable cross-site scripting protection on incoming data.

## Example

After a voice agent extracts load details, the Webhook node sends a POST request to a TMS API with the structured data as a JSON body, using a Bearer token stored in environment variables for authentication.

<Tip>
  Store API keys and tokens as [environment variables](/settings/environment-variables) and reference them with `@` in the authentication fields. Never hardcode credentials in webhook configurations.
</Tip>

## Related

<CardGroup cols={2}>
  <Card title="Integrations" icon="plug" href="/integrations/overview">
    Pre-built integrations that don't require manual webhook setup.
  </Card>

  <Card title="Custom Code" icon="code" href="/core-nodes/custom-code">
    Transform data before or after webhook requests.
  </Card>
</CardGroup>