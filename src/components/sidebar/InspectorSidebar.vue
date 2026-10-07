<template>
  <aside
    class="flex-shrink-0 flex flex-col overflow-hidden border-l border-[var(--baklava-control-color-hover)] bg-[var(--baklava-sidebar-color-background)] text-[var(--baklava-sidebar-color-foreground)]"
    :class="{ 'items-center py-3': collapsed }"
    :style="sizeStyle"
    @contextmenu.prevent
  >
    <!-- Collapsed, only a narrow strip with the button remains, so the sidebar can be opened again -->
    <button
      v-if="collapsed"
      v-tooltip.left="'Show inspector'"
      :class="toggleClass"
      @click="collapsed = false"
    >
      <i class="pi pi-angle-double-left text-xs" />
    </button>

    <template v-else>
      <div class="flex items-center gap-2 p-4 pb-3">
        <div class="flex-1 min-w-0 flex items-center gap-2">
          <img v-if="node && icon" :src="icon" alt="" class="w-4 h-4 object-contain" />
          <h2 class="text-base font-semibold text-[var(--baklava-node-title-color-foreground)]">{{ node ? 'Node' : 'Graph' }}</h2>
        </div>
        <button v-tooltip.left="'Hide inspector'" :class="toggleClass" @click="collapsed = true">
          <i class="pi pi-angle-double-right text-xs" />
        </button>
      </div>

      <!-- Exactly one selected node -->
      <template v-if="node">
        <div class="flex-1 overflow-y-auto flex flex-col gap-4 px-4 pb-4">
          <section class="flex flex-col gap-1.5">
            <label for="inspector-node-name" :class="labelClass">Name</label>
            <!-- Plain input instead of PrimeVue, so it uses the editor colors and not the PrimeVue theme -->
            <input
              id="inspector-node-name"
              v-model="tempTitle"
              type="text"
              :class="inputClass"
              @change="commitRename"
              @keydown.enter="commitRename"
            />
            <p v-if="description" class="text-xs opacity-60">{{ description }}</p>
          </section>

          <section class="flex flex-col gap-2">
            <h3 :class="labelClass">Inputs</h3>
            <p v-if="inputs.length === 0" class="text-xs opacity-60">This node has no inputs.</p>

            <div v-for="intf in inputs" :key="intf.id" class="flex flex-col gap-1">
              <span class="text-xs opacity-80">{{ intf.name }}</span>
              <!-- Same rule as Baklava's node: a connected input gets its value from upstream -->
              <div
                v-if="intf.connectionCount > 0"
                class="flex items-center p-4 gap-2 px-2 h-8 rounded-md text-xs opacity-60 bg-[var(--baklava-control-color-background)]"
              >
                <i class="pi pi-link text-xs" />
                <span class="truncate">Connected to {{ connectionSource(intf) }}</span>
              </div>
              <!-- Baklava's own widget, rendered the same way as in its built-in sidebar -->
              <component
                :is="intf.component"
                v-else-if="intf.component"
                v-model="intf.value"
                :node="node"
                :intf="intf"
              />
            </div>
          </section>
        </div>

        <div class="p-4 border-t border-[var(--baklava-control-color-hover)]">
          <button
            class="w-full flex items-center justify-center gap-2 h-9 rounded-md text-sm cursor-pointer border border-[var(--baklava-control-color-active)] hover:border-[var(--baklava-control-color-error)] hover:bg-[var(--baklava-control-color-error)] transition-colors"
            @click="actions.remove(node)"
          >
            <i class="pi pi-trash text-xs" />
            Remove node
          </button>
        </div>
      </template>

      <!-- No or several selected nodes -->
      <div v-else class="flex-1 overflow-y-auto flex flex-col gap-4 px-4 pb-4">
        <section class="flex flex-col gap-1.5">
          <span :class="labelClass">Title</span>
          <span class="text-sm font-semibold break-words text-[var(--baklava-node-title-color-foreground)]">{{ graphName }}</span>
        </section>

        <section class="flex flex-col gap-1 text-sm">
          <div class="flex justify-between"><span class="opacity-60">Nodes</span><span>{{ graph.nodes.length }}</span></div>
          <div class="flex justify-between"><span class="opacity-60">Connections</span><span>{{ graph.connections.length }}</span></div>
        </section>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NodeInterface } from '@baklavajs/core'
import { useFlowpipeEditor } from '../../composables/useFlowpipeEditor'
import { useNodeActions } from '../../composables/useNodeActions'
import { flowpipeNodeTypeKey } from '../../util/flowpipeToBaklavaConverter'

const { baklava, nodeLibrary, graphName } = useFlowpipeEditor()
const actions = useNodeActions()

const WIDTH = 300
const COLLAPSED_WIDTH = 44

const collapsed = ref(false)

// Pinned on all sides, so neither the content nor the canvas can change the width
const sizeStyle = computed(() => {
  const width = `${collapsed.value ? COLLAPSED_WIDTH : WIDTH}px`
  return { width, minWidth: width, maxWidth: width }
})

// Same look for the hide and the show button as in the NodeSidebar
const toggleClass =
  'w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md cursor-pointer opacity-70 hover:opacity-100 hover:bg-[var(--baklava-control-color-background)] transition-colors'
const labelClass = 'text-[11px] font-medium uppercase tracking-wider opacity-50'
const inputClass =
  'h-9 px-3 rounded-md text-sm outline-none border border-[var(--baklava-control-color-active)] bg-[var(--baklava-control-color-background)] focus:border-[var(--baklava-control-color-primary)] transition-colors'

const graph = computed(() => baklava.displayedGraph)

// Same rule as the node toolbar: only a single selected node is inspected
const node = computed(() => {
  const selected = graph.value.selectedNodes
  return selected.length === 1 ? selected[0] : undefined
})

// Icon and description belong to the node type, so they come from the library
const template = computed(() =>
  node.value && nodeLibrary.find(n => flowpipeNodeTypeKey(n) === node.value!.type),
)
const icon = computed(() => template.value?.metadata?.editor?.icon)
const description = computed(() => template.value?.metadata?.editor?.description)

const inputs = computed(() => (node.value ? Object.values(node.value.inputs) : []))

function connectionSource(intf: NodeInterface) {
  const connection = graph.value.connections.find(c => c.to === intf)
  if (!connection) return ''
  const source = graph.value.findNodeById(connection.from.nodeId)
  return `${source?.title ?? '?'}.${connection.from.name}`
}

// Follows renames from the node header as well
const tempTitle = ref('')
watch(() => node.value?.title, title => { tempTitle.value = title ?? '' }, { immediate: true })

function commitRename() {
  if (!node.value) return
  actions.rename(node.value, tempTitle.value)
  // rename() ignores empty titles, so the field falls back to the current one
  tempTitle.value = node.value.title
}
</script>
