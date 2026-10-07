import type { AbstractNode } from "@baklavajs/core";
import { COMMIT_TRANSACTION_COMMAND, COPY_COMMAND, START_TRANSACTION_COMMAND } from "@baklavajs/renderer-vue";
import { useFlowpipeEditor } from "./useFlowpipeEditor";

/** Offset of a duplicate to its original, so it does not hide behind it */
const DUPLICATE_OFFSET = 40;

/** Operations on a single node, used by the node toolbar and the node menus. */
export function useNodeActions() {
  const { baklava } = useFlowpipeEditor();

  const select = (node: AbstractNode) => {
    baklava.displayedGraph.selectedNodes = [node];
  };

  const remove = (node: AbstractNode) => {
    baklava.displayedGraph.removeNode(node);
  };

  const rename = (node: AbstractNode, title: string) => {
    const trimmed = title.trim();
    if (trimmed) node.title = trimmed;
  };

  const setColor = (node: AbstractNode, color: string | undefined) => {
    node.color = color;
  };

  // Baklava's clipboard copies the selection, so the node has to be the only selected one
  const copy = (node: AbstractNode) => {
    select(node);
    baklava.commandHandler.executeCommand(COPY_COMMAND);
  };

  // Not copy + paste: that would overwrite whatever the user put into the clipboard
  const duplicate = (node: AbstractNode) => {
    const nodeType = baklava.editor.nodeTypes.get(node.type);
    if (!nodeType) return;

    const graph = baklava.displayedGraph;
    // Through JSON so the duplicate shares no objects (e.g. position) with the original
    const state = JSON.parse(JSON.stringify(node.save()));

    baklava.commandHandler.executeCommand(START_TRANSACTION_COMMAND);
    // addNode returns the node as the graph holds it, i.e. the reactive version
    const duplicate = graph.addNode(new nodeType.type());
    if (!duplicate) {
      baklava.commandHandler.executeCommand(COMMIT_TRANSACTION_COMMAND);
      return;
    }
    duplicate.load({
      ...state,
      id: duplicate.id,
      position: { x: node.position.x + DUPLICATE_OFFSET, y: node.position.y + DUPLICATE_OFFSET },
    });
    // load() restores the interface ids of the original, but they have to be unique
    for (const intf of [...Object.values(duplicate.inputs), ...Object.values(duplicate.outputs)])
      intf.id = crypto.randomUUID();
    baklava.commandHandler.executeCommand(COMMIT_TRANSACTION_COMMAND);

    select(duplicate);
  };

  return { select, remove, rename, setColor, copy, duplicate };
}
