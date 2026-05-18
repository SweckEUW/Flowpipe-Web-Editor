<template>
  <div class="tab-bar flex items-center bg-surface-800 border-b border-surface-500 overflow-x-auto flex-shrink-0">
    <div
      v-for="tab in tabStore.tabs"
      :key="tab.id"
      class="tab-item flex items-center gap-1 px-3 py-1.5 cursor-pointer border-r border-surface-500 text-xs select-none flex-shrink-0 max-w-40"
      :class="{
        'bg-surface-600 text-gray-100': tab.id === tabStore.activeTabId,
        'text-gray-400 hover:bg-surface-700 hover:text-gray-200': tab.id !== tabStore.activeTabId,
      }"
      @click="tabStore.setActiveTab(tab.id)"
      @dblclick.stop="startRename(tab.id, tab.name)"
    >
      <template v-if="editingTabId === tab.id">
        <input
          v-model="editingName"
          class="tab-input bg-transparent outline-none text-xs text-gray-100 w-24"
          autofocus
          @blur="commitRename"
          @keydown="onRenameKeydown"
          @click.stop
        />
      </template>
      <template v-else>
        <span class="truncate">{{ tab.name }}</span>
      </template>
      <button
        class="tab-close ml-1 w-4 h-4 flex items-center justify-center rounded hover:bg-surface-400 text-gray-500 hover:text-gray-200 flex-shrink-0"
        title="Close tab"
        @click="closeTab($event, tab.id)"
      >
        <i class="pi pi-times" style="font-size: 9px" />
      </button>
    </div>

    <button
      class="add-tab flex-shrink-0 px-2 py-1.5 text-gray-500 hover:text-gray-200 hover:bg-surface-700 transition-colors text-xs"
      title="New graph"
      @click="tabStore.addTab()"
    >
      <i class="pi pi-plus" style="font-size: 11px" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTabStore } from '../stores/tabStore'

const tabStore = useTabStore()

const editingTabId = ref<string | null>(null)
const editingName = ref('')

function startRename(id: string, currentName: string) {
  editingTabId.value = id
  editingName.value = currentName
}

function commitRename() {
  if (editingTabId.value && editingName.value.trim()) {
    tabStore.renameTab(editingTabId.value, editingName.value.trim())
  }
  editingTabId.value = null
}

function onRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') commitRename()
  if (e.key === 'Escape') editingTabId.value = null
}

function closeTab(e: MouseEvent, id: string) {
  e.stopPropagation()
  tabStore.removeTab(id)
}
</script>

<style scoped>
.tab-bar {
  height: 34px;
}
.tab-item {
  height: 100%;
  min-width: 80px;
}
</style>
