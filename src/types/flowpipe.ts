import { INodeState } from "@baklavajs/core/dist/node";

// Sub-plug representing compound or nested inputs/outputs
export interface FlowpipeSubPlug<T = any> {
  name: string;
  value: T | null;
  connections: Record<string, string>; // Maps upstream node identifier -> plug name
}

// Input plug serialized format
export interface FlowpipeInputPlug<T = any> {
  name: string;
  value: T | null;
  // Flowpipe inputs map: { [upstreamNodeIdentifier]: upstreamPlugName }
  connections: Record<string, string>;
  sub_plugs?: Record<string, FlowpipeSubPlug<T>>;
}

// Output plug serialized format
export interface FlowpipeOutputPlug<T = any> {
  name: string;
  value: T | null;
  // Flowpipe outputs map: { [downstreamNodeIdentifier]: string[] of downstream plug names }
  connections: Record<string, string[]>;
  sub_plugs?: Record<string, FlowpipeSubPlug<T>>;
}

// Metadata for nodes instantiated via @Node function decorator
export interface FlowpipeFunctionMeta {
  module: string;
  name: string;
}

// Core serialized Flowpipe Node
export interface FlowpipeNode {
  name: string;
  identifier: string;
  cls: string;
  module: string;
  file_location: string | null;
  inputs: Record<string, FlowpipeInputPlug>;
  outputs: Record<string, FlowpipeOutputPlug>;
  metadata: {
    // UI layout for BaklavaJS
    position?: { x: number; y: number };
    category?: string;
    label?: string;
    // Execution and farm configuration
    interpreter?: 'python' | 'nuke' | 'maya' | 'houdini' | '3dequalizer' | string;
    batch_size?: number;
    [key: string]: any;
  };
  func?: FlowpipeFunctionMeta;
}

// Complete serialized Flowpipe Graph
export interface FlowpipeGraph {
  name: string;
  cls: string;
  module: string;
  nodes: FlowpipeNode[];
  subgraphs?: FlowpipeGraph[];
}

export interface VexsBaklavaNodeState extends INodeState<any, any> {
  position?: { x: number; y: number };
  flowpipe: {
    cls: string;
    module: string;
    file_location: string | null;
    func?: { module: string; name: string };
    metadata: Record<string, any>;
  };
}