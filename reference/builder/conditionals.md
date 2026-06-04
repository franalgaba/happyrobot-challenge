> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Conditionals

> Add branching logic to your workflows

Conditional nodes let you route your workflow down different paths based on data values. There are two types: **Paths** for routing execution through different branches, and **Conditional Output** for returning different values based on conditions.

## Paths

Paths split your workflow into multiple branches. Each path has a set of conditions — when a path's conditions are met, the workflow follows that branch.

### Evaluation policies

Control how paths are evaluated when multiple paths match:

| Policy                  | Behavior                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Use first evaluated** | Execute the first path whose conditions match (top to bottom). Other matching paths are skipped. |
| **Use last evaluated**  | Execute the last path whose conditions match.                                                    |
| **Use all evaluated**   | Execute every path whose conditions match. Multiple branches run in parallel.                    |

### Path ordering

Paths are evaluated in the order they appear in the editor. Drag and drop paths to reorder them. For "use first evaluated" mode, put more specific conditions above general ones.

Each path contains its own sequence of nodes that execute when the path is taken. Add a fallback path with no conditions to handle cases where nothing else matches.

### Branch merges (V3 only)

Branch merges let multiple parallel branches converge back into a single shared continuation node. Use this when you want branches from a Paths node to rejoin and continue execution together after their individual steps complete.

To create a merge, connect the terminal node of one branch to a node in another branch — that target node becomes the merge anchor. You can merge into any node in the receiving branch, not just the terminal node.

<Note>
  Branch merges require the **V3 workflow engine**. On V2, merges are not available. Upgrade by hovering the engine badge in the top-left corner of the workflow editor and clicking **Upgrade**.
</Note>

## Conditional Output

Conditional Output nodes evaluate conditions and return a single value without branching the workflow. Use them when you need to set a variable's value based on logic rather than splitting execution.

### Condition builder

Build conditions using AND/OR logic:

* **AND groups** — All conditions in the group must be true
* **OR groups** — Any condition in the group can be true
* Nest AND groups inside OR groups for complex logic

Each condition has three parts:

* **Field** — The value to evaluate (type `@` to select from available variables)
* **Operator** — The comparison to perform
* **Value** — The value to compare against

### Available operators

| Operator                | Description                        |
| ----------------------- | ---------------------------------- |
| `equals`                | Exact match                        |
| `not_equals`            | Does not match                     |
| `contains`              | Text includes substring            |
| `not_contains`          | Text does not include substring    |
| `starts_with`           | Text begins with value             |
| `ends_with`             | Text ends with value               |
| `is_empty`              | Field is empty, null, or undefined |
| `is_not_empty`          | Field has a value                  |
| `greater_than`          | Numeric greater than               |
| `less_than`             | Numeric less than                  |
| `greater_than_or_equal` | Numeric greater than or equal      |
| `less_than_or_equal`    | Numeric less than or equal         |

### Fallback output

Define a default value that is returned when no conditions match. This ensures the node always produces output.

### Key name

Set the output field name for the conditional result. Downstream nodes reference this name when accessing the value via the `@` picker.

## Example

After an AI Classify node categorizes a call outcome, a Paths node routes the workflow: `completed` goes to the TMS update branch, `voicemail` goes to the retry branch, and a fallback path sends an alert to Slack.

## Related

<CardGroup cols={2}>
  <Card title="AI Classify" icon="tags" href="/core-nodes/ai-classify">
    Classify text to drive conditional logic.
  </Card>

  <Card title="Node Types" icon="shapes" href="/workflows/node-types">
    Learn about condition nodes and other node types.
  </Card>
</CardGroup>