import { IConnectionState, IGraphState, INodeDefinition, NodeInterface } from "@baklavajs/core";
// Importing renderer-vue also pulls in its module augmentations, which add
// panning/scaling to IGraphState and position to a node.
import { CheckboxInterface, NumberInterface, TextInputInterface } from "@baklavajs/renderer-vue";
import {
    SerializedFlowpipeGraph,
    SerializedFlowpipeNode,
    SerializedInputPlug,
    SerializedOutputPlug,
} from "../types/flowpipe";

// ---------------------------------------------------------------------------
// Flowpipe -> Baklava: turn serialized flowpipe nodes into Baklava node types
// ---------------------------------------------------------------------------

// Resolve plug data type to matching Baklava interface
function createInterfaceForPlug(name: string, plug: SerializedInputPlug | SerializedOutputPlug, isInput: boolean): NodeInterface<any> {
    const value = plug.value;

    // Outputs need no interactive input widgets
    if (!isInput) return new NodeInterface(name, undefined);

    // Detect type from default value
    if (typeof value === "boolean") return new CheckboxInterface(name, value);
    if (typeof value === "number") return new NumberInterface(name, value);
    if (typeof value === "string") return new TextInputInterface(name, value);

    // Fallback if value is null or undefined
    return new TextInputInterface(name, "");
}

/**
 * Stable node type key, used both when registering node types and when converting back.
 *
 * `cls`/`module` alone are not enough: every @Node decorated function shares
 * cls === "FunctionNode" and module === "flowpipe.node", so all of them would
 * collapse into a single type. The decorated function is only identified by `func`.
 */
export function flowpipeNodeTypeKey(node: SerializedFlowpipeNode): string {
    if (node.metadata?.editor?.type) return node.metadata.editor.type;
    // Graphs written before the editor metadata moved under `metadata.editor`
    if (typeof node.metadata?.type === "string") return node.metadata.type;
    if (node.func) return `${node.func.module}.${node.func.name}`;
    return `${node.module}.${node.cls}`;
}

export function flowpipeNodeToBaklava(node: SerializedFlowpipeNode): INodeDefinition<any, any> {
    const inputs: Record<string, () => NodeInterface<any>> = {};
    const outputs: Record<string, () => NodeInterface<any>> = {};

    // Build typed input interfaces
    for (const [key, plug] of Object.entries(node.inputs || {}))
        inputs[key] = () => createInterfaceForPlug(plug.name || key, plug, true);

    // Build typed output interfaces
    for (const [key, plug] of Object.entries(node.outputs || {}))
        outputs[key] = () => createInterfaceForPlug(plug.name || key, plug, false);

    return {
        type: flowpipeNodeTypeKey(node),
        title: node.metadata?.label || node.func?.name || node.cls,
        inputs,
        outputs,
        onCreate(this: any) {
            this.flowpipe = {
                cls: node.cls,
                module: node.module,
                file_location: node.file_location,
                func: node.func,                 // falls FunctionNode
                metadata: { ...node.metadata },
            };
        }
    };
}

// ---------------------------------------------------------------------------
// Flowpipe -> Baklava: turn a serialized flowpipe graph into a loadable state
// ---------------------------------------------------------------------------

/**
 * Node state as `Graph.load()` consumes it, plus the `position` and `width`
 * renderer-vue reads in its beforeLoad hook. A missing `width` and `twoColumn`
 * are left to the renderer, which fills in its defaults.
 *
 * Not Baklava's own `INodeState`: that type intersects with
 * `NodeInterfaceDefinitionStates<Record<string, NodeInterface<any>>>`, which
 * demands NodeInterface instances as interface *values* and so cannot be built
 * from the outside at all.
 */
interface LoadableNodeState {
    type: string;
    id: string;
    title: string;
    inputs: Record<string, LoadableInterfaceState>;
    outputs: Record<string, LoadableInterfaceState>;
    position: { x: number; y: number; };
    width?: number;
    /** Read by useFlowpipeEditor's node hooks */
    color?: string;
}

interface LoadableInterfaceState {
    id: string;
    value: unknown;
}

/** Viewport and identity of the graph the state is loaded into. */
export interface BaklavaGraphView {
    id: string;
    panning: { x: number; y: number };
    scaling: number;
}

/** Everything the connection pass needs to look a node up by its flowpipe identifier. */
interface LoadedNode {
    nodeId: string;
    name: string;
    /** Input key -> interface id */
    inputInterfaces: Map<string, string>;
    /** Output *name* -> interface id. Connections reference names, not keys. */
    outputInterfaces: Map<string, string>;
}

/** Interface ids only have to be unique; deriving them keeps the state readable. */
function interfaceId(nodeId: string, key: string, isInput: boolean): string {
    return `${nodeId}::${isInput ? "in" : "out"}::${key}`;
}

/**
 * Inverse of `restorePlugValue`: flowpipe stores an unset plug as null, while
 * `createInterfaceForPlug` renders those as an empty text field.
 */
function toInterfaceValue(value: unknown, templateValue: unknown): unknown {
    if (value !== null && value !== undefined) return value;
    return templateValue ?? "";
}

