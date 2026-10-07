export interface SerializedSubInputPlug {
  name: string; // full name "<parent>.<key>"
  value: unknown;
  connections: Record<string, string>; // max. 1 entry: upstream identifier -> output name
}

export interface SerializedSubOutputPlug {
  name: string;
  value: unknown;
  connections: Record<string, string[]>;
}

export interface SerializedInputPlug {
  name: string;
  value: unknown; // null if the plug has sub_plugs
  connections: Record<string, string>; // max. 1 entry; name may be "<out>.<key>"
  sub_plugs: Record<string, SerializedSubInputPlug>; // keyed by "<key>", required by from_json
}

export interface SerializedOutputPlug {
  name: string;
  value: unknown;
  connections: Record<string, string[]>;
  sub_plugs: Record<string, SerializedSubOutputPlug>;
}

export interface SerializedFlowpipeFunctionMeta {
  module: string;
  name: string;
}

export type FlowpipeInterpreter =
  | "python"
  | "maya"
  | "houdini"
  | "nuke"
  | "mari"
  | "3dequalizer"
  | (string & {});

// Everything this editor owns lives under metadata.editor, so it cannot collide
// with metadata keys flowpipe or a pipeline itself uses.
export interface EditorNodeMetadata {
  /** Baklava node id; keeps flowpipe identifiers stable across save/load cycles. */
  id?: string;
  /** Baklava node type key, see flowpipeNodeTypeKey(). */
  type?: string;
  position?: { x: number; y: number };
  /** Node width in px; missing means Baklava's default width. */
  width?: number;
}

// Free-form dict in flowpipe; only these keys carry a meaning by convention.
export interface SerializedFlowpipeNodeMetadata {
  interpreter?: FlowpipeInterpreter; // flowpipe examples, flowpipe-editor icons
  batch_size?: number; // farm conversion example
  label?: string; // node title shown in the editor
  editor?: EditorNodeMetadata; // owned by this web editor
  [key: string]: unknown;
}

interface SerializedFlowpipeNodeBase {
  module: string;
  cls: string;
  file_location: string | null; // flowpipe never writes null
  name: string;
  identifier: string;
  inputs: Record<string, SerializedInputPlug>;
  outputs: Record<string, SerializedOutputPlug>;
  metadata: SerializedFlowpipeNodeMetadata;
}

export interface SerializedFunctionNode extends SerializedFlowpipeNodeBase {
  func: SerializedFlowpipeFunctionMeta; // module/cls are usually flowpipe.node / FunctionNode
}

export interface SerializedClassNode extends SerializedFlowpipeNodeBase {
  func?: never;
}

export type SerializedFlowpipeNode = SerializedFunctionNode | SerializedClassNode;

export interface SerializedFlowpipeSubgraph {
  module: string;
  cls: string;
  name: string;
  nodes: SerializedFlowpipeNode[];
}

export interface SerializedFlowpipeGraph extends SerializedFlowpipeSubgraph {
  subgraphs?: SerializedFlowpipeSubgraph[]; // only on the top level
}
