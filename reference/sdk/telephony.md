> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Telephony

> Manage phone numbers and SIP trunks with the TypeScript SDK

Manage your telephony infrastructure including phone number purchasing and SIP trunk configuration.

## Phone numbers

Purchase, configure, and manage phone numbers. Use this to buy numbers, set up toll-free verification, and assign numbers to workflows.

| Method                                        | HTTP                                               | Description                       |
| --------------------------------------------- | -------------------------------------------------- | --------------------------------- |
| `list(query?)`                                | `GET /phone-numbers`                               | List all phone numbers            |
| `buy(body)`                                   | `POST /phone-numbers`                              | Purchase a new phone number       |
| `update(id, body)`                            | `PUT /phone-numbers/:id`                           | Update name or caller ID          |
| `getUsage(id)`                                | `GET /phone-numbers/:id/usage`                     | Get usage info                    |
| `getTollFreeVerification(id)`                 | `GET /phone-numbers/:id/tollfree-verification`     | Get toll-free verification status |
| `createTollFreeVerification(id, body)`        | `POST /phone-numbers/:id/tollfree-verification`    | Start toll-free verification      |
| `deleteTollFreeVerification(verificationSid)` | `DELETE /phone-numbers/tollfree-verification/:sid` | Delete a toll-free verification   |
| `createSipTrunk(id)`                          | `POST /phone-numbers/:id/sip-trunk`                | Create a SIP trunk for a number   |
| `freeUp(id)`                                  | `POST /phone-numbers/:id/free-up-number`           | Release a number from workflows   |
| `delete(id)`                                  | `POST /phone-numbers/:id/delete-number`            | Permanently delete a number       |
| `removeFromWorkflow(id, body)`                | `POST /phone-numbers/:id/remove-from-workflow`     | Remove from a specific workflow   |
| `validateTollFreeNumbers(body)`               | `POST /phone-numbers/validate-toll-free-numbers`   | Check for conflicts               |

**List phone numbers**

```ts theme={null}
const numbers = await client.phoneNumbers.list();
```

**Buy a phone number**

```ts theme={null}
await client.phoneNumbers.buy({ area_code: "415" });
```

<Warning>
  Phone number purchases are rate limited to one every 10 minutes through the API.
</Warning>

**Toll-free verification**

```ts theme={null}
// Check verification status
const status = await client.phoneNumbers.getTollFreeVerification("number-id");

// Start verification
await client.phoneNumbers.createTollFreeVerification("number-id", {
  business_name: "Acme Corp",
  business_website: "https://acme.com",
  use_case: "Customer outreach",
  // ... additional required fields
});

// Validate numbers before verification
await client.phoneNumbers.validateTollFreeNumbers({
  phone_numbers: ["+18005551234"],
});
```

***

## SIP trunks

Create and manage SIP trunks for custom telephony providers. Use this when you need to connect your own SIP infrastructure instead of using platform-managed phone numbers.

| Method                  | HTTP                      | Description                       |
| ----------------------- | ------------------------- | --------------------------------- |
| `list()`                | `GET /sip-trunks`         | List all SIP trunks               |
| `listOptions()`         | `GET /sip-trunks/options` | Lightweight list of trunk options |
| `create(body)`          | `POST /sip-trunks`        | Create a SIP trunk                |
| `createBulk(body)`      | `POST /sip-trunks/bulk`   | Create multiple SIP trunks        |
| `get(trunkId)`          | `GET /sip-trunks/:id`     | Get a SIP trunk                   |
| `update(trunkId, body)` | `PUT /sip-trunks/:id`     | Update a SIP trunk                |
| `delete(trunkId)`       | `DELETE /sip-trunks/:id`  | Delete a SIP trunk                |

```ts theme={null}
// List trunks
const trunks = await client.sipTrunks.list();

// List trunk options (lightweight)
const options = await client.sipTrunks.listOptions();

// Create a trunk
await client.sipTrunks.create({ name: "Main Trunk", ... });

// Create multiple trunks
await client.sipTrunks.createBulk({ trunks: [...] });

// Get, update, delete
const trunk = await client.sipTrunks.get("trunk-id");
await client.sipTrunks.update("trunk-id", { name: "Updated" });
await client.sipTrunks.delete("trunk-id");
```