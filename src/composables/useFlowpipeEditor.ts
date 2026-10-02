import { inject, provide, type InjectionKey } from "vue";
import { defineNode } from "@baklavajs/core";
import { useBaklava, type IBaklavaViewModel } from "@baklavajs/renderer-vue";
import type { SerializedFlowpipeGraph, SerializedFlowpipeNode } from "../types/flowpipe";
import { baklavaToFlowpipeGraph } from "../util/baklavaToFlowpipeConverter";
import { flowpipeGraphToBaklava, flowpipeNodeToBaklava, } from "../util/flowpipeToBaklavaConverter";

export interface FlowpipeEditorContext {
  baklava: IBaklavaViewModel;
  nodeLibrary: SerializedFlowpipeNode[];
  toFlowpipeGraph: () => SerializedFlowpipeGraph;
}

const FlowpipeEditorKey: InjectionKey<FlowpipeEditorContext> = Symbol("flowpipe-editor");

export function provideFlowpipeEditor(nodeLibrary: SerializedFlowpipeNode[], graph?: SerializedFlowpipeGraph): FlowpipeEditorContext {
  const baklava = useBaklava();
  
  // Register all node types in the library with Baklava
  for (const node of nodeLibrary) {
    const definition = flowpipeNodeToBaklava(node);
    baklava.editor.registerNodeType(defineNode(definition));
  }

  const loadInitialGraph = () => {
    if(!graph) return;

    // Missing Nodes....
    // let pendingTypes = (graph.nodes ?? []).map(flowpipeNodeTypeKey).filter((type) => !baklava.editor.nodeTypes.has(type));
    // if (pendingTypes.length > 0) return;

    const target = baklava.editor.graph;

    const state = flowpipeGraphToBaklava(graph, nodeLibrary, {
      id: target.id,
      panning: target.panning ?? { x: 0, y: 0 },
      scaling: target.scaling ?? 1,
    });

    const warnings = target.load(state);
    for (const warning of warnings) console.warn(`[flowpipe] ${warning}`);
    return warnings;
  };

  loadInitialGraph();

  const context: FlowpipeEditorContext = {
    baklava,
    nodeLibrary,
    toFlowpipeGraph: () => baklavaToFlowpipeGraph(baklava.displayedGraph, nodeLibrary, {
      name: graph?.name ?? "flowpipe.graph",
      module: graph?.module ?? "flowpipe.graph",
      cls: graph?.cls ?? "FlowpipeGraph",
    })
  };

  provide(FlowpipeEditorKey, context);
  return context;
}

export function useFlowpipeEditor(): FlowpipeEditorContext {
  const context = inject(FlowpipeEditorKey);
  if (!context) throw new Error("useFlowpipeEditor() must be used inside a <FlowPipeEditor>.");
  return context;
}
