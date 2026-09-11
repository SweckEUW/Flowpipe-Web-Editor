import { INodeDefinition, NodeInterface } from "@baklavajs/core";
import { FlowpipeInputPlug, FlowpipeNode, FlowpipeOutputPlug } from "../types/flowpipe";
import { CheckboxInterface, NumberInterface, TextInputInterface } from "@baklavajs/renderer-vue";

// Resolve plug data type to matching Baklava interface
function createInterfaceForPlug(name: string, plug: FlowpipeInputPlug | FlowpipeOutputPlug, isInput: boolean): NodeInterface<any> {
  const value = plug.default_value;

  // Outputs need no interactive input widgets
  if (!isInput) return new NodeInterface(name, undefined);

  // Detect type from default value
  if (typeof value === "boolean") return new CheckboxInterface(name, value);
  if (typeof value === "number") return new NumberInterface(name, value);
  if (typeof value === "string") return new TextInputInterface(name, value);

  // Fallback if value is null or undefined
  return new TextInputInterface(name, "");
}

export function flowpipeNodeToBaklava(node: FlowpipeNode): INodeDefinition<any, any> {
    const inputs: Record<string, () => NodeInterface<any>> = {};
    const outputs: Record<string, () => NodeInterface<any>> = {};

    // Build typed input interfaces
    for (const [key, plug] of Object.entries(node.inputs || {}))
        inputs[key] = () => createInterfaceForPlug(plug.name || key, plug, true);

    // Build typed output interfaces
    for (const [key, plug] of Object.entries(node.outputs || {}))
        outputs[key] = () => createInterfaceForPlug(plug.name || key, plug, false);

    return {
        type: node.metadata?.type || `${node.module}.${node.cls}`,
        title: node.cls,
        inputs,
        outputs,
        onCreate(this: any) {
        // Keep Python execution metadata intact
        this.flowpipe = {
            name: node.name,
            identifier: node.identifier,
            cls: node.cls,
            module: node.module,
            file_location: node.file_location,
            metadata: { ...node.metadata }
        };
        }
    };
}