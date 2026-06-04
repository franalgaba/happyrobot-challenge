> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Loops

> Iterate over collections or repeat actions a fixed number of times

The Loop node repeats a sequence of workflow steps — either iterating over a collection of items or running a fixed number of times. Any combination of nodes can be placed inside the loop body.

## Configuration

### Mode

Choose how the loop determines its iterations:

* **Fixed count** — Run a set number of iterations
* **Collection** — Iterate over each item in an array

### Iterate for

*(Fixed count mode)* The number of times to repeat the loop body. Supports variables — type `@` to insert a dynamic count from a previous node.

### Iterate over

*(Collection mode)* A variable reference to an array. The loop runs once for each item in the array. Type `@` to select a variable.

For example, if a previous node outputs a list of phone numbers, select that output and the loop body executes once per phone number.

### Loop variable

The name used to reference the current iteration's item inside the loop body. Defaults to `iteration_element`.

Must match the pattern `[a-zA-Z_][a-zA-Z0-9_]*` (letters, numbers, and underscores, starting with a letter or underscore).

Inside the loop, type `@` in any field and select the loop variable name to access the current item.

### Execute in parallel

Toggle to run all iterations concurrently instead of sequentially.

* **Off (default)** — Iterations run one after another in order. Use when order matters or when calling rate-limited APIs.
* **On** — All iterations run at the same time. Use for independent operations where speed matters.

## How loop variables work

Inside the loop body, the current iteration's item is available under the loop variable name. If your loop variable is `iteration_element`:

* **In collection mode:** `iteration_element` holds the current item from the array (could be a string, number, or object)
* **In fixed count mode:** `iteration_element` holds the current iteration index (starting from 0)

Reference the loop variable by typing `@` in any node field inside the loop and selecting it from the picker.

### Variables from parallel loops

When **Execute in parallel** is enabled and a downstream node outside the loop references an output variable from inside the loop, that variable resolves to a list — one value per iteration. The variable picker shows a blue `[]` suffix next to the variable name to indicate this, and hovering shows the tooltip "Resolves to a list (parallel loop)". Variable groups from parallel loops also display a blue **List** badge in the picker header.

For example, if a node inside the loop produces a `result` variable and you reference it from a node after the Loop End, the variable resolves as a list `[result_iteration_1, result_iteration_2, ...]`.

Use an AI Generate node or custom code node after the loop to aggregate or process this list.

## Output schema generation

Loop nodes support output schema generation through the Testing Drawer, the same mechanism used for action and event nodes.

Click **Generate Output Schema** in the loop node's configure panel footer to open the Testing Drawer. Run the loop with sample data to capture its output structure. Once generated, downstream nodes can reference the loop's output variables using the `@` picker.

The button is disabled until the loop node is fully configured (mode, iteration source, and loop variable all set). Once a schema is generated, the button label changes to **View Output Schema**. You can regenerate it any time by running another test.

<Info>
  Without a generated schema, the loop node's outputs are not available in the variable picker for downstream nodes. Generate a schema after building and testing your loop body to unlock variable access.
</Info>

## Loop End

When you add a Loop node, a **Loop End** marker is automatically placed to define where the loop body ends. All nodes between the Loop node and Loop End are executed on each iteration. Nodes after Loop End continue with normal (non-looping) execution.

## Example

A previous node returns an array of 50 phone numbers to call. The Loop node iterates over the collection, and inside the loop body, an outbound voice agent node calls `iteration_element` (the current phone number) with a Schedule node adding a 2-second delay between iterations for rate limiting.

<Info>
  Loop nodes appear as a container in the workflow editor. Drag nodes into the loop body to include them in each iteration. The Loop End marker closes the container automatically.
</Info>

## Related

<CardGroup cols={2}>
  <Card title="Schedule" icon="clock" href="/core-nodes/schedule">
    Add delays between loop iterations for rate limiting.
  </Card>

  <Card title="Conditionals" icon="code-branch" href="/core-nodes/conditionals">
    Add branching logic inside loop bodies.
  </Card>
</CardGroup>