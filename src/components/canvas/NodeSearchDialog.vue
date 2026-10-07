<template>
  <div
    v-if="visible"
    ref="root"
    class="absolute z-50 w-[300px] flex flex-col overflow-hidden rounded-md border border-[var(--baklava-control-color-active)] bg-[var(--baklava-context-menu-background)] text-[var(--baklava-sidebar-color-foreground)] shadow-[var(--baklava-context-menu-shadow)]"
    :style="{ left: `${left}px`, top: `${top}px` }"
    @contextmenu.prevent
    @wheel.stop
  >
    <input
      ref="input"
      v-model="query"
      type="text"
      placeholder="Search nodes"
      class="h-8 px-2 m-1 rounded-sm text-sm outline-none border border-[var(--baklava-control-color-primary)] bg-[var(--baklava-control-color-background)] placeholder:text-[var(--baklava-sidebar-color-foreground)] placeholder:opacity-50"
      @keydown.stop="onKeyDown"
      @blur="close(false)"
    />
    <div ref="list" class="max-h-[224px] overflow-y-auto pb-1" @mousedown.prevent>
      <p v-if="results.length === 0" class="px-3 py-1.5 text-xs opacity-60">No nodes found.</p>

      <div
        v-for="(entry, index) in results"
        :key="entry.type"
        class="flex items-center gap-2 h-7 px-3 text-sm cursor-pointer"
        :class="{ 'bg-[var(--baklava-control-color-hover)]': index === activeIndex }"
        @mouseenter="activeIndex = index"
        @click="insert(entry)"
      >
        <img v-if="entry.icon" :src="entry.icon" alt="" class="w-3.5 h-3.5 flex-shrink-0 object-contain" />
        <i v-else class="pi pi-box text-[11px] opacity-60" />
        <span class="truncate">{{ entry.label }}</span>
        <span class="truncate opacity-50">[{{ entry.category }}]</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useFlowpipeEditor } from '../../composables/useFlowpipeEditor'
import { useNodeActions } from '../../composables/useNodeActions'
import { buildNodeEntries, type NodeEntry } from '../../util/nodeEntries'

const { nodeLibrary, canvasEl } = useFlowpipeEditor()
const actions = useNodeActions()

const entries = buildNodeEntries(nodeLibrary)

const root = useTemplateRef<HTMLDivElement>('root')
const input = useTemplateRef<HTMLInputElement>('input')
const list = useTemplateRef<HTMLDivElement>('list')

const visible = ref(false)
const query = ref('')
const activeIndex = ref(0)
// Screen position the node is added at
let clientX = 0
let clientY = 0
// Position of the search inside the canvas
const left = ref(0)
const top = ref(0)
// Gets the focus back after a node was picked, so Baklava's hotkeys keep working
let previousFocus: HTMLElement | null = null

// Label prefix first, then label, then category and description; ties keep the library order
const results = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return entries

  const rank = (entry: NodeEntry) => {
    const label = entry.label.toLowerCase()
    if (label.startsWith(q)) return 0
    if (label.includes(q)) return 1
    if ([entry.category, entry.description].some(text => text?.toLowerCase().includes(q))) return 2
    return -1
  }

  return entries
    .map(entry => ({ entry, rank: rank(entry) }))
    .filter(result => result.rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map(result => result.entry)
})

watch(query, () => { activeIndex.value = 0 })

/** Opens the search at a screen position, e.g. the mouse */
async function open(x: number, y: number) {
  clientX = x
  clientY = y
  query.value = ''
  activeIndex.value = 0
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  visible.value = true

  await nextTick()
  if (!canvasEl.value || !root.value) return
  // Kept inside the canvas, measured with the full list
  const rect = canvasEl.value.getBoundingClientRect()
  left.value = Math.max(0, Math.min(x - rect.left, rect.width - root.value.offsetWidth))
  top.value = Math.max(0, Math.min(y - rect.top, rect.height - root.value.offsetHeight))
  input.value?.focus()
}

function close(restoreFocus: boolean) {
  if (!visible.value) return
  visible.value = false
  if (restoreFocus) previousFocus?.focus()
  previousFocus = null
}

function insert(entry: NodeEntry) {
  close(true)
  actions.add(entry.type, clientX, clientY)
}

function move(step: number) {
  const count = results.value.length
  if (count === 0) return
  activeIndex.value = (activeIndex.value + step + count) % count
  nextTick(() => list.value?.children[activeIndex.value]?.scrollIntoView({ block: 'nearest' }))
}

function onKeyDown(ev: KeyboardEvent) {
  switch (ev.key) {
    case 'ArrowDown':
      ev.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      ev.preventDefault()
      move(-1)
      break
    case 'Enter': {
      ev.preventDefault()
      const entry = results.value[activeIndex.value]
      if (entry) insert(entry)
      break
    }
    case 'Escape':
      ev.preventDefault()
      close(true)
      break
    // Tab toggles the search, like it opened it
    case 'Tab':
      ev.preventDefault()
      close(true)
      break
  }
}

defineExpose({ open })
</script>
