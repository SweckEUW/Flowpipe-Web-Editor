<template>
  <header class="h-[50px] flex items-center gap-2 px-4 bg-surface-800 border-b border-surface-500 flex-shrink-0">
    <div class="flex items-center gap-4 mr-4">
      <i class="pi pi-share-alt text-accent"/>
      <span class="text-sm font-semibold text-gray-200">Flowpipe Editor</span>
    </div>

    <div class="flex items-center gap-2 ml-auto">

      <FileUpload 
        v-if="displayLoadButton"
        mode="basic" 
        accept=".json,application/json"
        @select="handleLoad($event)"
        :auto="true" 
        :chooseLabel="isLoading ? 'Loading…' : 'Load Graph'" 
        :chooseIcon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-upload'"
        :chooseButtonProps="{outlined: true, severity: 'primary', disabled: isLoading}"
      />
  
      <Button
        v-if="saveHandler"
        :label="isSaving ? 'Saving…' : 'Save'"
        :icon="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"
        severity="primary"
        outlined
        :disabled="isSaving"
        @click="handleSave"
      />
      
      <Button
        v-if="runHandler"
        :label="isRunning ? 'Executing...' : 'Execute'"
        :icon="isRunning ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
        severity="primary"
        outlined
        :disabled="isRunning"
        @click="handleRun"
      />

      <Button
        v-if="displayDownloadButton"
        :label="isDownloading ? 'Downloading…' : 'Download'"
        :icon="isDownloading ? 'pi pi-spin pi-spinner' : 'pi pi-download'"
        severity="primary"
        outlined
        :disabled="isDownloading"
        @click="handleDownload"
      />

    </div>
  </header>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import FileUpload, { FileUploadSelectEvent } from 'primevue/fileupload'
import { ref } from 'vue';
import { SerializedFlowpipeGraph } from '../types/flowpipe';
import { useFlowpipeEditor } from '../composables/useFlowpipeEditor';

interface TopBarProps {
  saveHandler?: (serializedFlowpipeGraph: SerializedFlowpipeGraph) => Promise<void> | void,
  runHandler?: (serializedFlowpipeGraph: SerializedFlowpipeGraph) => Promise<void> | void,
  displayDownloadButton?: boolean
  displayLoadButton?: boolean
}

const { saveHandler, runHandler } = defineProps<TopBarProps>()

const { toFlowpipeGraph } = useFlowpipeEditor()

let isRunning = ref(false);
let isSaving = ref(false);
let isDownloading = ref(false);
let isLoading = ref(false);

async function handleSave() {
  isSaving.value = true;

  try {
    await saveHandler?.(toFlowpipeGraph());
  } finally {
    isSaving.value = false;
  }
}

async function handleRun() {
  isRunning.value = true;

  try {
    await runHandler?.(toFlowpipeGraph());
  } finally {
    isRunning.value = false;
  }
}

async function handleDownload() {
  isDownloading.value = true;

  try {
    const graph = toFlowpipeGraph();
    const serializedGraph = JSON.stringify(graph, null, 2);
    const blob = new Blob([serializedGraph], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${graph.name}.json`;
    a.click();

    URL.revokeObjectURL(url);
  } finally {
    isDownloading.value = false;
  }
}

async function handleLoad(event: FileUploadSelectEvent) {
  console.log("handleLoad", event);
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  if (!file) return;

  isLoading.value = true;
  try {
    const content = await file.text();
    const graph: SerializedFlowpipeGraph = JSON.parse(content);
    console.log(graph); // graph verwenden
  } catch (error) {
    console.error('Error loading file:', error);
  } finally {
    isLoading.value = false;
  }
}
</script>