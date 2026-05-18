export interface FlowpipeInputPlug {
  name: string
  value: unknown
  connections: Record<string, string> // { sourceNodeIdentifier: sourceOutputPlugName }
}

export interface FlowpipeOutputPlug {
  name: string
  value: unknown
  connections: Record<string, string[]> // { targetNodeIdentifier: [targetInputPlugName, ...] }
}

export interface FlowpipeNode {
  file_location: string
  module: string
  cls: string
  name: string
  identifier: string // "name-uuid"
  inputs: Record<string, FlowpipeInputPlug>
  outputs: Record<string, FlowpipeOutputPlug>
  metadata: Record<string, unknown>
  /** Canvas position stored in metadata under "position" */
}

export interface FlowpipeGraph {
  module: string
  cls: string
  name: string
  nodes: FlowpipeNode[]
}
