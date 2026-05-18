<template>
  <aside class="right-sidebar bg-surface-700 border-l border-surface-500 flex flex-col h-full overflow-hidden">
    <div v-if="selectedNode" class="flex flex-col h-full">
      <div class="px-3 py-3 border-b border-surface-500">
        <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Node</p>
        <h3 class="text-sm font-semibold text-gray-100 truncate">{{ selectedNode.title }}</h3>
        <p class="text-xs text-gray-500 mt-0.5 truncate">{{ selectedNode.type }}</p>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        <div v-if="inputPorts.length > 0">
          <p class="text-xs text-gray-500 uppercase tracking-wider mb-2">Inputs</p>
          <div
            v-for="port in inputPorts"
            :key="port.key"
            class="mb-3"
          >
            <!-- boolean: label + toggle on the same row -->
            <div v-if="port.valueType === 'boolean'" class="flex items-center justify-between">
              <label class="text-xs text-gray-300">{{ port.name }}</label>
              <ToggleSwitch
                :model-value="Boolean(port.value)"
                @update:model-value="port.intf.value = $event"
              />
            </div>

            <!-- all other types: label above, input below -->
            <template v-else>
              <label class="text-xs text-gray-300 block mb-1">{{ port.name }}</label>

              <!-- select -->
              <Select
                v-if="port.valueType === 'select'"
                :model-value="String(port.value ?? '')"
                :options="port.options"
                class="w-full text-xs sidebar-select"
                @update:model-value="port.intf.value = $event"
              />

              <!-- number -->
              <InputNumber
                v-else-if="port.valueType === 'number'"
                :model-value="port.value as number"
                :use-grouping="false"
                class="w-full sidebar-input-number"
                :input-style="numberInputStyle"
                @update:model-value="port.intf.value = $event"
              />

              <!-- integer -->
              <InputNumber
                v-else-if="port.valueType === 'integer'"
                :model-value="port.value as number"
                :use-grouping="false"
                :min-fraction-digits="0"
                :max-fraction-digits="0"
                class="w-full sidebar-input-number"
                :input-style="numberInputStyle"
                @update:model-value="port.intf.value = $event"
              />

              <!-- filepath -->
              <div v-else-if="port.valueType === 'filepath'" class="flex gap-1">
                <InputText
                  :model-value="String(port.value ?? '')"
                  placeholder="/path/to/file"
                  class="flex-1 text-xs"
                  @update:model-value="port.intf.value = $event"
                />
                <button class="path-browse-btn" title="Browse file" @click="browseFile(port)">
                  <i class="pi pi-file" style="font-size: 11px" />
                </button>
              </div>

              <!-- dirpath -->
              <div v-else-if="port.valueType === 'dirpath'" class="flex gap-1">
                <InputText
                  :model-value="String(port.value ?? '')"
                  placeholder="/path/to/folder"
                  class="flex-1 text-xs"
                  @update:model-value="port.intf.value = $event"
                />
                <button class="path-browse-btn" title="Browse folder" @click="browseDir(port)">
                  <i class="pi pi-folder-open" style="font-size: 11px" />
                </button>
              </div>

              <!-- string / fallback -->
              <InputText
                v-else
                :model-value="String(port.value ?? '')"
                class="w-full text-xs"
                @update:model-value="port.intf.value = $event"
              />
            </template>
          </div>
        </div>

        <div v-else>
          <p class="text-xs text-gray-500">No editable inputs.</p>
        </div>

        <div v-if="selectedNode.outputs && Object.keys(selectedNode.outputs).length > 0">
          <p class="text-xs text-gray-500 uppercase tracking-wider mb-2">Outputs</p>
          <div
            v-for="[key, intf] in Object.entries(selectedNode.outputs)"
            :key="key"
            class="flex items-center gap-2 mb-1"
          >
            <span class="w-2 h-2 rounded-full bg-surface-400 flex-shrink-0" />
            <span class="text-xs text-gray-400">{{ intf.name }}</span>
          </div>
        </div>

        <div class="mt-auto pt-2 border-t border-surface-500">
          <p class="text-xs text-gray-600 break-all">ID: {{ selectedNode.id }}</p>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center h-full px-4 text-center">
      <i class="pi pi-info-circle text-2xl text-gray-600 mb-3" />
      <p class="text-xs text-gray-500">Select a node to see its settings.</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import { useTabStore } from '../stores/tabStore'
import { useNodeRegistryStore } from '../stores/nodeRegistryStore'

const tabStore = useTabStore()
const registry = useNodeRegistryStore()

const numberInputStyle = {
  background: '#2d2d2d',
  color: '#ccc',
  border: '1px solid #3d3d3d',
  fontSize: '12px',
  padding: '4px 8px',
}

const selectedNode = computed(() => {
  const tab = tabStore.activeTab()
  if (!tab) return null
  const selected = tab.editor.graph.nodes.filter(n => (n as unknown as { selected?: boolean }).selected)
  return selected.length === 1 ? selected[0] : null
})

const nodeDef = computed(() => {
  if (!selectedNode.value) return null
  return registry.nodeTypes.find(d => d.type === selectedNode.value!.type) ?? null
})

const inputPorts = computed(() => {
  if (!selectedNode.value) return []
  return Object.entries(selectedNode.value.inputs).map(([key, intf]) => {
    const portDef = nodeDef.value?.inputs.find(p => p.name === key)
    return {
      key,
      name: intf.name,
      value: intf.value,
      intf,
      valueType: portDef?.valueType ?? 'string',
      options: portDef?.options ?? [],
    }
  })
})

type Port = (typeof inputPorts.value)[number]

async function browseDir(port: Port) {
  if ('showDirectoryPicker' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker({ mode: 'read' })
      port.intf.value = handle.name
    } catch { /* user cancelled */ }
    return
  }
  // Fallback for browsers without File System Access API
  const input = document.createElement('input')
  input.type = 'file'
  input.setAttribute('webkitdirectory', '')
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) port.intf.value = file.webkitRelativePath.split('/')[0]
  }
  input.click()
}

async function browseFile(port: Port) {
  if ('showOpenFilePicker' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [handle] = await (window as any).showOpenFilePicker()
      port.intf.value = handle.name
    } catch { /* user cancelled */ }
    return
  }
  const input = document.createElement('input')
  input.type = 'file'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) port.intf.value = file.name
  }
  input.click()
}
</script>

<style scoped>
.right-sidebar {
  width: 240px;
  min-width: 240px;
}

.path-browse-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3a3a3a;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.path-browse-btn:hover {
  background: #4a4a4a;
  color: #fff;
}

/* make select & number inputs match the dark sidebar */
.sidebar-select :deep(.p-select),
.sidebar-select :deep(.p-select-label) {
  font-size: 12px;
  background: #2d2d2d;
  border-color: #3d3d3d;
  color: #ccc;
}
.sidebar-input-number :deep(.p-inputnumber-input) {
  width: 100%;
}
</style>
