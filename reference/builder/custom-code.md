> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Code

> Run Python code within your workflow

The Custom Code node lets you run Python code directly inside your workflow. Use it when you need custom data transformation, calculation, or logic that isn't covered by other node types.

Two Python variants are available in the node picker:

| Node                         | When to use                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Run Python**               | The default Python runtime with a focused set of standard-library modules. Best for lightweight transforms, string handling, and date math.                                                |
| **Advanced Python** *(beta)* | A sandboxed runtime with the `data-science-v1` package profile, including `pandas` and `numpy`. Use it when you need data-frame operations, numerical arrays, or other heavier processing. |

<Note>
  **Advanced Python** is marked **beta** in the workflow editor while the sandbox runtime ships. Behavior, available libraries, and timeouts may change before general availability.
</Note>

## Configuration

### Input data

Define key-value pairs that are passed into your code. Each key becomes accessible in the `input_data` dictionary.

* **Key** — The variable name you'll reference in code (e.g., `phone_numbers`, `raw_data`)
* **Value** — The value to pass in, which can be a static value or a variable reference

Supports variables — type `@` in the value field to insert outputs from previous nodes.

### Code

A Python code editor (Monaco) where you write your logic. Access input values through the `input_data` dictionary:

```python theme={null}
# Access input data
raw_text = input_data['transcript']
numbers = input_data['phone_numbers']

# Process data
cleaned = raw_text.strip().lower()
formatted_numbers = [n.replace('-', '') for n in numbers]

# Store results in the output variable
output = {
    'cleaned_text': cleaned,
    'formatted_numbers': formatted_numbers,
    'count': len(formatted_numbers)
}
```

## Available libraries

### Run Python

The default Python runtime exposes the following standard-library modules:

| Library       | Description                 |
| ------------- | --------------------------- |
| `math`        | Mathematical functions      |
| `datetime`    | Date and time handling      |
| `pytz`        | Timezone conversions        |
| `dateutil`    | Flexible date parsing       |
| `re`          | Regular expressions         |
| `random`      | Random number generation    |
| `collections` | Specialized data structures |
| `json`        | JSON encoding/decoding      |
| `time`        | Time-related functions      |
| `base64`      | Base64 encoding/decoding    |

### Advanced Python (beta)

The sandboxed runtime uses the `data-science-v1` package profile. Network access and arbitrary package installs are disabled — only the libraries below are available:

| Library    | Description                     |
| ---------- | ------------------------------- |
| `pandas`   | DataFrames and data analysis    |
| `numpy`    | Numerical arrays and operations |
| `datetime` | Date and time handling          |
| `json`     | JSON encoding/decoding          |
| `re`       | Regular expressions             |

If you need a library that isn't listed above, stay on the standard Custom Code node or reach out so the package profile can be extended.

## Output

Your code **must** store results in a variable called `output`. This variable becomes the node's output and is available to all downstream nodes via the `@` picker.

The `output` variable can be a string, number, list, dictionary, or any JSON-serializable value.

<Warning>
  Do not use `time.sleep()` or any blocking delay in your code. Use the [Schedule](/core-nodes/schedule) node for delays instead. Custom Code executions have a timeout limit — long-running operations will be terminated.
</Warning>

## Example

A previous node returns a list of load records. The Custom Code node filters for loads over 40,000 lbs, calculates the average weight, and formats a summary string — all in a few lines of Python that would be awkward to express with other node types.

## Related

<CardGroup cols={2}>
  <Card title="AI Extract" icon="wand-magic-sparkles" href="/core-nodes/ai-extract">
    Extract structured data using AI instead of code.
  </Card>

  <Card title="Variables" icon="brackets-curly" href="/workflows/variables">
    Learn how to pass data between nodes.
  </Card>
</CardGroup>