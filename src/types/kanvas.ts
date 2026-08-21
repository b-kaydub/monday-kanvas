import type { Edge, Node } from "@xyflow/react";

export type ShapeType =
  | "rectangle"
  | "circle"
  | "triangle"
  | "hexagon"
  | "arrow"
  | "line";

export type ConnectorStyle = "straight" | "step" | "smoothstep";

export type CardData = Record<string, unknown> & {
  nodeKind: "card";
  title: string;
  subtitle: string;
  status: string;
  owner: string;
  color: string;
  source: "monday" | "manual";
  itemId?: string;
  notes?: string;
  mondayColumnValues?: Record<
    string,
    {
      id: string;
      text: string | null;
      type: string;
    }
  >;

  draftMondayValues?: Record<string, string>;
};


export type FrameData = Record<string, unknown> & {
  nodeKind: "frame";
  title: string;
  description: string;
  color: string;
};

export type ShapeData = Record<string, unknown> & {
  nodeKind: "shape";
  shapeType: ShapeType;
  label: string;
  text: string;
  fillColor: string;
  borderColor: string;
  rotation: number;
  lineThickness?: number;
};

export type NoteData = Record<string, unknown> & {
  nodeKind: "note";
  title: string;
  text: string;
  color: string;
  fontSize: number;
};

export type NodeData = CardData | FrameData | ShapeData | NoteData;

export type KNode = Node<NodeData>;

export type MondayContext = {
  boardId?: string | number;
};

export type MondayColumnValue = {
  id: string;
  text: string | null;
  type: string;
};

export type MondayItem = {
  id: string;
  name: string;
  group?: {
    id: string;
    title: string;
  };
  column_values: MondayColumnValue[];
};

export type MondayBoardResponse = {
  boards?: Array<{
    id: string;
    name: string;
    items_page?: {
      items: MondayItem[];
    };
  }>;
};

export type ConnectorData = {
  connectorStyle: ConnectorStyle;
  label: string;
  color: string;
  strokeWidth: number;
  dashed: boolean;
  arrowhead: boolean;
  animated: boolean;
};

export type SavedLayout = {
  positions: Record<string, { x: number; y: number }>;
  edges: Edge[];
  manualNodes: Array<{
    id: string;
    position: { x: number; y: number };
    data: CardData;
  }>;
  frameNodes: Array<{
    id: string;
    position: { x: number; y: number };
    width: number;
    height: number;
    data: FrameData;
  }>;
  shapeNodes: Array<{
    id: string;
    position: { x: number; y: number };
    width: number;
    height: number;
    data: ShapeData;
  }>;
  noteNodes: Array<{
    id: string;
    position: { x: number; y: number };
    width: number;
    height: number;
    data: NoteData;
  }>;
};

export type MondayBoardColumn = {
  id: string;
  title: string;
  type: string;
  settings?: unknown;
};
``