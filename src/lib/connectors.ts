import type { Edge } from "@xyflow/react";
import type { ConnectorData } from "../types/kanvas";

export function getDefaultConnectorData(): ConnectorData {
  return {
    connectorStyle: "straight",
    label: "",
    color: "#0073ea",
    strokeWidth: 2,
    dashed: false,
    arrowhead: true,
    animated: false,
  };
}

export function getConnectorData(edge: Edge): ConnectorData {
  return {
    ...getDefaultConnectorData(),
    ...(edge.data as Partial<ConnectorData> | undefined),
  };
}

export function applyConnectorVisuals(
  edge: Edge,
  connectorData: ConnectorData
): Edge {
  return {
    ...edge,
    type: connectorData.connectorStyle,
    label: connectorData.label || undefined,
    animated: connectorData.animated,
    data: connectorData,
    style: {
      stroke: connectorData.color,
      strokeWidth: connectorData.strokeWidth,
      strokeDasharray: connectorData.dashed ? "8 6" : undefined,
    },
    markerEnd: connectorData.arrowhead
      ? ({
          type: "arrowclosed",
          color: connectorData.color,
        } as Edge["markerEnd"])
      : undefined,
  };
}

export function normalizeConnector(edge: Edge): Edge {
  return applyConnectorVisuals(edge, getConnectorData(edge));
}