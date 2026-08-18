import type { KNode } from "../types/kanvas";

export function getNodeWidth(node: KNode) {
  const nodeWithDimensions = node as KNode & {
    width?: number;
    measured?: {
      width?: number;
    };
  };

  if (typeof nodeWithDimensions.width === "number") {
    return nodeWithDimensions.width;
  }

  if (typeof nodeWithDimensions.measured?.width === "number") {
    return nodeWithDimensions.measured.width;
  }

  const width = node.style?.width;

  if (typeof width === "number") {
    return width;
  }

  if (typeof width === "string") {
    const parsed = Number(width.replace("px", ""));
    return Number.isFinite(parsed) ? parsed : 560;
  }

  return 560;
}

export function getNodeHeight(node: KNode) {
  const nodeWithDimensions = node as KNode & {
    height?: number;
    measured?: {
      height?: number;
    };
  };

  if (typeof nodeWithDimensions.height === "number") {
    return nodeWithDimensions.height;
  }

  if (typeof nodeWithDimensions.measured?.height === "number") {
    return nodeWithDimensions.measured.height;
  }

  const height = node.style?.height;

  if (typeof height === "number") {
    return height;
  }

  if (typeof height === "string") {
    const parsed = Number(height.replace("px", ""));
    return Number.isFinite(parsed) ? parsed : 340;
  }

  return 340;
}