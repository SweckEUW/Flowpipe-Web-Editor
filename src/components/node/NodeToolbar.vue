<template>
  <div
    class="absolute left-1/2 bottom-[calc(100%+12px)] origin-bottom flex items-center gap-0.5 p-1 whitespace-nowrap cursor-default bg-(--baklava-node-color-background) border border-[#3a3a3a] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
    :style="style"
    @pointerdown.stop
  >
    <Button icon="pi pi-trash" text severity="secondary" v-tooltip.top="'Remove'" @click="actions.remove(node)" />
    <Divider layout="vertical" class="!mx-1 !my-0" />
    <Button icon="pi pi-info-circle" text severity="secondary" v-tooltip.top="'Info'" />
    <Button text severity="secondary" v-tooltip.top="'Color'" @click="colorPopover?.toggle($event)">
      <span class="inline-block w-3.5 h-3.5 rounded-full" :style="{ background: node.color ?? DEFAULT_COLOR_DOT }" />
      <i class="pi pi-chevron-down !text-[0.7rem]" />
    </Button>
    <Divider layout="vertical" class="!mx-1 !my-0" />
    <Button icon="pi pi-ellipsis-v" text severity="secondary" v-tooltip.top="'More'" @click="emit('open-menu', $event)" />

    <NodeColorPopover ref="colorPopover" :node="node" />
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import type { AbstractNode } from '@baklavajs/core'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import { useFlowpipeEditor } from '../../composables/useFlowpipeEditor'
import { useNodeActions } from '../../composables/useNodeActions'
import NodeColorPopover, { DEFAULT_COLOR_DOT } from './NodeColorPopover.vue'

defineProps<{
  node: AbstractNode
}>()

// The menu is shared with the node's context menu, so the node owns it
const emit = defineEmits<{
  'open-menu': [ev: MouseEvent]
}>()

const { baklava } = useFlowpipeEditor()
const actions = useNodeActions()
const colorPopover = useTemplateRef<InstanceType<typeof NodeColorPopover>>('colorPopover')

// The toolbar lives inside the zoomed node container; scaling it back keeps it readable at any zoom level
const style = computed(() => ({
  transform: `translateX(-50%) scale(${1 / baklava.displayedGraph.scaling})`,
}))
</script>
