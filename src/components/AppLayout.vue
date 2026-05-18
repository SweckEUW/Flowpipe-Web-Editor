<template>
  <Toast position="bottom-right" />
  <div class="app-layout flex flex-col h-full bg-surface-800">
    <TopBar />
    <TabBar />

    <div class="canvas-area flex flex-1 overflow-hidden">
      <div class="flex-1 relative overflow-hidden">
        <GraphCanvas
          v-for="tab in tabStore.tabs"
          :key="tab.id"
          :ref="(el) => setCanvasRef(tab.id, el)"
          :editor="tab.editor"
          :active="tab.id === tabStore.activeTabId"
          @open-search="searchVisible = true"
        />

        <div
          v-if="tabStore.tabs.length === 0"
          class="absolute inset-0 flex items-center justify-center text-gray-600 text-sm"
        >
          No graphs open
        </div>
      </div>

      <RightSidebar />
    </div>

    <NodeSearchDialog
      v-model:visible="searchVisible"
      @insert-node="handleInsertNode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Toast from 'primevue/toast'
import TopBar from './TopBar.vue'
import TabBar from './TabBar.vue'
import GraphCanvas from './GraphCanvas.vue'
import RightSidebar from './RightSidebar.vue'
import NodeSearchDialog from './NodeSearchDialog.vue'
import { useTabStore } from '../stores/tabStore'
import { useNodeRegistryStore } from '../stores/nodeRegistryStore'
import type { NodeTypeDefinition } from '../types/nodeRegistry'

const tabStore = useTabStore()
const registry = useNodeRegistryStore()
const searchVisible = ref(false)

type GraphCanvasInstance = InstanceType<typeof GraphCanvas>
const canvasRefs: Record<string, GraphCanvasInstance> = {}

function setCanvasRef(tabId: string, el: unknown) {
  if (el) canvasRefs[tabId] = el as GraphCanvasInstance
  else delete canvasRefs[tabId]
}

function handleInsertNode(def: NodeTypeDefinition) {
  canvasRefs[tabStore.activeTabId]?.insertNode(def)
}

onMounted(async () => {
  await registry.fetchRegistry()
  tabStore.addTab('Graph 1')
})
</script>

<style scoped>
.app-layout {
  width: 100vw;
  height: 100vh;
}
</style>
