> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Call Workflow

> Invoke another workflow and wait for its response

The Call Workflow node lets you invoke a separate workflow from within your current one and wait for it to complete. The child workflow runs as its own execution and returns its response data to the parent workflow, which continues once the result arrives.

<Note>
  This feature is only available for workflows using the V3 engine.
</Note>

Use this node to:

* Break complex logic into reusable sub-workflows
* Delegate specialized tasks (data enrichment, validation, external lookups) to dedicated workflows
* Share processing logic across multiple parent workflows without duplicating configuration

## Configuration

### Target workflow

Select the workflow to invoke:

* **Static** — Pick a workflow from the dropdown. Only workflows with a trigger of Predefined request, Incoming Hook, or Workflow Function Request are available; the current workflow is excluded.
* **Dynamic** — Use a [variable](/workflows/variables) that resolves to a workflow ID at runtime.

### Response node

Select the **response node** in the target workflow whose output this node should capture. The response node's output schema determines which fields are available as outputs in the parent workflow.

Only nodes marked as response points in the target workflow appear in this selector. To mark a node as a response node, open that workflow, click the node, and enable **Mark this node as a response node** in the node's configuration panel. Trigger nodes cannot be marked as response nodes.

When the target workflow is set dynamically (via a variable), the **Workflow for Testing** picker lets you designate a static workflow for schema and response node lookup during configuration. This selection is used only at design time — at runtime, the actual target is resolved from the variable.

### Version

Choose which version of the target workflow to execute. If left unset, the node always runs the latest published version.

### Environment

By default, the child workflow runs in the same environment as the calling workflow (**Use caller environment** is on). To pin the child workflow to a specific environment regardless of where the parent runs, disable this toggle and select **Staging** or **Production**.

### Timeout

Set the maximum number of seconds the parent workflow waits for the child workflow to reach its response node. If the timeout elapses before the child responds, the parent workflow proceeds with an empty output from this node — the child workflow continues running independently.

### Payload

Pass data to the child workflow at invocation time. The child workflow receives this data as trigger variables. Two input modes are available:

* **Builder** — Add individual key-value pairs. Values support [variables](/workflows/variables) via the `@` picker.
* **Raw** — Enter a JSON body directly, with variable templating.

## Output

The output of this node matches the output schema of the selected response node in the target workflow. Reference output fields in downstream nodes using the `@` variable picker, the same way you reference any other node output.

## How it works

<Steps>
  <Step title="Parent workflow reaches the Call Workflow node">
    When execution arrives at this node, HappyRobot starts a new run of the target workflow, passing the configured payload as trigger data.
  </Step>

  <Step title="Child workflow runs">
    The child workflow executes independently. It appears as its own run in the target workflow's **Runs** tab.
  </Step>

  <Step title="Child workflow reaches its response node">
    When the child workflow hits a response node, its output is sent back to the parent workflow. Only the first node with response node config enabled will respond to the parent.
  </Step>

  <Step title="Parent workflow resumes">
    The parent workflow receives the response and continues from the Call Workflow node, with the child's output available for downstream references. The child workflow continues its execution independently after sending the response.
  </Step>
</Steps>

<Note>
  If a timeout is set and the child workflow does not respond in time, the parent continues with an empty output for this node. The child workflow keeps running until it completes or is canceled separately.
</Note>

## Next steps

<CardGroup cols={2}>
  <Card title="Variables" icon="brackets-curly" href="/workflows/variables">
    Pass data between nodes and into child workflows using variables.
  </Card>

  <Card title="Workflow versions" icon="code-branch" href="/workflows/versions">
    Understand how versioning affects which workflow version runs.
  </Card>
</CardGroup>