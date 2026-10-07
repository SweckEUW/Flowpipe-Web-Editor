import type { SerializedFlowpipeGraph, SerializedFlowpipeNode } from './flowpipe'

// Props von <flowpipe-editor>. Bewusst ohne Vue-Typen, damit die veröffentlichten
// Typdeklarationen auch in Apps ohne Vue funktionieren.
export interface FlowPipeEditorProps {
  nodeLibrary?: SerializedFlowpipeNode[]
  graph?: SerializedFlowpipeGraph
  saveHandler?: (graph: SerializedFlowpipeGraph) => Promise<void> | void
  runHandler?: (graph: SerializedFlowpipeGraph) => Promise<void> | void
  displayDownloadButton?: boolean
  displayLoadButton?: boolean
  disableSidebar?: boolean
}
