<template>
  <div class="h-full w-full">
    <BaklavaEditor :view-model="baklava" />
  </div>
</template>

<script setup lang="ts">
import { BaklavaEditor, useBaklava } from '@baklavajs/renderer-vue'
import { defineNode } from "@baklavajs/core";
import { FlowpipeNode } from '../types/flowpipe';
import { flowpipeNodeToBaklava } from '../util/flowpipeBaklavaConverter';

interface GraphCanvasProps {
  flowpipeNodes: FlowpipeNode[]
}

const {
  flowpipeNodes,
} = defineProps<GraphCanvasProps>()

const baklava = useBaklava()
// baklava.settings.palette.enabled = false
// baklava.settings.sidebar.enabled = false
// baklava.settings.toolbar.enabled = false
// baklava.settings.enableMinimap = true
// baklava.settings.displayValueOnHover = true

// TODO: Flowpipe Nodes have to be converted to Baklava Nodes. 
flowpipeNodes.forEach(flowpipeNode => {
  let convertedNode = flowpipeNodeToBaklava(flowpipeNode);
  let baklavaNode = defineNode(convertedNode);

  baklava.editor.registerNodeType(baklavaNode);
});

// TODO: Check if the connections between the nodes are valid. If not, remove them.
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