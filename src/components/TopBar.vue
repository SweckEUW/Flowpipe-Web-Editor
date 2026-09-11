<template>
  <header class="h-[80px] flex items-center gap-2 px-4 bg-surface-800 border-b border-surface-500 flex-shrink-0">
    <div class="flex items-center gap-2 mr-4">
      <i class="pi pi-share-alt text-accent" style="font-size: 16px" />
      <span class="text-sm font-semibold text-gray-200">Flowpipe Editor</span>
    </div>

    <div class="flex items-center gap-2 ml-auto">
      <Button
        v-if="saveHandler"
        :label="isSaving ? 'Saving…' : 'Save'"
        :icon="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"
        size="small"
        severity="success"
        @click="handleSave"
      />
      
      <!-- <Button
        :label="isRunning ? 'Running…' : 'Run'"
        :icon="isRunning ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
        size="small"
        severity="primary"
        :disabled="isRunning"
        @click="handleRun"
      /> -->
    </div>
  </header>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { ref } from 'vue';
// import { baklavaToFlowpipeJson } from '../util/flowpipeBaklavaConverter';

const props = defineProps<{
  saveHandler: ((flowpipeJson: string) => Promise<void> | void) | undefined
  // runHandler: ((flowpipeJson: string) => Promise<void> | void) | undefined
}>()

let isRunning = ref(false);
let isSaving = ref(false);

async function handleSave() {
  isSaving.value = true;

  // Simulate a save operation. TODO: (replace this with your actual save logic)
  // let updateFlowpipeJson = baklavaToFlowpipeJson() // Save the current state of the Baklava editor to Flowpipe JSON
  let updateFlowpipeJson = "{ 'test' : 'wasd' }";

  await props.saveHandler!(updateFlowpipeJson);
  isSaving.value = false;
}

async function handleRun() {
  isRunning.value = true;

  try {
    // Simulate a run operation (replace this with your actual run logic)
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('Error running:', error);
  } finally {
    isRunning.value = false;
  }
}
</script>