import type { Edge } from "@xyflow/react";
import type { KNode } from "../types/kanvas";
import { normalizeConnector } from "./connectors";

export function restoreSavedEdges(
  savedEdges: Edge[],
  nodes: KNode[]
): Edge[] {
  const validNodeIds = new Set(nodes.map((node) => node.id));

  return savedEdges
    .filter(
      (edge) =>
        validNodeIds.has(edge.source) &&
        validNodeIds.has(edge.target)
    )
    .map((edge) => normalizeConnector(edge));
}