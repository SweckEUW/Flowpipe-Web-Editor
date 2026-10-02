import { registerFlowPipeEditor, type SerializedFlowpipeNode } from 'flowpipe-web-editor'

// Nodes the editor offers, defined manually for the demo
const nodeLibrary: SerializedFlowpipeNode[] = [
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "LoadScene",
    "identifier": "LoadScene-demo",
    "inputs": {
      "scene_path": { "name": "scene_path", "value": "/projects/demo/sh010/scene.ma", "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "scene": { "name": "scene", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": { "interpreter": "maya", "label": "LoadScene" },
    "func": { "module": "demo.nodes", "name": "load_scene" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "RenderFrames",
    "identifier": "RenderFrames-demo",
    "inputs": {
      "scene": { "name": "scene", "value": null, "connections": {}, "sub_plugs": {} },
      "start_frame": { "name": "start_frame", "value": 1001, "connections": {}, "sub_plugs": {} },
      "end_frame": { "name": "end_frame", "value": 1100, "connections": {}, "sub_plugs": {} },
      "use_gpu": { "name": "use_gpu", "value": true, "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "images": { "name": "images", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": { "interpreter": "maya", "label": "RenderFrames" },
    "func": { "module": "demo.nodes", "name": "render_frames" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "Denoise",
    "identifier": "Denoise-demo",
    "inputs": {
      "images": { "name": "images", "value": null, "connections": {}, "sub_plugs": {} },
      "strength": { "name": "strength", "value": 0.5, "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "denoised": { "name": "denoised", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": { "interpreter": "python", "label": "Denoise" },
    "func": { "module": "demo.nodes", "name": "denoise" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "Composite",
    "identifier": "Composite-demo",
    "inputs": {
      "plate": { "name": "plate", "value": null, "connections": {}, "sub_plugs": {} },
      "template": { "name": "template", "value": "comp_v001.nk", "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "comp": { "name": "comp", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": { "interpreter": "nuke", "label": "Composite" },
    "func": { "module": "demo.nodes", "name": "composite" }
  },
  {
    "module": "flowpipe.node",
    "cls": "FunctionNode",
    "file_location": null,
    "name": "Publish",
    "identifier": "Publish-demo",
    "inputs": {
      "comp": { "name": "comp", "value": null, "connections": {}, "sub_plugs": {} },
      "comment": { "name": "comment", "value": "", "connections": {}, "sub_plugs": {} },
      "notify_team": { "name": "notify_team", "value": false, "connections": {}, "sub_plugs": {} }
    },
    "outputs": {
      "version": { "name": "version", "value": null, "connections": {}, "sub_plugs": {} }
    },
    "metadata": { "interpreter": "python", "label": "Publish" },
    "func": { "module": "demo.nodes", "name": "publish" }
  }
]

// Defines the <flowpipe-editor> custom element
registerFlowPipeEditor()

// Arrays, objects and functions are passed as properties, not as HTML attributes
const editor = document.createElement('flowpipe-editor')
editor.nodeLibrary = nodeLibrary;
editor.displayDownloadButton = true;
editor.displayLoadButton = true;

// Dumm Handlers
editor.saveHandler = async (graph) => {
  console.log('Save graph', graph)
}
editor.runHandler = async (graph) => {
  console.log('Execute graph', graph)
}

document.getElementById('app')!.append(editor)
