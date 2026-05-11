[**ignition-monorepo**](../../../README.md)

***

[ignition-monorepo](../../../README.md) / [backend-onnx/src](../README.md) / ExportResult

# Interface: ExportResult

Defined in: [backend-onnx/src/exporter.ts:40](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/exporter.ts#L40)

Saves a TF.js LayersModel to disk in the format expected by the Python tf2onnx converter,
and returns the shell commands to complete the conversion to .onnx.

## Full conversion flow

**Step 1 (JS)** — Call this function to save the model:
```ts
import { DQNAgent } from '@ignitionai/backend-tfjs';
import { saveForOnnxExport } from '@ignitionai/backend-onnx';

const { modelDir, conversionScript } = await saveForOnnxExport(agent.model, './exports/my_model');
console.log(conversionScript); // Print or execute the Python script
```

**Step 2 (Python)** — Run the generated script:
```bash
pip install tensorflowjs tf2onnx
tensorflowjs_converter --input_format=tfjs_layers_model \
  ./exports/my_model/model.json ./exports/my_model_savedmodel/
python -m tf2onnx.convert \
  --saved-model ./exports/my_model_savedmodel \
  --output ./exports/my_model.onnx \
  --opset ${opset}
```

**Step 3 (JS)** — Load with OnnxAgent:
```ts
const agent = new OnnxAgent({ modelPath: './exports/my_model.onnx', actionSize: 4 });
await agent.load();
```

## Why Python?
No maintained npm package performs reliable TF.js → ONNX conversion.
The official path is: TF.js JSON → TF SavedModel (via tensorflowjs_converter) → ONNX (via tf2onnx).

## Properties

### modelDir

> **modelDir**: `string`

Defined in: [backend-onnx/src/exporter.ts:42](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/exporter.ts#L42)

Directory where the TF.js model was saved (model.json + weights.bin)

***

### conversionScript

> **conversionScript**: `string`

Defined in: [backend-onnx/src/exporter.ts:44](https://github.com/IgnitionAI/ignition/blob/be8a282adf5676773a30380bf9e36dfec337bf01/packages/backend-onnx/src/exporter.ts#L44)

Shell script (bash) that converts the saved model to .onnx
