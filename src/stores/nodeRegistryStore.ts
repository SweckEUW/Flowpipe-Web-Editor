import { defineStore } from 'pinia'
import { ref } from 'vue'
import { defineNode, NodeInterface, Editor } from '@baklavajs/core'
import {
  TextInputInterface,
  NumberInterface,
  IntegerInterface,
  SelectInterface,
  CheckboxInterface,
} from '@baklavajs/renderer-vue'
import { setType } from '@baklavajs/interface-types'
import { typeForValueType } from '../types/interfaceTypes'
import type { NodeTypeDefinition, NodeRegistry } from '../types/nodeRegistry'

export type BaklavaNodeConstructor = new () => InstanceType<ReturnType<typeof defineNode>>

export const useNodeRegistryStore = defineStore('nodeRegistry', () => {
  const nodeTypes = ref<NodeTypeDefinition[]>([])
  const nodeClasses = new Map<string, BaklavaNodeConstructor>()

  function buildNodeClass(def: NodeTypeDefinition): BaklavaNodeConstructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputFactories: Record<string, () => NodeInterface<any>> = {}
    for (const port of def.inputs) {
      const portDef = port
      inputFactories[portDef.name] = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let intf: NodeInterface<any>
        switch (portDef.valueType) {
          case 'number':
            intf = new NumberInterface(portDef.name, (portDef.default as number) ?? 0)
            break
          case 'integer':
            intf = new IntegerInterface(portDef.name, (portDef.default as number) ?? 0)
            break
          case 'boolean':
            intf = new CheckboxInterface(portDef.name, (portDef.default as boolean) ?? false)
            break
          case 'select':
            intf = new SelectInterface(
              portDef.name,
              (portDef.default as string) ?? (portDef.options?.[0] ?? ''),
              portDef.options ?? [],
            )
            break
          default:
            intf = new TextInputInterface(portDef.name, (portDef.default as string) ?? '')
        }
        const t = typeForValueType(portDef.valueType)
        if (t) setType(intf, t)
        return intf
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputFactories: Record<string, () => NodeInterface<any>> = {}
    for (const port of def.outputs) {
      const portDef = port
      outputFactories[portDef.name] = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const intf = new NodeInterface<any>(portDef.name, null)
        const t = typeForValueType(portDef.valueType)
        if (t) setType(intf, t)
        return intf
      }
    }

    return defineNode({
      type: def.type,
      title: def.label,
      inputs: inputFactories,
      outputs: outputFactories,
    }) as BaklavaNodeConstructor
  }

  async function fetchRegistry() {
    try {
      const res = await fetch('/node-registry.json')
      const data: NodeRegistry = await res.json()
      nodeTypes.value = data.nodes

      for (const def of data.nodes) {
        const cls = buildNodeClass(def)
        nodeClasses.set(def.type, cls)
      }
    } catch (e) {
      console.error('Failed to load node-registry.json', e)
    }
  }

  function registerAllOn(editor: Editor) {
    for (const [, cls] of nodeClasses) {
      editor.registerNodeType(cls)
    }
  }

  return { nodeTypes, nodeClasses, fetchRegistry, registerAllOn }
})
