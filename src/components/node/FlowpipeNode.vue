<template>
  <!-- Baklava's own node keeps ports, interfaces and resizing; only the header is replaced -->
  <BaklavaNode
    :node="node"
    :selected="selected"
    :dragging="dragging"
    :style="node.color ? { background: `color-mix(in srgb, ${node.color} 18%, var(--baklava-node-color-background))` } : undefined"
    @select="emit('select')"
    @start-drag="emit('start-drag', $event)"
    @contextmenu="openContextMenu"
  >
    <template #title>
      <NodeToolbar v-if="showToolbar" :node="node" @open-menu="menu?.toggle($event)" />

      <!-- "__title" keeps Baklava's header styling (padding, background, grab cursor) -->
      <div
        ref="titleEl"
        class="__title items-center gap-2"
        :style="node.color ? { background: node.color } : undefined"
        @pointerdown.stop="startDrag"
      >
        <!-- Baklava lets the first header child grow, which would be the icon here -->
        <!-- No pointer events, so dragging the header does not start a native image drag -->
        <img v-if="icon" :src="icon" alt="" class="!grow-0 w-4 h-4 object-contain pointer-events-none" />
        <InputText
          v-if="renaming"
          v-model="tempTitle"
          size="small"
          class="flex-auto min-w-0 cursor-text"
          @pointerdown.stop
          @keydown.enter="finishRename"
          @keydown.esc="cancelRename"
          @blur="finishRename"
        />
        <span v-else class="flex-auto min-w-0 truncate select-none" @dblclick="startRename">{{ node.title }}</span>
      </div>

      <NodeMenu ref="menu" :node="node" @rename="startRename" />
    </template>
  </BaklavaNode>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import type { AbstractNode } from '@baklavajs/core'
import { Components } from '@baklavajs/renderer-vue'
import InputText from 'primevue/inputtext'
import { useFlowpipeEditor } from '../../composables/useFlowpipeEditor'
import { useNodeActions } from '../../composables/useNodeActions'
import { flowpipeNodeTypeKey } from '../../util/flowpipeToBaklavaConverter'
import NodeMenu from './NodeMenu.vue'
import NodeToolbar from './NodeToolbar.vue'

const BaklavaNode = Components.Node

const props = defineProps<{
  node: AbstractNode
  selected: boolean
  dragging: boolean
}>()

const emit = defineEmits<{
  select: []
  'start-drag': [ev: PointerEvent]
}>()

const { baklava, nodeLibrary } = useFlowpipeEditor()
const actions = useNodeActions()

const menu = useTemplateRef<InstanceType<typeof NodeMenu>>('menu')
// PrimeVue's InputText exposes no element in its types, so the input is looked up in the header
const titleEl = useTemplateRef<HTMLDivElement>('titleEl')

// The icon belongs to the node type, so it comes from the library and not from the node
const icon = computed(() =>
  nodeLibrary.find(n => flowpipeNodeTypeKey(n) === props.node.type)?.metadata?.editor?.icon,
)

const showToolbar = computed(() =>
  props.selected && !props.dragging && baklava.displayedGraph.selectedNodes.length === 1,
)

// Same as Baklava's own header: dragging an unselected node selects it first
function startDrag(ev: PointerEvent) {
  if (!props.selected) emit('select')
  emit('start-drag', ev)
}

function openContextMenu(ev: MouseEvent) {
  // Text fields inside the node keep the browser menu (copy, paste, ...)
  if ((ev.target as HTMLElement).closest('input, textarea, select')) return
  ev.preventDefault()
  if (!props.selected) emit('select')
  menu.value?.show(ev)
}

const renaming = ref(false)
const tempTitle = ref('')

async function startRename() {
  tempTitle.value = props.node.title
  renaming.value = true
  await nextTick()
  const input = titleEl.value?.querySelector('input')
  input?.focus()
  input?.select()
}

function finishRename() {
  // Enter already finished renaming, the blur that follows must not do it twice
  if (!renaming.value) return
  renaming.value = false
  actions.rename(props.node, tempTitle.value)
}

function cancelRename() {
  renaming.value = false
}
</script>
