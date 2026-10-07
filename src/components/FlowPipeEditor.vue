<template>
  <div class="w-full h-full flex flex-col bg-surface-800">

    <TopBar :saveHandler="saveHandler" :runHandler="runHandler" :displayDownloadButton="displayDownloadButton" :displayLoadButton="displayLoadButton">
      <template #title>
        <slot name="title">
          <i class="pi pi-share-alt text-accent"/>
          <span class="text-sm font-semibold text-gray-200">Flowpipe Editor</span>
        </slot>
      </template>
    </TopBar>

    <div class="canvas-area flex flex-1 overflow-hidden">
      <NodeSidebar v-if="!disableSidebar" />

      <div class="flex-1 relative overflow-hidden">
        <GraphCanvas />
      </div>  
    </div>
  </div>
</template>

<script setup lang="ts">
import '@baklavajs/themes/dist/syrup-dark.css'
import 'primeicons/primeicons.css'
import '../style.css'

import { provideFlowpipeEditor } from '../composables/useFlowpipeEditor';
import GraphCanvas from './canvas/GraphCanvas.vue';
import TopBar from './TopBar.vue';
import NodeSidebar from './sidebar/NodeSidebar.vue';
import type { FlowPipeEditorProps } from '../types/editor';

const { nodeLibrary = [], graph = undefined, saveHandler, runHandler, disableSidebar = false } = defineProps<FlowPipeEditorProps>()

provideFlowpipeEditor(nodeLibrary, graph)
</script>
