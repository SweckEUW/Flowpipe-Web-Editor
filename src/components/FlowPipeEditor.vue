<template>
  <Toast position="bottom-right" />

  <div class="w-screen h-screen flex flex-col bg-surface-800">
    <TopBar />
    <!-- <TabBar /> -->

    <div class="canvas-area flex flex-1 overflow-hidden">
      <div class="flex-1 relative overflow-hidden">
        <GraphCanvas/>
      </div>

      <!-- <RightSidebar /> -->
    </div>

    
    <!-- <NodeSearchDialog
      v-model:visible="searchVisible"
      @insert-node="handleInsertNode"
    /> -->
  </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import GraphCanvas from './GraphCanvas.vue'
import TopBar from './TopBar.vue'
import { provide } from 'vue';
// import RightSidebar from './RightSidebar.vue'
// import NodeSearchDialog from './NodeSearchDialog.vue'

const props = defineProps<{
  flowpipeJson: string | undefined
  saveHandler: (flowpipeJson: string) => Promise<void> | void
}>()

provide('registerSave', async (flowpipeJson: string) => {
  await props.saveHandler(flowpipeJson)
})
</script>
