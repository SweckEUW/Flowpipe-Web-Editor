import { defineStore } from 'pinia'
import { shallowRef, ref, markRaw } from 'vue'
import { Editor } from '@baklavajs/core'
import { BaklavaInterfaceTypes } from '@baklavajs/interface-types'
import { ALL_INTERFACE_TYPES } from '../types/interfaceTypes'
import { useNodeRegistryStore } from './nodeRegistryStore'

export interface Tab {
  id: string
  name: string
  editor: Editor
}

let tabCounter = 1

export const useTabStore = defineStore('tabs', () => {
  // shallowRef so Vue doesn't attempt deep reactivity on Editor instances
  const tabs = shallowRef<Tab[]>([])
  const activeTabId = ref<string>('')

  function createEditor(): Editor {
    const editor = markRaw(new Editor())
    const registry = useNodeRegistryStore()
    registry.registerAllOn(editor)
    // Wire up connection-type checking; instance kept alive via event subscription token
    new BaklavaInterfaceTypes(editor).addTypes(...ALL_INTERFACE_TYPES)
    return editor
  }

  function addTab(name?: string): Tab {
    const id = crypto.randomUUID()
    const tab: Tab = {
      id,
      name: name ?? `Graph ${tabCounter++}`,
      editor: createEditor(),
    }
    // Replace array reference so shallowRef triggers reactivity
    tabs.value = [...tabs.value, tab]
    activeTabId.value = id
    return tab
  }

  function removeTab(id: string) {
    const idx = tabs.value.findIndex(t => t.id === id)
    if (idx === -1) return
    const next = [...tabs.value]
    next.splice(idx, 1)
    tabs.value = next
    if (activeTabId.value === id) {
      activeTabId.value = tabs.value[Math.max(0, idx - 1)]?.id ?? ''
    }
    if (tabs.value.length === 0) {
      addTab()
    }
  }

  function renameTab(id: string, name: string) {
    const tab = tabs.value.find(t => t.id === id)
    if (tab) {
      tab.name = name
      // Trigger shallowRef update
      tabs.value = [...tabs.value]
    }
  }

  function setActiveTab(id: string) {
    activeTabId.value = id
  }

  const activeTab = (): Tab | undefined =>
    tabs.value.find(t => t.id === activeTabId.value)

  return { tabs, activeTabId, addTab, removeTab, renameTab, setActiveTab, activeTab }
})
