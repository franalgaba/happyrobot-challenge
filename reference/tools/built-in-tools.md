> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Built-in Tools

> Default tools that come with voice and text agents

AI agents come with built-in tools that handle common behaviors without requiring custom tool nodes. Some are always available; others activate based on agent configuration.

## Voice agent built-in tools

| Tool              | Internal Name  | Availability | Description                                       |
| ----------------- | -------------- | ------------ | ------------------------------------------------- |
| Hangup            | `_hangup`      | Always       | Ends the call gracefully.                         |
| Voicemail         | `_voice_mail`  | Conditional  | Handles voicemail detection on outbound calls.    |
| Phone Tree / DTMF | `_press_digit` | Conditional  | Presses digits to navigate automated phone menus. |

<AccordionGroup>
  <Accordion title="Hangup">
    Always injected for voice agents. When the agent determines the conversation is complete, it calls this tool to end the call.

    The agent is instructed not to end calls prematurely — before hanging up, it confirms the caller has no further questions and generates a natural goodbye message.

    No configuration is required. This tool is automatically available on every voice agent.
  </Accordion>

  <Accordion title="Voicemail">
    Available on **outbound voice agents only**. Activated when voicemail handling is configured in the agent's settings.

    Three modes are available:

    | Mode       | Behavior                                                                              |
    | ---------- | ------------------------------------------------------------------------------------- |
    | **Hangup** | Silently ends the call when voicemail is detected.                                    |
    | **Fixed**  | Leaves a specific pre-written voicemail message, then hangs up.                       |
    | **AI**     | The agent generates a voicemail message based on the prompt and conversation context. |

    <Info>
      Voicemail detection uses strict rules — the tool is only invoked when the system is confident a voicemail greeting or recording system is active. Background noise, hold music, or brief silences will not trigger it.
    </Info>

    Configure voicemail handling in the outbound voice agent's settings panel. See [Outbound Calls](/voice-agents/outbound-calls) for details.
  </Accordion>

  <Accordion title="Phone Tree / DTMF">
    Enabled when the **Navigate phone trees** toggle is turned on in the voice agent's settings. The agent can press digits (0–9, `*`, `#`) to navigate IVR and automated phone menus.

    **Parameter:**

    | Name  | Type   | Description                                                    |
    | ----- | ------ | -------------------------------------------------------------- |
    | `key` | string | The digit or symbol to press. Valid values: `0`–`9`, `*`, `#`. |

    When enabled, provide a **phone tree prompt** in the agent configuration describing how to navigate the phone menu (e.g., "Press 1 for English, then press 3 for dispatch, then press 0 to speak with an agent.").

    <Tip>
      The phone tree prompt is separate from the agent's main conversation prompt. Use it to give step-by-step instructions for navigating the specific IVR system the agent will encounter.
    </Tip>
  </Accordion>
</AccordionGroup>

## Text agent built-in tools

| Tool             | Internal Name | Availability | Description                              |
| ---------------- | ------------- | ------------ | ---------------------------------------- |
| Terminate        | `_terminate`  | Always       | Ends the agent's chain of thought.       |
| Escalation       | Configurable  | Conditional  | Hands the conversation to a human agent. |
| End Conversation | Configurable  | Conditional  | Gracefully ends the conversation.        |

<AccordionGroup>
  <Accordion title="Terminate">
    Always injected for text agents. The agent calls this tool when it determines there are no more actions to take in the current turn. This is an internal control tool — no message is sent to the user.
  </Accordion>

  <Accordion title="Escalation">
    Activated when escalation is configured in the text agent's settings. Allows the agent to hand off the conversation to a human when it cannot resolve the issue.

    Escalation modes available:

    | Mode                    | Description                                                                                                                                                                                                                                                                                           |
    | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | **None**                | Escalation disabled.                                                                                                                                                                                                                                                                                  |
    | **HappyRobot Platform** | Uses the built-in escalation system within HappyRobot.                                                                                                                                                                                                                                                |
    | **CXone**               | Escalates to NICE CXone contact center. Requires a CXone credential and channel ID.                                                                                                                                                                                                                   |
    | **Richpanel**           | Escalates to a Richpanel helpdesk queue. Requires a Richpanel credential.                                                                                                                                                                                                                             |
    | **Generic Webhook**     | Escalates to any HTTP endpoint. Configure an inbound URL and secret for replies, plus outbound webhooks for **Escalation Start**, **User Message**, and **Escalation End** events. Each outbound hook supports custom headers, body, content type, and authentication (None, API Key, Bearer, Basic). |
    | **Email in Thread**     | Email-specific escalation with three action types (see below).                                                                                                                                                                                                                                        |

    **Email in Thread** action types:

    | Action                   | Behavior                                                                 |
    | ------------------------ | ------------------------------------------------------------------------ |
    | **CC reply with quotes** | CCs a person on a reply that includes the quoted conversation.           |
    | **Forward thread**       | Forwards the entire email thread to the specified recipient.             |
    | **Handoff and end**      | Hands off the conversation to a person and ends the agent's involvement. |

    <Tip>
      Provide clear guidance in the escalation tool's description field about when the agent should escalate — for example, "Escalate if the customer asks to speak with a manager or if you cannot resolve the issue after two attempts."
    </Tip>
  </Accordion>

  <Accordion title="End Conversation">
    Activated when **End conversation** is enabled in the text agent's settings. Lets the agent gracefully close the conversation when the interaction is complete.

    The message behavior is configurable:

    | Type      | Behavior                                                                 |
    | --------- | ------------------------------------------------------------------------ |
    | **AI**    | The agent generates a closing message based on the conversation context. |
    | **Fixed** | A pre-written closing message is sent.                                   |
    | **None**  | The conversation ends silently.                                          |

    Provide a description to guide when the agent should end the conversation (e.g., "End the conversation when the customer confirms their issue is resolved and has no further questions.").
  </Accordion>
</AccordionGroup>

## Naming conflicts

<Warning>
  If you create a custom tool with a name like `stay_silent`, `pause`, `hold`, `mute`, or similar, the platform will display a warning that this capability may already be built in. Review the built-in tools above before creating custom alternatives to avoid unexpected behavior.
</Warning>

## Related

<CardGroup cols={3}>
  <Card title="Creating Tools" icon="wrench" href="/tools/creating-tools">
    Build custom tools with parameters, messages, and child action nodes.
  </Card>

  <Card title="Outbound Calls" icon="phone-arrow-up-right" href="/voice-agents/outbound-calls">
    Configure voicemail handling and phone tree navigation for outbound voice agents.
  </Card>

  <Card title="Text Agents" icon="message" href="/text-agents/overview">
    Set up escalation and end conversation behavior for text agents.
  </Card>
</CardGroup>