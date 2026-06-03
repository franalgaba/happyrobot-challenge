> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrations

> Discover integrations and access Google Sheets, Slack, Teams, Twilio SMS, and WhatsApp sub-resources

Discover available integrations and access sub-resources for specific services like Google Sheets, Slack, and WhatsApp.

## Integrations (core)

List integrations, get details, and create credentials. Use this to browse all available integrations and set up authentication for form-based integrations.

| Method                       | HTTP                                       | Description                                      |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------ |
| `list(query?)`               | `GET /integrations`                        | List all integrations                            |
| `get(id)`                    | `GET /integrations/:id`                    | Get integration and its events                   |
| `createCredential(id, body)` | `POST /integrations/:id/create-credential` | Create a credential for a form-based integration |

```ts theme={null}
const integrations = await client.integrations.list();
const integration = await client.integrations.get("integration-id");
await client.integrations.createCredential("integration-id", {
  name: "My Creds",
  fields: { api_key: "..." },
});
```

***

## Google Sheets

Read spreadsheet data through the Google Sheets sub-resource. Use this to list spreadsheets, worksheets, columns, and rows from connected Google Sheets accounts.

| Method                              | HTTP                                           | Description                      |
| ----------------------------------- | ---------------------------------------------- | -------------------------------- |
| `googleSheets.spreadsheets(query?)` | `GET /integrations/google-sheets/spreadsheets` | List spreadsheets                |
| `googleSheets.worksheets(query)`    | `GET /integrations/google-sheets/worksheets`   | List worksheets in a spreadsheet |
| `googleSheets.columns(query)`       | `GET /integrations/google-sheets/columns`      | List columns in a worksheet      |
| `googleSheets.rows(query)`          | `GET /integrations/google-sheets/rows`         | List rows in a worksheet         |

```ts theme={null}
const sheets = await client.integrations.googleSheets.spreadsheets();
const worksheets = await client.integrations.googleSheets.worksheets({
  spreadsheet_id: "...",
});
const columns = await client.integrations.googleSheets.columns({
  spreadsheet_id: "...",
  worksheet_id: "...",
});
const rows = await client.integrations.googleSheets.rows({
  spreadsheet_id: "...",
  worksheet_id: "...",
});
```

***

## Slack

List Slack channels and users. Use this to discover available channels and users from your connected Slack workspace.

| Method                   | HTTP                               | Description         |
| ------------------------ | ---------------------------------- | ------------------- |
| `slack.channels(query?)` | `GET /integrations/slack/channels` | List Slack channels |
| `slack.users(query?)`    | `GET /integrations/slack/users`    | List Slack users    |

```ts theme={null}
const channels = await client.integrations.slack.channels();
const users = await client.integrations.slack.users();
```

***

## Microsoft Teams

List Teams teams, channels, and users. Use this to discover resources from your connected Microsoft Teams organization.

| Method                   | HTTP                               | Description                   |
| ------------------------ | ---------------------------------- | ----------------------------- |
| `teams.teams(query?)`    | `GET /integrations/teams/teams`    | List Microsoft Teams teams    |
| `teams.channels(query?)` | `GET /integrations/teams/channels` | List Microsoft Teams channels |
| `teams.users(query?)`    | `GET /integrations/teams/users`    | List Microsoft Teams users    |

```ts theme={null}
const teams = await client.integrations.teams.teams();
const channels = await client.integrations.teams.channels();
const users = await client.integrations.teams.users();
```

***

## Twilio SMS

List Twilio SMS phone numbers. Use this to see which phone numbers are available from your connected Twilio account.

| Method                           | HTTP                                         | Description             |
| -------------------------------- | -------------------------------------------- | ----------------------- |
| `twilioSms.phoneNumbers(query?)` | `GET /integrations/twilio-sms/phone-numbers` | List Twilio SMS numbers |

```ts theme={null}
const numbers = await client.integrations.twilioSms.phoneNumbers();
```

***

## WhatsApp

Manage WhatsApp businesses, accounts, phone numbers, and message templates. Use this to browse your WhatsApp Business API resources and available message templates.

| Method                             | HTTP                                           | Description                     |
| ---------------------------------- | ---------------------------------------------- | ------------------------------- |
| `whatsApp.businesses(query)`       | `GET /integrations/whatsapp/businesses`        | List WhatsApp businesses        |
| `whatsApp.businessAccounts(query)` | `GET /integrations/whatsapp/business-accounts` | List WhatsApp business accounts |
| `whatsApp.phoneNumbers(query)`     | `GET /integrations/whatsapp/phone-numbers`     | List WhatsApp phone numbers     |
| `whatsApp.messageTemplates(query)` | `GET /integrations/whatsapp/message-templates` | List WhatsApp message templates |

```ts theme={null}
const businesses = await client.integrations.whatsApp.businesses({
  credential_id: "...",
});
const accounts = await client.integrations.whatsApp.businessAccounts({
  credential_id: "...",
  business_id: "...",
});
const numbers = await client.integrations.whatsApp.phoneNumbers({
  credential_id: "...",
  business_account_id: "...",
});
const templates = await client.integrations.whatsApp.messageTemplates({
  credential_id: "...",
  business_account_id: "...",
});
```