/**
 * Convert a serialized flowpipe graph into a Baklava graph state.
 *
 * The node types must already be registered on the editor, otherwise
 * `Graph.load()` drops the affected nodes and reports them as warnings.
 *
 * @param graph       Graph to load
 * @param nodeLibrary Flowpipe nodes the editor was initialized with. Not needed to
 *                    build the state - the graph carries its own plugs - but a node
 *                    type that is missing here would silently lose plugs on load.
 * @param view        Identity and viewport of the target graph, see `loadFlowpipeGraph`
 */
export function flowpipeGraphToBaklava(
    graph: SerializedFlowpipeGraph,
    nodeLibrary: SerializedFlowpipeNode[],
    view: BaklavaGraphView,
): IGraphState {
    const warn = (message: string) => console.warn(`[flowpipe] ${message}`);

    const templates = new Map<string, SerializedFlowpipeNode>();
    for (const template of nodeLibrary) {
        const key = flowpipeNodeTypeKey(template);
        if (!templates.has(key)) templates.set(key, template);
    }

    const nodes: LoadableNodeState[] = [];
    const connections: IConnectionState[] = [];
    const byIdentifier = new Map<string, LoadedNode>();
    const takenNodeIds = new Set<string>();

    for (const node of graph.nodes || []) {
        const type = flowpipeNodeTypeKey(node);
        const template = templates.get(type);
        if (!template)
            warn(`Node type "${type}" (node "${node.name}") is not in the node library, it will not load.`);

        // Reusing the stored Baklava id keeps the flowpipe identifier stable across
        // save/load cycles - baklavaToFlowpipeGraph derives it from this id.
        let nodeId = node.metadata?.editor?.id;
        if (!nodeId || takenNodeIds.has(nodeId)) {
            if (nodeId) warn(`Duplicate editor id "${nodeId}" (node "${node.name}"), assigning a new one.`);
            nodeId = crypto.randomUUID();
        }
        takenNodeIds.add(nodeId);

        if (byIdentifier.has(node.identifier)) {
            warn(`Duplicate node identifier "${node.identifier}", connections to it may go to the wrong node.`);
        }

        const inputInterfaces = new Map<string, string>();
        const inputs: Record<string, LoadableInterfaceState> = {};
        for (const [key, plug] of Object.entries(node.inputs || {})) {
            const id = interfaceId(nodeId, key, true);
            inputs[key] = { id, value: toInterfaceValue(plug.value, template?.inputs?.[key]?.value) };
            inputInterfaces.set(key, id);
        }

        const outputInterfaces = new Map<string, string>();
        const outputs: Record<string, LoadableInterfaceState> = {};
        for (const [key, plug] of Object.entries(node.outputs || {})) {
            const id = interfaceId(nodeId, key, false);
            outputs[key] = { id, value: plug.value ?? undefined };
            outputInterfaces.set(plug.name || key, id);
        }

        const position = node.metadata?.editor?.position;
        nodes.push({
            type,
            id: nodeId,
            title: node.name,
            inputs,
            outputs,
            position: { x: position?.x ?? 0, y: position?.y ?? 0 },
            width: node.metadata?.editor?.width,
            color: node.metadata?.editor?.color,
        });

        byIdentifier.set(node.identifier, { nodeId, name: node.name, inputInterfaces, outputInterfaces });
    }

    // Only the input side is read: flowpipe's deserializer does the same, and the
    // output side holds the identical edges - walking both would duplicate them.
    for (const node of graph.nodes || []) {
        const target = byIdentifier.get(node.identifier);
        if (!target) continue;

        for (const [key, plug] of Object.entries(node.inputs || {})) {
            for (const [upstreamIdentifier, outputName] of Object.entries(plug.connections || {})) {
                const to = target.inputInterfaces.get(key);
                if (!to) continue;

                // "<out>.<key>" addresses a sub plug, which Baklava has no equivalent for.
                if (outputName.includes(".")) {
                    warn(`Input "${node.name}.${key}" is connected to sub plug "${outputName}", skipping it.`);
                    continue;
                }

                const source = byIdentifier.get(upstreamIdentifier);
                if (!source) {
                    warn(`Input "${node.name}.${key}" references unknown node "${upstreamIdentifier}", skipping it.`);
                    continue;
                }

                const from = source.outputInterfaces.get(outputName);
                if (!from) {
                    warn(`Node "${source.name}" has no output "${outputName}" (needed by "${node.name}.${key}"), skipping it.`);
                    continue;
                }

                connections.push({ id: `${from}->${to}`, from, to });
            }
        }
    }

    return {
        id: view.id,
        // See LoadableNodeState: INodeState cannot describe a state built from scratch.
        nodes: nodes as unknown as IGraphState["nodes"],
        connections,
        // Deprecated in Baklava and ignored by Graph.load(), but part of IGraphState.
        inputs: [],
        outputs: [],
        // renderer-vue assigns these without a fallback, so they must be present.
        panning: view.panning,
        scaling: view.scaling,
    };
}
