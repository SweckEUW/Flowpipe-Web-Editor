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

// Same pattern renderer-vue uses for position and width: an editor-only node property.
declare module "@baklavajs/core/dist/node" {
  interface AbstractNode {
    /** Header color, see EditorNodeMetadata.color */
    color?: string;
  }
}

export function provideFlowpipeEditor(nodeLibrary: SerializedFlowpipeNode[], graph?: SerializedFlowpipeGraph): FlowpipeEditorContext {
  const baklava = useBaklava();
  // Width only: Baklava derives a node's height from its interfaces.
  baklava.settings.nodes.resizable = true;
  baklava.settings.nodes.maxWidth = 600;
  baklava.settings.toolbar.enabled = false;
  // baklava.settings.sidebar.enabled = false;

  // Baklava only saves the node properties it knows, so the color is carried through
  // these hooks. They run for graph loads as well as for copy, paste and duplicate.
  const token = Symbol("flowpipe-node-color");
  baklava.editor.nodeHooks.beforeLoad.subscribe(token, (state, node) => {
    node.color = (state as { color?: string }).color;
    return state;
  });
  baklava.editor.nodeHooks.afterSave.subscribe(token, (state, node) => {
    if (node.color) (state as { color?: string }).color = node.color;
    return state;
  });

  // Register all node types in the library with Baklava
  for (const node of nodeLibrary) {
    const definition = flowpipeNodeToBaklava(node);
    // The category is a registration option in Baklava, not part of the node definition
    baklava.editor.registerNodeType(defineNode(definition), {
      category: node.metadata?.editor?.category || "Uncategorized",
    });
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
