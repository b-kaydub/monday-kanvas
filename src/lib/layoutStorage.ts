import type { Edge } from "@xyflow/react";

import type {
  CardData,
  FrameData,
  KNode,
  NoteData,
  SavedLayout,
  ShapeData,
} from "../types/kanvas";

import { normalizeConnector } from "./connectors";
import { getNodeHeight, getNodeWidth } from "./nodeSizing";

function getLayoutStorageKey(boardId: string) {
  return `kanvas-layout-${boardId}`;
}

function emptyLayout(): SavedLayout {
  return {
    positions: {},
    edges: [],
    manualNodes: [],
    frameNodes: [],
    shapeNodes: [],
    noteNodes: [],
  };
}

export function readSavedLayout(boardId: string): SavedLayout {
  try {
    const raw = localStorage.getItem(getLayoutStorageKey(boardId));

    if (!raw) {
      return emptyLayout();
    }

    const parsed = JSON.parse(raw) as Partial<SavedLayout>;

    return {
      positions: parsed.positions ?? {},
      edges: parsed.edges ?? [],
      manualNodes: parsed.manualNodes ?? [],
      frameNodes: parsed.frameNodes ?? [],
      shapeNodes: parsed.shapeNodes ?? [],
      noteNodes: parsed.noteNodes ?? [],
    };
  } catch (error) {
    console.error("Failed to read Kanvas layout:", error);
    return emptyLayout();
  }
}

export function saveLayout(
  boardId: string,
  nodes: KNode[],
  edges: Edge[]
) {
  try {
    const positions: SavedLayout["positions"] = {};

    nodes.forEach((node) => {
      positions[node.id] = {
        x: node.position.x,
        y: node.position.y,
      };
    });

    const manualNodes = nodes
      .filter(
        (node) =>
          node.data.nodeKind === "card" &&
          node.data.source === "manual"
      )
      .map((node) => ({
        id: node.id,
        position: node.position,
        data: node.data as CardData,
      }));

    const frameNodes = nodes
      .filter((node) => node.data.nodeKind === "frame")
      .map((node) => ({
        id: node.id,
        position: node.position,
        width: getNodeWidth(node),
        height: getNodeHeight(node),
        data: node.data as FrameData,
      }));

    const shapeNodes = nodes
      .filter((node) => node.data.nodeKind === "shape")
      .map((node) => ({
        id: node.id,
        position: node.position,
        width: getNodeWidth(node),
        height: getNodeHeight(node),
        data: node.data as ShapeData,
      }));

    const noteNodes = nodes
      .filter((node) => node.data.nodeKind === "note")
      .map((node) => ({
        id: node.id,
        position: node.position,
        width: getNodeWidth(node),
        height: getNodeHeight(node),
        data: node.data as NoteData,
      }));

    const layout: SavedLayout = {
      positions,
      edges: edges.map((edge) =>
        normalizeConnector(edge)
      ),
      manualNodes,
      frameNodes,
      shapeNodes,
      noteNodes,
    };

    localStorage.setItem(
      getLayoutStorageKey(boardId),
      JSON.stringify(layout)
    );
  } catch (error) {
    console.error("Failed to save Kanvas layout:", error);
  }
}

export function clearSavedLayout(boardId: string) {
  localStorage.removeItem(
    getLayoutStorageKey(boardId)
  );
}