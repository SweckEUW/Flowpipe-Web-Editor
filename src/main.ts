// Local dev setup: uses the editor as a custom element, just like the published package
import { registerFlowPipeEditor, type SerializedFlowpipeNode } from './index'

// Nodes the editor offers, defined manually for local development
const nodeLibrary: SerializedFlowpipeNode[] = [
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "LoadScene",
    "identifier": "LoadScene-dev",
    "inputs": {
      "scene_path": { "name": "scene_path", "value": "/projects/demo/sh010/scene.ma", "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "scene": { "name": "scene", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": {
      "interpreter": "maya",
      "label": "LoadScene",
      "editor": { "category": "Scene", "description": "Opens the Maya scene at scene_path and passes it downstream.", "icon": "https://api.iconify.design/lucide/folder-open.svg?color=%23e5e5e5" }
    },
    "func": { "module": "demo.nodes", "name": "load_scene" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "RenderFrames",
    "identifier": "RenderFrames-dev",
    "inputs": {
      "scene": { "name": "scene", "value": null, "connections": {}, "sub_plugs": {} },
      "start_frame": { "name": "start_frame", "value": 1001, "connections": {}, "sub_plugs": {} },
      "end_frame": { "name": "end_frame", "value": 1100, "connections": {}, "sub_plugs": {} },
      "use_gpu": { "name": "use_gpu", "value": true, "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "images": { "name": "images", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": {
      "interpreter": "maya",
      "label": "RenderFrames",
      "editor": { "category": "Rendering", "description": "Renders start_frame to end_frame of the scene, optionally on the GPU.", "icon": "https://api.iconify.design/lucide/images.svg?color=%23e5e5e5" }
    },
    "func": { "module": "demo.nodes", "name": "render_frames" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "Denoise",
    "identifier": "Denoise-dev",
    "inputs": {
      "images": { "name": "images", "value": null, "connections": {}, "sub_plugs": {} },
      "strength": { "name": "strength", "value": 0.5, "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "denoised": { "name": "denoised", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": {
      "interpreter": "python",
      "label": "Denoise",
      "editor": { "category": "Rendering", "description": "Removes render noise from the images, strength ranges from 0 to 1.", "icon": "https://api.iconify.design/lucide/sparkles.svg?color=%23e5e5e5" }
    },
    "func": { "module": "demo.nodes", "name": "denoise" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "Composite",
    "identifier": "Composite-dev",
    "inputs": {
      "plate": { "name": "plate", "value": null, "connections": {}, "sub_plugs": {} },
      "template": { "name": "template", "value": "comp_v001.nk", "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "comp": { "name": "comp", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": {
      "interpreter": "nuke",
      "label": "Composite",
      "editor": { "category": "Compositing", "description": "Combines the plate with a Nuke comp template.", "icon": "https://api.iconify.design/lucide/layers.svg?color=%23e5e5e5" }
    },
    "func": { "module": "demo.nodes", "name": "composite" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "Publish",
    "identifier": "Publish-dev",
    "inputs": {
      "comp": { "name": "comp", "value": null, "connections": {}, "sub_plugs": {} },
      "comment": { "name": "comment", "value": "", "connections": {}, "sub_plugs": {} },
      "notify_team": { "name": "notify_team", "value": false, "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "version": { "name": "version", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": {
      "interpreter": "python",
      "label": "Publish",
      "editor": { "category": "Pipeline", "description": "Publishes the comp as a new version and optionally notifies the team.", "icon": "https://api.iconify.design/lucide/upload.svg?color=%23e5e5e5" }
    },
    "func": { "module": "demo.nodes", "name": "publish" }
  }
]

// Simulates a backend request so the loading state of the buttons is visible
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Defines the <flowpipe-editor> custom element
registerFlowPipeEditor()

// Arrays, objects and functions are passed as properties, not as HTML attributes
const editor = document.createElement('flowpipe-editor')
editor.nodeLibrary = nodeLibrary
editor.displayDownloadButton = true
editor.displayLoadButton = true

// Pseudo handlers
editor.saveHandler = async (graph) => {
  await wait(500)
  console.log('Save graph', graph)
}
editor.runHandler = async (graph) => {
  await wait(1000)
  console.log('Execute graph', graph)
}

document.getElementById('app')!.append(editor)