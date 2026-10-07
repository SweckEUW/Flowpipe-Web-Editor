import { Graph, IGraphState } from "@baklavajs/core";
import {
  SerializedFlowpipeGraph,
  SerializedFlowpipeNode,
  SerializedFlowpipeNodeMetadata,
  SerializedInputPlug,
  SerializedOutputPlug,
} from "../types/flowpipe";
// The type key has to be derived exactly the way the node types were registered
import { flowpipeNodeTypeKey } from "./flowpipeToBaklavaConverter";

// ---------------------------------------------------------------------------
// Baklava -> Flowpipe: turn an edited Baklava graph back into flowpipe JSON
// ---------------------------------------------------------------------------

/** A graph as saved by Baklava (`graph.save()`). */
interface SavedGraphState {
    nodes: SavedNodeState[];
    connections: SavedConnectionState[];
}

/** Connections are stored once and reference interface ids, not nodes. */
interface SavedConnectionState {
    id: string;
    from: string;
    to: string;
}

/** Node state as saved by Baklava, extended by the fields renderer-vue adds. */
interface SavedNodeState {
    type: string;
    title: string;
    id: string;
    inputs: Record<string, { id: string; value: unknown; }>;
    outputs: Record<string, { id: string; value: unknown; }>;
    position?: { x: number; y: number; };
    width?: number;
    /** Added by useFlowpipeEditor's node hooks */
    color?: string;
    /** Only on subgraph container nodes: the nested graph */
    graphState?: { nodes?: unknown[]; };
}

/** Everything needed to fill in one flowpipe node during the connection pass. */
interface NodeMapping {
    identifier: string;
    template: SerializedFlowpipeNode;
    node: SerializedFlowpipeNode;
}

/** Where an interface id points to. */
interface InterfaceMapping {
    baklavaNodeId: string;
    key: string;
    isInput: boolean;
}

function isGraph(graph: Graph | IGraphState): graph is Graph {
    return typeof (graph as Graph).save === "function";
}

