<template>
  <div
    ref="canvas"
    class="relative h-full w-full"
    @dragover="onDragOver"
    @drop="onDrop" 
    @pointermove="onPointerMove"
    @pointerleave="pointerInside = false"
  >
    <BaklavaEditor :view-model="baklava">
      <template #node="{ node, selected, dragging, onSelect, onStartDrag }">
        <FlowpipeNode
          :node="node"
          :selected="selected"
          :dragging="dragging"
          @select="onSelect(undefined)"
          @start-drag="onStartDrag"
        />
      </template>
    </BaklavaEditor>

    <NodeSearchDialog ref="search" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import { BaklavaEditor } from '@baklavajs/renderer-vue'
import { useFlowpipeEditor } from '../../composables/useFlowpipeEditor'
import { NODE_DRAG_TYPE, useNodeActions } from '../../composables/useNodeActions'
import FlowpipeNode from '../node/FlowpipeNode.vue'
import NodeSearchDialog from './NodeSearchDialog.vue'

const { baklava, canvasEl } = useFlowpipeEditor()
const actions = useNodeActions()

// Shared through the context, so the sidebar can place nodes in the visible area
const canvas = useTemplateRef<HTMLDivElement>('canvas')
const search = useTemplateRef<InstanceType<typeof NodeSearchDialog>>('search')

// Only drags from the NodeSidebar are accepted, files or text dropped on the canvas are ignored
function onDragOver(ev: DragEvent) {
  if (!ev.dataTransfer?.types.includes(NODE_DRAG_TYPE)) return
  ev.preventDefault()
  ev.dataTransfer.dropEffect = 'copy'
}

function onDrop(ev: DragEvent) {
  const type = ev.dataTransfer?.getData(NODE_DRAG_TYPE)
  if (!type) return
  ev.preventDefault()
  actions.add(type, ev.clientX, ev.clientY)
}

// The node search opens where the mouse is, so it has to be tracked
let pointerX = 0
let pointerY = 0
let pointerInside = false

function onPointerMove(ev: PointerEvent) {
  pointerX = ev.clientX
  pointerY = ev.clientY
  pointerInside = true
}

// Tab opens the search like in Nuke. Outside the canvas and in inputs Tab keeps moving the focus.
function onKeyDown(ev: KeyboardEvent) {
  if (ev.key !== 'Tab' || !pointerInside) return
  ev.preventDefault()
  search.value?.open(pointerX, pointerY)
}

onMounted(() => {
  canvasEl.value = canvas.value
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  canvasEl.value = null
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style>
.baklava-editor .background {
  background-image:
    radial-gradient(circle, #444 1px, transparent 1.5px),
    none,
    radial-gradient(circle, #444 1px, transparent 1.5px),
    none !important;
}
</style>
