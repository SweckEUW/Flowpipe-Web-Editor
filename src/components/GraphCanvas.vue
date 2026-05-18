<template>
  <div class="graph-canvas-wrapper" :class="{ hidden: !active }">
    <BaklavaEditor :view-model="baklava" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue'
import { BaklavaEditor, useBaklava, setNodePosition } from '@baklavajs/renderer-vue'
import type { Editor } from '@baklavajs/core'
import { useNodeRegistryStore } from '../stores/nodeRegistryStore'
import type { NodeTypeDefinition } from '../types/nodeRegistry'

const props = defineProps<{
  editor: Editor
  active: boolean
}>()

const emit = defineEmits<{
  openSearch: []
}>()

const registry = useNodeRegistryStore()
const baklava = useBaklava(props.editor)

baklava.settings.palette.enabled = false
baklava.settings.sidebar.enabled = false
baklava.settings.toolbar.enabled = false
baklava.settings.enableMinimap = true
baklava.settings.displayValueOnHover = true

function insertNode(def: NodeTypeDefinition) {
  if (!baklava.displayedGraph) return
  const cls = registry.nodeClasses.get(def.type)
  if (!cls) return
  // Add through the reactive proxy so Vue invalidates dragMoves computed in the Editor.
  // Cast required: reactive() strips class methods from the type but the runtime object is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const node = reactive(new cls()) as any
  baklava.displayedGraph.addNode(node)
  setNodePosition(node, 200, 200)
}

function onKeyDown(e: KeyboardEvent) {
  if (!props.active) return
  if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault()
    emit('openSearch')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown, true)
})

defineExpose({ insertNode })
</script>

<style scoped>
.graph-canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
.graph-canvas-wrapper.hidden {
  display: none;
}
.graph-canvas-wrapper :deep(.baklava-editor) {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}
</style>
