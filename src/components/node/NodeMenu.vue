<template>
  <!-- Overlays render into <body>; both share the same items -->
  <Menu ref="menu" :model="items" popup />
  <ContextMenu ref="contextMenu" :model="items" />
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { AbstractNode } from '@baklavajs/core'
import ContextMenu from 'primevue/contextmenu'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { useNodeActions } from '../../composables/useNodeActions'

const props = defineProps<{
  node: AbstractNode
}>()

// Renaming happens in the node header, so the menu only asks for it
const emit = defineEmits<{
  rename: []
}>()

const actions = useNodeActions()

const menu = useTemplateRef<InstanceType<typeof Menu>>('menu')
const contextMenu = useTemplateRef<InstanceType<typeof ContextMenu>>('contextMenu')

const items: MenuItem[] = [
  { label: 'Rename', icon: 'pi pi-pencil', command: () => emit('rename') },
  { label: 'Copy', icon: 'pi pi-copy', command: () => actions.copy(props.node) },
  { label: 'Duplicate', icon: 'pi pi-clone', command: () => actions.duplicate(props.node) },
  { separator: true },
  { label: 'Remove', icon: 'pi pi-trash', command: () => actions.remove(props.node) },
]

defineExpose({
  /** Opens the menu below the clicked element, e.g. the toolbar's "more" button */
  toggle: (ev: Event) => menu.value?.toggle(ev),
  /** Opens the menu at the mouse position */
  show: (ev: MouseEvent) => contextMenu.value?.show(ev),
})
</script>
