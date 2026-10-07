<template>
  <div class="w-full h-full flex flex-col bg-surface-800">
    <TopBar :saveHandler="saveHandler" :runHandler="runHandler" :displayDownloadButton="displayDownloadButton" :displayLoadButton="displayLoadButton" />
    <!-- <TabBar /> -->

    <div class="canvas-area flex flex-1 overflow-hidden">
      <div class="flex-1 relative overflow-hidden">
        <GraphCanvas />
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
import '@baklavajs/themes/dist/syrup-dark.css'
import 'primeicons/primeicons.css'
import '../style.css'

import { provideFlowpipeEditor } from '../composables/useFlowpipeEditor';
import GraphCanvas from './canvas/GraphCanvas.vue';
import TopBar from './TopBar.vue';   
import type { FlowPipeEditorProps } from '../types/editor';
// import RightSidebar from './RightSidebar.vue'
// import NodeSearchDialog from './canvas/NodeSearchDialog.vue'

const { nodeLibrary = [], graph = undefined, saveHandler, runHandler } = defineProps<FlowPipeEditorProps>()

provideFlowpipeEditor(nodeLibrary, graph)
</script>
