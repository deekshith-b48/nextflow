// src/lib/dag.ts
import { FlowNode, FlowEdge, NodeData } from "@/types";

/**
 * Topological sort of nodes using Kahn's algorithm.
 * Returns nodes in execution order, grouped by execution level
 * so independent nodes at the same level can run in parallel.
 */
export function getExecutionLevels(
  nodes: FlowNode[],
  edges: FlowEdge[],
  targetNodeIds?: string[]
): FlowNode[][] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Filter to only nodes in our target set (and their ancestors)
  const relevantNodeIds = targetNodeIds
    ? getAncestorsAndSelf(targetNodeIds, edges, nodeMap)
    : new Set(nodes.map((n) => n.id));

  const relevantNodes = nodes.filter((n) => relevantNodeIds.has(n.id));
  const relevantEdges = edges.filter(
    (e) => relevantNodeIds.has(e.source) && relevantNodeIds.has(e.target)
  );

  // In-degree map
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // nodeId -> list of nodes that depend on it

  for (const node of relevantNodes) {
    inDegree.set(node.id, 0);
    dependents.set(node.id, []);
  }

  for (const edge of relevantEdges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    dependents.get(edge.source)?.push(edge.target);
  }

  const levels: FlowNode[][] = [];
  let currentLevel = relevantNodes.filter((n) => inDegree.get(n.id) === 0);

  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    const nextLevel: FlowNode[] = [];

    for (const node of currentLevel) {
      for (const dep of dependents.get(node.id) ?? []) {
        const newDegree = (inDegree.get(dep) ?? 1) - 1;
        inDegree.set(dep, newDegree);
        if (newDegree === 0) {
          const depNode = nodeMap.get(dep);
          if (depNode) nextLevel.push(depNode);
        }
      }
    }

    currentLevel = nextLevel;
  }

  return levels;
}

/**
 * Get all ancestors of the target nodes (including themselves).
 */
function getAncestorsAndSelf(
  targetIds: string[],
  edges: FlowEdge[],
  nodeMap: Map<string, FlowNode>
): Set<string> {
  const result = new Set<string>(targetIds);
  const queue = [...targetIds];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    for (const edge of edges) {
      if (edge.target === nodeId && !result.has(edge.source)) {
        result.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return result;
}

/**
 * Detect cycles in a graph. Returns true if there is a cycle.
 */
export function hasCycle(nodes: FlowNode[], edges: FlowEdge[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

/**
 * Resolve the input value for a node's handle.
 * If the handle has a connected edge, returns the output from the source node.
 * Otherwise returns the node's manually configured value.
 */
export function resolveHandleValue(
  nodeId: string,
  handleId: string,
  edges: FlowEdge[],
  nodeOutputs: Map<string, Record<string, unknown>>
): unknown {
  const incomingEdge = edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId
  );

  if (incomingEdge) {
    const sourceOutputs = nodeOutputs.get(incomingEdge.source);
    const outputHandle = incomingEdge.sourceHandle ?? "output";
    return sourceOutputs?.[outputHandle];
  }

  return undefined;
}

/**
 * Get all image values from multiple connections to the `images` handle.
 */
export function resolveMultipleImageInputs(
  nodeId: string,
  edges: FlowEdge[],
  nodeOutputs: Map<string, Record<string, unknown>>
): string[] {
  const imageEdges = edges.filter(
    (e) => e.target === nodeId && e.targetHandle === "images"
  );

  return imageEdges
    .map((edge) => {
      const sourceOutputs = nodeOutputs.get(edge.source);
      const outputHandle = edge.sourceHandle ?? "output";
      return sourceOutputs?.[outputHandle] as string | undefined;
    })
    .filter((url): url is string => typeof url === "string" && url.length > 0);
}
