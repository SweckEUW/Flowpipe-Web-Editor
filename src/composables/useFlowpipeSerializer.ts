import type { Editor, AbstractNode } from '@baklavajs/core'
import { getNodePosition, setNodePosition } from '@baklavajs/renderer-vue'
import type { FlowpipeGraph, FlowpipeNode, FlowpipeInputPlug, FlowpipeOutputPlug } from '../types/flowpipe'
import { useNodeRegistryStore } from '../stores/nodeRegistryStore'

export function useFlowpipeSerializer() {
  /**
   * Export current editor graph as flowpipe-compatible JSON.
   */
  function toFlowpipeJson(editor: Editor, graphName: string): FlowpipeGraph {
    const registry = useNodeRegistryStore()
    const graph = editor.graph
    const nodes: FlowpipeNode[] = []

    // Map interface id → { nodeIdentifier, plugName, isInput }
    const interfaceMap = new Map<string, { identifier: string; plugName: string; isInput: boolean }>()

    for (const node of graph.nodes) {
      const def = registry.nodeTypes.find(d => d.type === node.type)
      const identifier = `${node.title}-${node.id}`
      for (const [plugName, intf] of Object.entries(node.inputs)) {
        interfaceMap.set(intf.id, { identifier, plugName, isInput: true })
      }
      for (const [plugName, intf] of Object.entries(node.outputs)) {
        interfaceMap.set(intf.id, { identifier, plugName, isInput: false })
      }
      void def
    }

    for (const node of graph.nodes) {
      const def = registry.nodeTypes.find(d => d.type === node.type)
      const identifier = `${node.title}-${node.id}`

      const inputs: Record<string, FlowpipeInputPlug> = {}
      for (const [plugName, intf] of Object.entries(node.inputs)) {
        inputs[plugName] = {
          name: plugName,
          value: intf.value,
          connections: {},
        }
      }

      const outputs: Record<string, FlowpipeOutputPlug> = {}
      for (const [plugName, intf] of Object.entries(node.outputs)) {
        outputs[plugName] = {
          name: plugName,
          value: intf.value,
          connections: {},
        }
      }

      const pos = getNodePosition(node) ?? { x: 0, y: 0 }
      nodes.push({
        file_location: def?.file_location ?? '',
        module: def?.module ?? '',
        cls: def?.cls ?? node.type,
        name: node.title,
        identifier,
        inputs,
        outputs,
        metadata: { position: pos },
      })
    }

    // Fill connection maps from graph connections
    for (const conn of graph.connections) {
      const fromInfo = interfaceMap.get(conn.from.id)
      const toInfo = interfaceMap.get(conn.to.id)
      if (!fromInfo || !toInfo) continue

      // Fill output.connections on the source node
      const srcNode = nodes.find(n => n.identifier === fromInfo.identifier)
      if (srcNode && srcNode.outputs[fromInfo.plugName]) {
        const existing = srcNode.outputs[fromInfo.plugName].connections[toInfo.identifier]
        if (existing) {
          existing.push(toInfo.plugName)
        } else {
          srcNode.outputs[fromInfo.plugName].connections[toInfo.identifier] = [toInfo.plugName]
        }
      }

      // Fill input.connections on the target node
      const dstNode = nodes.find(n => n.identifier === toInfo.identifier)
      if (dstNode && dstNode.inputs[toInfo.plugName]) {
        dstNode.inputs[toInfo.plugName].connections[fromInfo.identifier] = fromInfo.plugName
      }
    }

    return {
      module: 'flowpipe.graph',
      cls: 'Graph',
      name: graphName,
      nodes,
    }
  }

  /**
   * Import a flowpipe JSON into an existing editor (clears current graph first).
   */
  function fromFlowpipeJson(data: FlowpipeGraph, editor: Editor) {
    const registry = useNodeRegistryStore()
    const graph = editor.graph

    // Remove existing nodes
    for (const node of [...graph.nodes]) {
      graph.removeNode(node)
    }

    // Map flowpipe identifier → Baklava node
    const nodeMap = new Map<string, AbstractNode>()

    for (const fpNode of data.nodes) {
      const cls = registry.nodeClasses.get(fpNode.cls)
      if (!cls) {
        console.warn(`Unknown node type: ${fpNode.cls}`)
        continue
      }
      const node = new cls()
      graph.addNode(node)
      nodeMap.set(fpNode.identifier, node)

      // Restore input values
      const nodeInputs = node.inputs as Record<string, { value: unknown }>
      for (const [plugName, plug] of Object.entries(fpNode.inputs)) {
        if (nodeInputs[plugName] !== undefined) {
          nodeInputs[plugName].value = plug.value
        }
      }

      // Restore canvas position
      const pos = fpNode.metadata?.position as { x: number; y: number } | undefined
      if (pos) {
        setNodePosition(node, pos.x, pos.y)
      }
    }

    // Restore connections: iterate outputs and connect to inputs
    for (const fpNode of data.nodes) {
      const srcNode = nodeMap.get(fpNode.identifier)
      if (!srcNode) continue

      for (const [outPlugName, outPlug] of Object.entries(fpNode.outputs)) {
        const srcIntf = srcNode.outputs[outPlugName]
        if (!srcIntf) continue

        for (const [targetIdentifier, targetPlugNames] of Object.entries(outPlug.connections)) {
          const dstNode = nodeMap.get(targetIdentifier)
          if (!dstNode) continue

          for (const targetPlugName of targetPlugNames) {
            const dstIntf = dstNode.inputs[targetPlugName]
            if (!dstIntf) continue
            graph.addConnection(srcIntf, dstIntf)
          }
        }
      }
    }
  }

  function downloadJson(graph: FlowpipeGraph, filename = 'graph.json') {
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function loadFromFile(): Promise<FlowpipeGraph> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return reject(new Error('No file selected'))
        const reader = new FileReader()
        reader.onload = () => {
          try {
            resolve(JSON.parse(reader.result as string) as FlowpipeGraph)
          } catch {
            reject(new Error('Invalid JSON file'))
          }
        }
        reader.readAsText(file)
      }
      input.click()
    })
  }

  return { toFlowpipeJson, fromFlowpipeJson, downloadJson, loadFromFile }
}
