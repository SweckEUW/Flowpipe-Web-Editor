<template>
  <Dialog
    v-model:visible="visible"
    modal
    :closable="true"
    :draggable="false"
    :style="{ width: '400px' }"
    class="node-search-dialog"
    @show="onDialogShow"
  >
    <template #header>
      <span class="text-sm font-semibold text-gray-200">Add Node</span>
    </template>

    <div class="flex flex-col gap-2">
      <InputText
        v-model="query"
        placeholder="Search nodes…"
        class="w-full text-sm"
        autofocus
      />

      <div class="node-list max-h-72 overflow-y-auto mt-1">
        <template v-if="grouped.size === 0">
          <p class="text-gray-400 text-xs px-1 py-2">No nodes found.</p>
        </template>

        <template v-for="[category, nodes] in grouped" :key="category">
          <div class="category-header text-xs text-gray-500 uppercase tracking-wider px-1 pt-3 pb-1 first:pt-1">
            {{ category }}
          </div>
          <button
            v-for="node in nodes"
            :key="node.type"
            class="node-item w-full text-left px-3 py-2 rounded text-sm text-gray-200 hover:bg-surface-500 transition-colors cursor-pointer"
            @click="pickNode(node)"
          >
            <span class="font-medium">{{ node.label }}</span>
            <span class="text-gray-500 text-xs ml-2">{{ node.type }}</span>
          </button>
        </template>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useNodeRegistryStore } from '../stores/nodeRegistryStore'
import type { NodeTypeDefinition } from '../types/nodeRegistry'

const visible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  insertNode: [def: NodeTypeDefinition]
}>()

const registry = useNodeRegistryStore()
const query = ref('')

const filtered = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return registry.nodeTypes
  return registry.nodeTypes.filter(
    n => n.label.toLowerCase().includes(q) || n.category.toLowerCase().includes(q),
  )
})

const grouped = computed(() => {
  const map = new Map<string, NodeTypeDefinition[]>()
  for (const node of filtered.value) {
    const list = map.get(node.category) ?? []
    list.push(node)
    map.set(node.category, list)
  }
  return map
})

function pickNode(def: NodeTypeDefinition) {
  visible.value = false
  query.value = ''
  emit('insertNode', def)
}

function onDialogShow() {
  query.value = ''
}
</script>

<style scoped>
.node-search-dialog :deep(.p-dialog) {
  background: #222222;
}
</style>
