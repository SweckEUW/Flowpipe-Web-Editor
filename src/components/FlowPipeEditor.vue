<template>
  <div class="w-full h-full flex flex-col bg-surface-800">
    <TopBar :saveHandler="saveHandler" />
    <!-- <TabBar /> -->

    <div class="canvas-area flex flex-1 overflow-hidden">
      <div class="flex-1 relative overflow-hidden">
        <GraphCanvas :flowpipeNodes="flowpipeNodes"/>
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
import { FlowpipeNode } from '../types/flowpipe';
import GraphCanvas from './GraphCanvas.vue';
import TopBar from './TopBar.vue';   
// import RightSidebar from './RightSidebar.vue'
// import NodeSearchDialog from './NodeSearchDialog.vue'

interface FlowpipeProps {
  flowpipeJson?: string
  flowpipeNodes?: FlowpipeNode[]
  saveHandler?: (flowpipeJson: string) => Promise<void> | void
}

const {
  flowpipeJson,
  flowpipeNodes = [],
  saveHandler,
} = defineProps<FlowpipeProps>()
</script>