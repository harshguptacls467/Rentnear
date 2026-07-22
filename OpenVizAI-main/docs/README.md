# OpenVizAI Spec Docs

chartSpec is the open JSON standard at the heart of OpenVizAI. It describes a 
chart as a small, library-agnostic declaration: which fields map to which axes, 
what the chart type is, and how the data should be grouped or sorted.

The LLM outputs a chartSpec. A renderer adapter translates it into ApexCharts, 
Recharts, Chart.js, or any other library. The same chartSpec works across all adapters.

## Why a spec instead of library config?

Every chart library has a different API. If you generate ApexCharts config directly, 
you're locked in — changing libraries means regenerating everything. chartSpec is the 
intermediate representation that any renderer can consume. You write (or generate) once, 
render anywhere.

## Version

- Current: `openvizai/spec/v1`

## Sample Payloads

Each sample file includes an `exampleData` array whose columns match the `chart.chartSpec` fields.

- Canonical v1 sample: [openvizai-spec-v1.sample.json](openvizai-spec-v1.sample.json)
- Line sample: [openvizai-spec-v1.line.sample.json](openvizai-spec-v1.line.sample.json)
- Bar sample: [openvizai-spec-v1.bar.sample.json](openvizai-spec-v1.bar.sample.json)
- Range bar sample: [openvizai-spec-v1.range_bar.sample.json](openvizai-spec-v1.range_bar.sample.json)
- Radar sample: [openvizai-spec-v1.radar.sample.json](openvizai-spec-v1.radar.sample.json)
- Pie sample: [openvizai-spec-v1.pie.sample.json](openvizai-spec-v1.pie.sample.json)
- Donut sample: [openvizai-spec-v1.donut.sample.json](openvizai-spec-v1.donut.sample.json)

## Building your own generator

You don't need `@openvizai/core` to use OpenVizAI adapters. If you call an LLM 
yourself — or produce chartSpec through any other means — your output just needs 
to conform to `openvizai/spec/v1`. Use the Zod schema from `@openvizai/shared-types` 
to validate before rendering:
```ts

import { ChartSpecSchema } from "@openvizai/shared-types";

const result = ChartSpecSchema.safeParse(yourLLMOutput);
if (!result.success) {
  console.error(result.error);
}
```

## Adapter compatibility

Any adapter that targets `openvizai/spec/v1` will render any valid chartSpec correctly. 
This is the core guarantee of the standard — produce a valid spec once, render it 
with any adapter, any library, any framework.
