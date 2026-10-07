<template>
  <Popover ref="popover">
    <div class="grid grid-cols-3 gap-1.5">
      <button
        v-for="preset in COLOR_PRESETS"
        :key="preset.label"
        class="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white cursor-pointer hover:border-white"
        :class="node.color === preset.value ? 'border-white' : 'border-transparent'"
        :style="{ background: preset.value ?? DEFAULT_COLOR_DOT }"
        v-tooltip.top="preset.label"
        @click="pickColor(preset.value)"
      >
        <i v-if="!preset.value" class="pi pi-ban" />
      </button>
    </div>
  </Popover>
</template>

<script lang="ts">
/** Shown for nodes without a color of their own */
export const DEFAULT_COLOR_DOT = '#888888'
</script>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { AbstractNode } from '@baklavajs/core'
import Popover from 'primevue/popover'
import { useNodeActions } from '../../composables/useNodeActions'

const COLOR_PRESETS: { label: string; value: string | undefined }[] = [
  { label: 'Default', value: undefined },
  { label: 'Red', value: '#8c2f39' },
  { label: 'Orange', value: '#9a5b1e' },
  { label: 'Yellow', value: '#8a7a1f' },
  { label: 'Green', value: '#2f6b3a' },
  { label: 'Cyan', value: '#1f6a72' },
  { label: 'Blue', value: '#2c4f8c' },
  { label: 'Purple', value: '#5e3a8c' },
  { label: 'Pink', value: '#8c3a6f' },
]

const props = defineProps<{
  node: AbstractNode
}>()

const actions = useNodeActions()
const popover = useTemplateRef<InstanceType<typeof Popover>>('popover')

function pickColor(color: string | undefined) {
  actions.setColor(props.node, color)
  popover.value?.hide()
}

defineExpose({
  toggle: (ev: Event) => popover.value?.toggle(ev),
})
</script>
