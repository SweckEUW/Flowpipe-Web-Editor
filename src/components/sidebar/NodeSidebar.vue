<template>
  <aside
    class="flex-shrink-0 flex flex-col overflow-hidden select-none border-r border-[var(--baklava-control-color-hover)] bg-[var(--baklava-sidebar-color-background)] text-[var(--baklava-sidebar-color-foreground)]"
    :class="collapsed ? 'w-[44px] items-center py-3' : 'w-[260px]'"
    @contextmenu.prevent
  >
    <!-- Collapsed, only a narrow strip with the button remains, so the sidebar can be opened again -->
    <button
      v-if="collapsed"
      v-tooltip.right="'Show nodes'"
      :class="toggleClass"
      @click="collapsed = false"
    >
      <i class="pi pi-angle-double-right text-xs" />
    </button>

    <template v-else>
      <div class="flex flex-col gap-3 p-4 pb-3">
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-[var(--baklava-node-title-color-foreground)]">Nodes</h2>
          </div>
          <button v-tooltip.left="'Hide nodes'" :class="toggleClass" @click="collapsed = true">
            <i class="pi pi-angle-double-left text-xs" />
          </button>
        </div>

        <!-- Plain input instead of PrimeVue, so it uses the editor colors and not the PrimeVue theme -->
        <label
          class="flex items-center gap-2 px-3 h-9 rounded-md border border-[var(--baklava-control-color-active)] bg-[var(--baklava-control-color-background)] focus-within:border-[var(--baklava-control-color-primary)] transition-colors"
        >
          <i class="pi pi-search text-xs opacity-60" />
          <input
            v-model="query"
            type="search"
            placeholder="Search nodes"
            class="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[var(--baklava-sidebar-color-foreground)] placeholder:opacity-50"
          />
        </label>
      </div>

      <div class="flex-1 overflow-y-auto px-2 pb-3">
        <p v-if="groups.length === 0" class="px-2 py-2 text-xs opacity-60">No nodes found.</p>

        <section v-for="group in groups" :key="group.category">
          <h3 class="px-2 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider opacity-50">
            {{ group.category }}
          </h3>

          <div
            v-for="entry in group.entries"
            :key="entry.type"
            v-tooltip.right="entry.description ? { value: entry.description, showDelay: 500 } : undefined"
            draggable="true"
            class="flex items-center gap-3 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing hover:bg-[var(--baklava-control-color-background)] transition-colors"
            @dragstart="onDragStart($event, entry.type)"
            @click="addToCenter(entry.type)"
          >
            <div
              class="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md border border-[var(--baklava-control-color-active)] bg-[var(--baklava-control-color-background)]"
            >
              <!-- No pointer events, so the image does not become the drag source instead of the entry -->
              <img v-if="entry.icon" :src="entry.icon" alt="" class="w-4 h-4 object-contain pointer-events-none" />
              <i v-else class="pi pi-box text-xs opacity-60" />
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-semibold truncate text-[var(--baklava-node-title-color-foreground)]">{{ entry.label }}</span>
              <span v-if="entry.description" class="text-xs truncate opacity-60">{{ entry.description }}</span>
            </div>
          </div>
        </section>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFlowpipeEditor } from '../../composables/useFlowpipeEditor'
import { NODE_DRAG_TYPE, useNodeActions } from '../../composables/useNodeActions'
import { buildNodeEntries, UNCATEGORIZED, type NodeEntry } from '../../util/nodeEntries'

const { nodeLibrary, canvasEl } = useFlowpipeEditor()
const actions = useNodeActions()

const query = ref('')
const collapsed = ref(false)

// Same look for the hide and the show button
const toggleClass =
  'w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md cursor-pointer opacity-70 hover:opacity-100 hover:bg-[var(--baklava-control-color-background)] transition-colors'

const entries = buildNodeEntries(nodeLibrary)

// Categories keep the order of the library, nodes without a category come last
const groups = computed(() => {
  const q = query.value.toLowerCase().trim()
  const matches = (entry: NodeEntry) =>
    !q || [entry.label, entry.description, entry.category].some(text => text?.toLowerCase().includes(q))

  const byCategory = new Map<string, NodeEntry[]>()
  for (const entry of entries) {
    if (!matches(entry)) continue
    const list = byCategory.get(entry.category) ?? []
    list.push(entry)
    byCategory.set(entry.category, list)
  }

  return [...byCategory]
    .map(([category, entries]) => ({ category, entries }))
    .sort((a, b) => Number(a.category === UNCATEGORIZED) - Number(b.category === UNCATEGORIZED))
})

function onDragStart(ev: DragEvent, type: string) {
  if (!ev.dataTransfer) return
  ev.dataTransfer.setData(NODE_DRAG_TYPE, type)
  ev.dataTransfer.effectAllowed = 'copy'
}

function addToCenter(type: string) {
  if (!canvasEl.value) return
  const rect = canvasEl.value.getBoundingClientRect()
  actions.add(type, rect.left + rect.width / 2, rect.top + rect.height / 2)
}
</script>
