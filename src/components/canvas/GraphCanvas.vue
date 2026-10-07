<template>
  <div class="h-full w-full">
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
  </div>
</template>

<script setup lang="ts">
import { BaklavaEditor } from '@baklavajs/renderer-vue'
import { useFlowpipeEditor } from '../../composables/useFlowpipeEditor'
import FlowpipeNode from '../node/FlowpipeNode.vue'
 
const { baklava } = useFlowpipeEditor() 

// TODO: Check if the connections between the nodes are valid. If not, remove them.
// Belongs into useFlowpipeEditor() next to the node type registration.
// baklava.editor.graphEvents.checkConnection.subscribe("typeValidator", (data) => {
//   const fromType = (data.from as any).dataType;
//   const toType = (data.to as any).dataType;

//   // Allow wildcards or untyped interfaces
//   if (!fromType || !toType || fromType === "any" || toType === "any") return;

//   // Block connection if types do not match
//   if (fromType !== toType) data.preventDefault();
// }); 

// const emit = defineEmits<{
//   openSearch: []
// }>()

// function insertNode(def: NodeTypeDefinition) {
//   if (!baklava.displayedGraph) return
//   const cls = registry.nodeClasses.get(def.type)
//   if (!cls) return
//   const node = reactive(new cls()) as any
//   baklava.displayedGraph.addNode(node)
//   setNodePosition(node, 200, 200)
// }

// function onKeyDown(e: KeyboardEvent) {
//   if (!props.active) return
//   if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) {
//     e.preventDefault()
//     emit('openSearch')
//   }
// }

// onMounted(() => {
//   window.addEventListener('keydown', onKeyDown, true)
// })

// onUnmounted(() => {
//   window.removeEventListener('keydown', onKeyDown, true)
// })

// defineExpose({ insertNode })
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
