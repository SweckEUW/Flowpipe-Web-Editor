<template>
  <div class="h-full w-full">
    <BaklavaEditor :view-model="baklava" />
  </div>
</template>

<script setup lang="ts">
import { BaklavaEditor, useBaklava } from '@baklavajs/renderer-vue'
import { defineNode, NodeInterface } from "@baklavajs/core";
import { NumberInterface, SelectInterface } from "@baklavajs/renderer-vue";

// const emit = defineEmits<{
//   openSearch: []
// }>()

// Demo Node
let newNode = defineNode({
  type: "MyNode",
  inputs: {
    number1: () => new NumberInterface("Number", 1),
    number2: () => new NumberInterface("Number", 10),
    operation: () => new SelectInterface("Operation", "Add", ["Add", "Subtract"]).setPort(false),
  },
  outputs: {
    output: () => new NodeInterface("Output", 0),
  }
});

const baklava = useBaklava()
baklava.editor.registerNodeType(newNode);

// baklava.settings.palette.enabled = false
// baklava.settings.sidebar.enabled = false
// baklava.settings.toolbar.enabled = false
// baklava.settings.enableMinimap = true
// baklava.settings.displayValueOnHover = true

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