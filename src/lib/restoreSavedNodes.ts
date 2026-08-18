import type { KNode, SavedLayout } from "../types/kanvas";

export function restoreSavedNodes(
  savedLayout: SavedLayout
): {
  manualNodes: KNode[];
  frameNodes: KNode[];
  shapeNodes: KNode[];
  noteNodes: KNode[];
} {
  const manualNodes: KNode[] = savedLayout.manualNodes.map((node) => ({
    id: node.id,
    type: "kanvasCard",
    position: node.position,
    data: {
      ...node.data,
      nodeKind: "card",
      source: "manual",
    },
  }));

  const frameNodes: KNode[] = savedLayout.frameNodes.map((node) => ({
    id: node.id,
    type: "kanvasFrame",
    position: node.position,
    style: {
      width: node.width,
      height: node.height,
      zIndex: -1,
    },
    data: {
      ...node.data,
      nodeKind: "frame",
    },
  }));

  const shapeNodes: KNode[] = savedLayout.shapeNodes.map((node) => ({
    id: node.id,
    type: "kanvasShape",
    position: node.position,
    style: {
      width: node.width,
      height: node.height,
    },
    data: {
      ...node.data,
      nodeKind: "shape",
      text: node.data.text ?? "",
    },
  }));

  const noteNodes: KNode[] = savedLayout.noteNodes.map((node) => ({
    id: node.id,
    type: "kanvasNote",
    position: node.position,
    style: {
      width: node.width,
      height: node.height,
    },
    data: {
      ...node.data,
      nodeKind: "note",
    },
  }));

  return {
    manualNodes,
    frameNodes,
    shapeNodes,
    noteNodes,
  };
}