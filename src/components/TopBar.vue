<template>
  <header class="top-bar flex items-center gap-2 px-4 bg-surface-800 border-b border-surface-500 flex-shrink-0">
    <div class="flex items-center gap-2 mr-4">
      <i class="pi pi-share-alt text-accent" style="font-size: 16px" />
      <span class="text-sm font-semibold text-gray-200">Flowpipe Editor</span>
    </div>

    <div class="flex items-center gap-2 ml-auto">
      <Button
        label="Load"
        icon="pi pi-upload"
        size="small"
        severity="secondary"
        @click="handleLoad"
      />
      <Button
        label="Save"
        icon="pi pi-download"
        size="small"
        severity="secondary"
        @click="handleSave"
      />
      <Button
        :label="running ? 'Running…' : 'Run'"
        :icon="running ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
        size="small"
        severity="primary"
        :disabled="running"
        @click="handleRun"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useTabStore } from '../stores/tabStore'
import { useFlowpipeSerializer } from '../composables/useFlowpipeSerializer'

const tabStore = useTabStore()
const toast = useToast()
const { toFlowpipeJson, fromFlowpipeJson, downloadJson, loadFromFile } = useFlowpipeSerializer()

const running = ref(false)

async function handleRun() {
  const tab = tabStore.activeTab()
  if (!tab) return

  const graph = toFlowpipeJson(tab.editor, tab.name)
  running.value = true

  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graph),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      throw new Error(text || `HTTP ${res.status}`)
    }

    toast.add({
      severity: 'success',
      summary: 'Pipeline executed',
      detail: `"${tab.name}" finished successfully.`,
      life: 4000,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Execution failed',
      detail: err instanceof Error ? err.message : String(err),
      life: 6000,
    })
  } finally {
    running.value = false
  }
}

function handleSave() {
  const tab = tabStore.activeTab()
  if (!tab) return
  const graph = toFlowpipeJson(tab.editor, tab.name)
  downloadJson(graph, `${tab.name.replace(/\s+/g, '_')}.json`)
}

async function handleLoad() {
  try {
    const data = await loadFromFile()
    const tab = tabStore.addTab(data.name || 'Loaded Graph')
    fromFlowpipeJson(data, tab.editor)
  } catch (e) {
    console.error('Load failed:', e)
  }
}
</script>

<style scoped>
.top-bar {
  height: 44px;
}
</style>
