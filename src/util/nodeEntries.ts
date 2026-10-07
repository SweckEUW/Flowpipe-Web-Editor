import type { SerializedFlowpipeNode } from "../types/flowpipe";
import { flowpipeNodeTypeKey } from "./flowpipeToBaklavaConverter";

export const UNCATEGORIZED = "Uncategorized";

/** A node type as listed in the NodeSidebar and the NodeSearchDialog */
export interface NodeEntry {
  type: string;
  label: string;
  description?: string;
  icon?: string;
  category: string;
}

// Category, description and icon come only from metadata.editor
export function buildNodeEntries(nodeLibrary: SerializedFlowpipeNode[]): NodeEntry[] {
  return nodeLibrary.map(node => ({
    type: flowpipeNodeTypeKey(node),
    // Same fallback as the node title in flowpipeNodeToBaklava()
    label: node.metadata?.label || node.func?.name || node.cls,
    description: node.metadata?.editor?.description,
    icon: node.metadata?.editor?.icon,
    category: node.metadata?.editor?.category || UNCATEGORIZED,
  }));
}