function deepCopy<T>(value: T): T {
    return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/**
 * Flowpipe requires unique node names per graph (Graph.add_node raises otherwise)
 * and uses "." to separate subgraph from node name in graph["sub.node"].
 */
function uniqueNodeName(title: string, taken: Set<string>): string {
    const base = (title || "Node").replace(/\./g, "_");
    let name = base;
    let counter = 1;
    while (taken.has(name)) name = `${base}_${counter++}`;
    taken.add(name);
    return name;
}

/**
 * Inputs without a value are rendered as an empty text field, so an untouched
 * plug would come back as "" instead of null. Restore null in that case.
 */
function restorePlugValue(current: unknown, templateValue: unknown): unknown {
    if (current === undefined) return templateValue ?? null;
    if (current === "" && templateValue === null) return null;
    return current;
}

/** Warn about cycles - flowpipe would raise CycleError when loading such a graph. */
function checkForCycles(nodes: SerializedFlowpipeNode[], warn: (message: string) => void): void {
    const children = new Map<string, string[]>();
    for (const node of nodes) {
        const targets = new Set<string>();
        for (const plug of Object.values(node.outputs)) {
            for (const identifier of Object.keys(plug.connections)) targets.add(identifier);
        }
        children.set(node.identifier, [...targets]);
    }

    const DONE = 2;
    const state = new Map<string, number>();

    const visit = (identifier: string, path: string[]): boolean => {
        const seen = state.get(identifier);
        if (seen === DONE) return false;
        if (seen !== undefined) {
            warn(`Cycle detected: ${[...path.slice(path.indexOf(identifier)), identifier].join(" -> ")}`);
            return true;
        }

        state.set(identifier, 1);
        path.push(identifier);
        for (const child of children.get(identifier) || []) {
            if (visit(child, path)) return true;
        }
        path.pop();
        state.set(identifier, DONE);
        return false;
    };

    for (const node of nodes) {
        if (visit(node.identifier, [])) return;
    }
}

/**
 * Graph level identity. `module` and `cls` are the import coordinates flowpipe's
 * `deserialize_graph` uses to import and instantiate the graph class; `name` names
 * the graph. Baklava's Graph carries none of the three - it only has an id - so they
 * have to be passed in, usually taken from the graph that was loaded into the editor.
 */
export type FlowpipeGraphIdentity = Partial<Pick<SerializedFlowpipeGraph, "module" | "cls" | "name">>;

/**
 * Convert a Baklava graph back into a serialized flowpipe graph.
 *
 * Baklava's own state only holds type, title, id, interface values and the
 * editor position. Everything flowpipe needs to reconstruct a node - cls,
 * module, file_location, func, the plug set and the base metadata - comes from
 * `flowpipeNodes`, the same node list that was used to register the node types.
 *
 * @param graph        Live graph (e.g. `baklava.displayedGraph`) or a saved `IGraphState`
 * @param flowpipeNodes Flowpipe nodes the editor was initialized with
 * @param identity     Graph name and class; defaults to flowpipe's own Graph called "graph"
 */
export function baklavaToFlowpipeGraph(
    graph: Graph | IGraphState,
    flowpipeNodes: SerializedFlowpipeNode[],
    identity?: FlowpipeGraphIdentity,
): SerializedFlowpipeGraph {
    const warn = (message: string) => console.warn(`[flowpipe] ${message}`);
    const state = (isGraph(graph) ? graph.save() : graph) as unknown as SavedGraphState;

    // Index the node templates by the same key that was used for registration
    const templates = new Map<string, SerializedFlowpipeNode>();
    for (const template of flowpipeNodes) {
        const key = flowpipeNodeTypeKey(template);
        if (templates.has(key)) {
            warn(`Duplicate node type "${key}" in flowpipeNodes, using the first one.`);
            continue;
        }
        templates.set(key, template);
    }

    const nodes: SerializedFlowpipeNode[] = [];
    const byNodeId = new Map<string, NodeMapping>();
    const byInterfaceId = new Map<string, InterfaceMapping>();
    const takenNames = new Set<string>();

    for (const nodeState of state.nodes || []) {
        const template = templates.get(nodeState.type);
        if (!template) {
            // Baklava subgraph container nodes carry their whole inner graph in
            // `graphState`. Flowpipe subgraphs are separate Graph objects instead,
            // so there is no lossless mapping - say what is being dropped.
            const nested = nodeState.graphState?.nodes?.length;
            warn(
                nested
                    ? `Node "${nodeState.title}" is a Baklava subgraph (type "${nodeState.type}") with ${nested} inner node(s), skipping it and its contents.`
                    : `No flowpipe node for type "${nodeState.type}" (node "${nodeState.title}"), skipping it.`,
            );
            continue;
        }

        const name = uniqueNodeName(nodeState.title, takenNames);
        // Derived from the Baklava id instead of a random uuid so that saving the
        // same graph twice produces the same identifiers. Only uniqueness matters.
        const identifier = `${name}-${nodeState.id.replace(/^node_/, "")}`;

        const metadata: SerializedFlowpipeNodeMetadata = { ...deepCopy(template.metadata || {}) };
        // Defensive: the library itself may have come out of an earlier save.
        delete metadata.type;
        delete metadata.position;
        // category, description and icon describe the node type and are kept from the
        // library; id, position, width and color belong to this instance and come from Baklava.
        const { id: _id, position: _position, width: _width, color: _color, ...typeMetadata } = metadata.editor || {};
        metadata.editor = {
            ...typeMetadata,
            // Stored so that loading this graph again reuses the same Baklava id,
            // which in turn reproduces the same identifier above.
            id: nodeState.id,
            type: nodeState.type,
            ...(nodeState.position ? { position: { ...nodeState.position } } : {}),
            ...(nodeState.width ? { width: nodeState.width } : {}),
            ...(nodeState.color ? { color: nodeState.color } : {}),
        };

        const inputs: Record<string, SerializedInputPlug> = {};
        for (const [key, plug] of Object.entries(template.inputs || {})) {
            inputs[key] = {
                name: plug.name || key,
                value: restorePlugValue(nodeState.inputs?.[key]?.value, plug.value) as null,
                connections: {},
                sub_plugs: deepCopy(plug.sub_plugs) || {},
            };
        }

        const outputs: Record<string, SerializedOutputPlug> = {};
        for (const [key, plug] of Object.entries(template.outputs || {})) {
            outputs[key] = {
                name: plug.name || key,
                // Usually null: an output only holds a value if an engine ran and
                // applyResult() wrote it back into the graph.
                value: (nodeState.outputs?.[key]?.value ?? null) as null,
                connections: {},
                sub_plugs: deepCopy(plug.sub_plugs) || {},
            };
        }

        const node: SerializedFlowpipeNode = {
            cls: template.cls,
            module: template.module,
            file_location: template.file_location,
            name,
            identifier,
            inputs,
            outputs,
            metadata,
            ...(template.func ? { func: { ...template.func } } : {}),
        };

        nodes.push(node);
        byNodeId.set(nodeState.id, { identifier, template, node });

        // Interface ids are the anchor of the whole Baklava format. A duplicate id
        // makes Baklava itself attach connections to the wrong interface, so it must
        // not pass unnoticed here either.
        const register = (key: string, intf: { id: string; }, isInput: boolean) => {
            if (byInterfaceId.has(intf.id))
                warn(`Duplicate interface id "${intf.id}" (${name}.${key}), connections may be assigned to the wrong node.`);
            byInterfaceId.set(intf.id, { baklavaNodeId: nodeState.id, key, isInput });
        };
        for (const [key, intf] of Object.entries(nodeState.inputs || {})) register(key, intf, true);
        for (const [key, intf] of Object.entries(nodeState.outputs || {})) register(key, intf, false);
    }

    for (const connection of state.connections || []) {
        let from = byInterfaceId.get(connection.from);
        let to = byInterfaceId.get(connection.to);
        if (!from || !to) {
            warn(`Connection ${connection.id} references an unknown interface, skipping it.`);
            continue;
        }

        // Baklava lets the user drag from an input onto an output and flips the
        // connection itself; a state loaded from JSON bypasses that check entirely.
        if (from.isInput && !to.isInput) [from, to] = [to, from];
        if (from.isInput || !to.isInput) {
            warn(`Connection ${connection.id} does not run from an output to an input, skipping it.`);
            continue;
        }

        const source = byNodeId.get(from.baklavaNodeId);
        const target = byNodeId.get(to.baklavaNodeId);
        if (!source || !target) {
            warn(`Connection ${connection.id} points to a skipped node, skipping it.`);
            continue;
        }

        const outPlug = source.node.outputs[from.key];
        const inPlug = target.node.inputs[to.key];
        if (!outPlug || !inPlug) {
            warn(`Connection ${connection.id} uses a plug that no flowpipe node declares, skipping it.`);
            continue;
        }

        // Flowpipe accepts a single source per input. Baklava only enforces that
        // rule through an engine, and this editor runs without one, so a second
        // source really can end up in the state.
        if (Object.keys(inPlug.connections).length > 0)
            warn(`Input "${target.node.name}.${inPlug.name}" has more than one source, keeping the last one.`);
        inPlug.connections = { [source.identifier]: outPlug.name };

        // The deserializer only reads the input side, the output side is written for consistency
        const targets = (outPlug.connections[target.identifier] ||= []);
        if (!targets.includes(inPlug.name)) targets.push(inPlug.name);
    }

    checkForCycles(nodes, warn);

    return {
        // `||` instead of `??`: an empty name would end up as a file called ".json".
        module: identity?.module || "flowpipe.graph",
        cls: identity?.cls || "Graph",
        name: identity?.name || "graph",
        nodes,
        // Baklava subgraphs are skipped above, so there is never anything to put here.
        subgraphs: [],
    };
}