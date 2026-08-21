import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import mondaySdk from "monday-sdk-js";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

import type {
  ConnectorData,
  KNode,
  MondayBoardColumn,
  MondayBoardResponse,
  MondayContext,
  NodeData,
  ShapeType,
} from "./types/kanvas";

import {
  applyConnectorVisuals,
  getConnectorData,
  getDefaultConnectorData,
} from "./lib/connectors";

import {
  clearSavedLayout,
  readSavedLayout,
  saveLayout,
} from "./lib/layoutStorage";

import { getNodeHeight, getNodeWidth } from "./lib/nodeSizing";
import { getDefaultShapeSize, getShapeLabel } from "./lib/shapes";

import { nodeTypes } from "./components/nodes/nodeTypes";
import { ConnectorDetailsPanel } from "./components/details/ConnectorDetailsPanel";
import { NodeDetailsPanel } from "./components/details/NodeDetailsPanel";
import { KanvasToolbar } from "./components/toolbar/KanvasToolbar";
import { GET_BOARD_ITEMS_QUERY } from "./lib/mondayQueries";
import { mondayItemsToNodes } from "./lib/mondayItemsToNodes";
import { restoreSavedNodes } from "./lib/restoreSavedNodes";

import {
  useMondayBoard,
  isValidBoardId,
} from "./hooks/useMondayBoard";

import { restoreSavedEdges } from "./lib/restoreSavedEdges";
import { useMondayBoardLoader } from "./hooks/useMondayBoardLoader";
import { createMondayItem } from "./lib/createMondayItem";
import { getBoardColumns } from "./lib/getBoardColumns";

const monday = mondaySdk();

const fallbackNodes: KNode[] = [
  {
    id: "sample-1",
    type: "kanvasCard",
    position: { x: 100, y: 100 },
    data: {
      nodeKind: "card",
      title: "Sample Card",
      subtitle: "Connect to a Monday board to load real items",
      status: "Sample",
      owner: "Kanvas",
      color: "#0073ea",
      source: "manual",
      notes: "",
    },
  },
];

function App() {
  const {
    boardId,
    setBoardId,

    boardName,
    setBoardName,

    contextStatus,
    setContextStatus,

    hasLoadedBoardItems,
    setHasLoadedBoardItems,
  } = useMondayBoard();

  const { wrapLoader } = useMondayBoardLoader();

  const [selectedNode, setSelectedNode] = useState<KNode | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [flowInstance, setFlowInstance] = useState<any>(null);
  const [isCreatingMondayItem, setIsCreatingMondayItem] = useState(false);
  const [isSavingMondayChanges, setIsSavingMondayChanges] = useState(false);
  const [boardColumns, setBoardColumns] = useState<MondayBoardColumn[]>([]);
  const [copiedNodes, setCopiedNodes] = useState<KNode[]>([]);

  const [isDrawingLine, setIsDrawingLine] = useState(false);

  const lineDrawStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const draftLineIdRef = useRef<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<KNode>(fallbackNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const filteredNodes = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) return nodes;

    return nodes.filter((node) => {
      const data = node.data;

      if (data.nodeKind === "frame") {
        return `${data.title} ${data.description}`
          .toLowerCase()
          .includes(search);
      }

      if (data.nodeKind === "shape") {
        return `${data.shapeType} ${data.label} ${data.text}`
          .toLowerCase()
          .includes(search);
      }

      if (data.nodeKind === "note") {
        return `${data.title} ${data.text}`.toLowerCase().includes(search);
      }

      return `${data.title} ${data.subtitle} ${data.status} ${data.owner} ${
        data.notes || ""
      } ${data.itemId || ""} ${data.source}`
        .toLowerCase()
        .includes(search);
    });
  }, [nodes, searchText]);

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes]
  );

  const filteredEdges = useMemo(() => {
    if (!searchText.trim()) return edges;

    return edges.filter(
      (edge) =>
        filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );
  }, [edges, filteredNodeIds, searchText]);

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) return null;
    return edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  }, [edges, selectedEdgeId]);

  const selectedEdgeData = useMemo(() => {
    if (!selectedEdge) return null;
    return getConnectorData(selectedEdge);
  }, [selectedEdge]);

  const loadMondayItems = useCallback(
    async (currentBoardId: string) => {
      setContextStatus("Loading Monday board items...");
      setHasLoadedBoardItems(false);
      setSelectedNode(null);
      setSelectedEdgeId(null);

      const savedLayout = readSavedLayout(currentBoardId);

      const query = GET_BOARD_ITEMS_QUERY;

      try {
        const response = (await monday.api(query, {
          variables: { boardId: [currentBoardId] },
        })) as { data?: MondayBoardResponse; errors?: unknown[] };

        if (response.errors) {
          console.error("Monday API errors:", response.errors);
          setContextStatus("Monday API returned an error. Check Console.");
          return;
        }

        const board = response.data?.boards?.[0];

        if (!board) {
          setContextStatus("No board data returned.");
          setNodes(fallbackNodes);
          setEdges([]);
          return;
        }

        setBoardName(board.name);

        let columns: MondayBoardColumn[] = [];

        try {
          columns = await getBoardColumns({
            monday,
            boardId: currentBoardId,
          });

          setBoardColumns(columns);
          console.log("Loaded Monday board columns:", columns);
        } catch (columnError) {
          console.error("Failed to load Monday board columns:", columnError);
          setBoardColumns([]);
        }

        const items = board.items_page?.items ?? [];

        const itemNodes = mondayItemsToNodes(items, savedLayout);

        const {
          manualNodes,
          frameNodes,
          shapeNodes,
          noteNodes,
        } = restoreSavedNodes(savedLayout);

        const combinedNodes = [
          ...frameNodes,
          ...itemNodes,
          ...manualNodes,
          ...shapeNodes,
          ...noteNodes,
        ];

        const restoredEdges = restoreSavedEdges(savedLayout.edges, combinedNodes);

        setNodes(combinedNodes);
        setEdges(restoredEdges);
        setHasLoadedBoardItems(true);

        setContextStatus(
          items.length === 0
            ? `Connected to ${board.name}, but no Monday items were found. Loaded ${columns.length} columns.`
            : `Loaded ${items.length} items and ${columns.length} columns from ${board.name}`
        );
      } catch (error) {
        console.error("Failed to load Monday items:", error);
        setContextStatus("Failed to load Monday items. Check Console.");
        setNodes(fallbackNodes);
        setEdges([]);
      }
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    async function loadContext() {
      try {
        const response = (await monday.get("context")) as {
          data: MondayContext;
        };

        const currentBoardId = response.data.boardId;

        if (currentBoardId) {
          const boardIdAsString = String(currentBoardId);

          setBoardId(boardIdAsString);
          setContextStatus("Connected to Monday board");

          await loadMondayItems(boardIdAsString);
        } else {
          setBoardId("No board context");
          setContextStatus("Running outside a Monday board context");
          setBoardColumns([]);
          setNodes(fallbackNodes);
          setEdges([]);
        }
      } catch (error) {
        console.error("Failed to load Monday context:", error);
        setBoardId("Context error");
        setContextStatus("Unable to read Monday context");
        setBoardColumns([]);
        setNodes(fallbackNodes);
        setEdges([]);
      }
    }

    loadContext();
  }, [loadMondayItems, setNodes, setEdges]);

  useEffect(() => {
    if (hasLoadedBoardItems && isValidBoardId(boardId)) {
      saveLayout(boardId, nodes, edges);
    }
  }, [nodes, edges, boardId, hasLoadedBoardItems]);

  useEffect(() => {
    if (!selectedNode) return;

    const selectedNodeStillExists = nodes.some(
      (node) => node.id === selectedNode.id
    );

    if (!selectedNodeStillExists) {
      setSelectedNode(null);
    }
  }, [nodes, selectedNode]);

  useEffect(() => {
    if (!selectedEdgeId) return;

    const edgeExists = edges.some((edge) => edge.id === selectedEdgeId);

    if (!edgeExists) {
      setSelectedEdgeId(null);
    }
  }, [edges, selectedEdgeId]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const connectorData = getDefaultConnectorData();

      const newEdge = applyConnectorVisuals(
        {
          ...connection,
          id: `edge-${Date.now()}`,
        } as Edge,
        connectorData
      );

      setEdges((currentEdges) => addEdge(newEdge, currentEdges));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: KNode) => {
      setSelectedNode(node);
      setSelectedEdgeId(null);
    },
    []
  );

  const onEdgeClick = useCallback((_event: MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNode(null);
  }, []);

  const updateSelectedConnector = (updates: Partial<ConnectorData>) => {
    if (!selectedEdgeId) return;

    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        if (edge.id !== selectedEdgeId) return edge;

        return applyConnectorVisuals(edge, {
          ...getConnectorData(edge),
          ...updates,
        });
      })
    );
  };

  const deleteSelectedConnector = () => {
    if (!selectedEdgeId) return;

    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.id !== selectedEdgeId)
    );

    setSelectedEdgeId(null);
  };

  const addCard = () => {
    const nextNumber = nodes.length + 1;

    const newNode: KNode = {
      id: `manual-${Date.now()}`,
      type: "kanvasCard",
      position: { x: 180 + nextNumber * 40, y: 260 + nextNumber * 20 },
      data: {
        nodeKind: "card",
        title: `New Kanvas Card ${nextNumber}`,
        subtitle: "Manual card not linked to Monday",
        status: "Draft",
        owner: "Unassigned",
        color: "#ffcb00",
        source: "manual",
        notes: "",
        draftMondayValues: {},
      },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
    setSelectedNode(newNode);
    setSelectedEdgeId(null);
  };

  const addFrame = () => {
    const frameNumber =
      nodes.filter((node) => node.data.nodeKind === "frame").length + 1;

    const newFrame: KNode = {
      id: `frame-${Date.now()}`,
      type: "kanvasFrame",
      position: { x: 80 + frameNumber * 40, y: 80 + frameNumber * 40 },
      style: { width: 560, height: 340, zIndex: -1 },
      data: {
        nodeKind: "frame",
        title: `Frame ${frameNumber}`,
        description: "Visual grouping area",
        color: "#0073ea",
      },
    };

    setNodes((currentNodes) => [newFrame, ...currentNodes]);
    setSelectedNode(newFrame);
    setSelectedEdgeId(null);
  };

  const addNote = () => {
    const noteNumber =
      nodes.filter((node) => node.data.nodeKind === "note").length + 1;

    const newNote: KNode = {
      id: `note-${Date.now()}`,
      type: "kanvasNote",
      position: { x: 260 + noteNumber * 40, y: 220 + noteNumber * 30 },
      style: { width: 260, height: 200 },
      data: {
        nodeKind: "note",
        title: `Note ${noteNumber}`,
        text: "Enter note text here...",
        color: "#fff4c2",
        fontSize: 16,
      },
    };

    setNodes((currentNodes) => [...currentNodes, newNote]);
    setSelectedNode(newNote);
    setSelectedEdgeId(null);
  };

const addShape = (shapeType: ShapeType) => {
  if (shapeType === "line") {
    setIsDrawingLine(true);
    lineDrawStartRef.current = null;
    draftLineIdRef.current = null;
    setSelectedNode(null);
    setSelectedEdgeId(null);
    setContextStatus(
      "Line tool active. Drag on the canvas to draw a horizontal or vertical line."
    );
    return;
  }

  const shapeNumber =
    nodes.filter(
      (node) => node.data.nodeKind === "shape"
    ).length + 1;

  const size = getDefaultShapeSize(shapeType);

  const newShape: KNode = {
    id: `shape-${Date.now()}`,
    type: "kanvasShape",
    position: {
      x: 220 + shapeNumber * 40,
      y: 180 + shapeNumber * 30,
    },
    style: {
      width: size.width,
      height: size.height,
    },
    data: {
      nodeKind: "shape",
      shapeType,
      label: getShapeLabel(shapeType),
      text: "",
      fillColor: "#dff0ff",
      borderColor: "#0073ea",
      rotation: 0,
      lineThickness: 4,
    },
  };

  setNodes((currentNodes) => [
    ...currentNodes,
    newShape,
  ]);

  setSelectedNode(newShape);
  setSelectedEdgeId(null);
};

  const addMindMapRoot = () => {
    const rootCount =
      nodes.filter(
        (node) =>
          node.data.nodeKind === "note" &&
          String(node.id).startsWith("mind-root-")
      ).length + 1;

    const rootNode: KNode = {
      id: `mind-root-${Date.now()}`,
      type: "kanvasNote",
      position: { x: 160 + rootCount * 40, y: 160 + rootCount * 40 },
      style: { width: 280, height: 190 },
      data: {
        nodeKind: "note",
        title: `Mind Map ${rootCount}`,
        text: "Main idea",
        color: "#fff4c2",
        fontSize: 16,
      },
    };

    setNodes((currentNodes) => [...currentNodes, rootNode]);
    setSelectedNode(rootNode);
    setSelectedEdgeId(null);
  };

  const addMindMapChild = () => {
    if (!selectedNode) return;

    const childCount = edges.filter(
      (edge) => edge.source === selectedNode.id
    ).length;

    const childNode: KNode = {
      id: `mind-child-${Date.now()}`,
      type: "kanvasNote",
      position: {
        x: selectedNode.position.x + getNodeWidth(selectedNode) + 180,
        y: selectedNode.position.y + childCount * 150,
      },
      style: { width: 260, height: 180 },
      data: {
        nodeKind: "note",
        title: "Child Idea",
        text: "Add child idea details...",
        color: "#e8f4ff",
        fontSize: 16,
      },
    };

    const edge = applyConnectorVisuals(
      {
        id: `edge-${selectedNode.id}-${childNode.id}-${Date.now()}`,
        source: selectedNode.id,
        target: childNode.id,
      } as Edge,
      {
        ...getDefaultConnectorData(),
        connectorStyle: "smoothstep",
        label: "Child",
      }
    );

    setNodes((currentNodes) => [...currentNodes, childNode]);
    setEdges((currentEdges) => addEdge(edge, currentEdges));
    setSelectedNode(childNode);
    setSelectedEdgeId(null);
  };

  const addMindMapSibling = () => {
    if (!selectedNode) return;

    const parentEdge = edges.find((edge) => edge.target === selectedNode.id);
    const parentNode = parentEdge
      ? nodes.find((node) => node.id === parentEdge.source)
      : null;

    const siblingCount = parentEdge
      ? edges.filter((edge) => edge.source === parentEdge.source).length
      : 0;

    const siblingNode: KNode = {
      id: `mind-sibling-${Date.now()}`,
      type: "kanvasNote",
      position: {
        x: selectedNode.position.x,
        y: selectedNode.position.y + 150,
      },
      style: { width: 260, height: 180 },
      data: {
        nodeKind: "note",
        title: "Sibling Idea",
        text: "Add sibling idea details...",
        color: "#f0f7ff",
        fontSize: 16,
      },
    };

    setNodes((currentNodes) => [...currentNodes, siblingNode]);

    if (parentNode && parentEdge) {
      const edge = applyConnectorVisuals(
        {
          id: `edge-${parentNode.id}-${siblingNode.id}-${Date.now()}`,
          source: parentNode.id,
          target: siblingNode.id,
        } as Edge,
        {
          ...getDefaultConnectorData(),
          connectorStyle: "smoothstep",
          label: "Sibling",
        }
      );

      setEdges((currentEdges) => addEdge(edge, currentEdges));

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== siblingNode.id) return node;

          return {
            ...node,
            position: {
              x: selectedNode.position.x,
              y: parentNode.position.y + 150 * (siblingCount + 1),
            },
          };
        })
      );
    }

    setSelectedNode(siblingNode);
    setSelectedEdgeId(null);
  };

  const autoLayoutMindMap = () => {
    if (!selectedNode) return;

    const incomingByTarget = new Map<string, Edge>();
    const childrenBySource = new Map<string, Edge[]>();

    edges.forEach((edge) => {
      incomingByTarget.set(edge.target, edge);

      const existingChildren = childrenBySource.get(edge.source) ?? [];
      childrenBySource.set(edge.source, [...existingChildren, edge]);
    });

    let rootNode = selectedNode;
    const visitedAncestors = new Set<string>();

    while (
      incomingByTarget.has(rootNode.id) &&
      !visitedAncestors.has(rootNode.id)
    ) {
      visitedAncestors.add(rootNode.id);

      const parentEdge = incomingByTarget.get(rootNode.id);
      const parentNode = parentEdge
        ? nodes.find((node) => node.id === parentEdge.source)
        : null;

      if (!parentNode) {
        break;
      }

      rootNode = parentNode;
    }

    const horizontalGap = 360;
    const verticalGap = 170;
    const rootX = rootNode.position.x;
    const rootY = rootNode.position.y;

    const nextPositions = new Map<string, { x: number; y: number }>();
    const levelCounts = new Map<number, number>();

    const queue: Array<{ node: KNode; depth: number }> = [
      { node: rootNode, depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      if (!current) {
        continue;
      }

      const currentLevelCount = levelCounts.get(current.depth) ?? 0;
      levelCounts.set(current.depth, currentLevelCount + 1);

      nextPositions.set(current.node.id, {
        x: rootX + current.depth * horizontalGap,
        y: rootY + currentLevelCount * verticalGap,
      });

      const childEdges = childrenBySource.get(current.node.id) ?? [];

      childEdges.forEach((childEdge) => {
        const childNode = nodes.find((node) => node.id === childEdge.target);

        if (!childNode || nextPositions.has(childNode.id)) {
          return;
        }

        queue.push({
          node: childNode,
          depth: current.depth + 1,
        });
      });
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const nextPosition = nextPositions.get(node.id);

        if (!nextPosition) {
          return node;
        }

        return {
          ...node,
          position: nextPosition,
        };
      })
    );
  };

const startDrawingLine = (
  event: ReactPointerEvent<HTMLDivElement>
) => {
  if (!isDrawingLine || !flowInstance) {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const startPoint =
    flowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

  const lineId = `shape-line-${Date.now()}`;

  lineDrawStartRef.current = startPoint;
  draftLineIdRef.current = lineId;

  event.currentTarget.setPointerCapture(
    event.pointerId
  );

  const newLine: KNode = {
    id: lineId,
    type: "kanvasShape",
    position: {
      x: startPoint.x,
      y: startPoint.y - 10,
    },
    style: {
      width: 20,
      height: 20,
    },
    selected: true,
    data: {
      nodeKind: "shape",
      shapeType: "line",
      label: "Line",
      text: "",
      fillColor: "transparent",
      borderColor: "#0073ea",
      rotation: 0,
    },
  };

  setNodes((currentNodes) => [
    ...currentNodes.map((node) => ({
      ...node,
      selected: false,
    })),
    newLine,
  ]);

  setSelectedNode(newLine);
  setSelectedEdgeId(null);
};

const continueDrawingLine = (
  event: ReactPointerEvent<HTMLDivElement>
) => {
  if (
    !isDrawingLine ||
    !flowInstance ||
    !lineDrawStartRef.current ||
    !draftLineIdRef.current
  ) {
    return;
  }

  event.preventDefault();

  const currentPoint =
    flowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

  const startPoint = lineDrawStartRef.current;
  const lineId = draftLineIdRef.current;

  const horizontalDistance = Math.abs(
    currentPoint.x - startPoint.x
  );

  const verticalDistance = Math.abs(
    currentPoint.y - startPoint.y
  );

  const isHorizontal =
    horizontalDistance >= verticalDistance;

  const nextPosition = isHorizontal
    ? {
        x: Math.min(
          startPoint.x,
          currentPoint.x
        ),
        y: startPoint.y - 10,
      }
    : {
        x: startPoint.x - 10,
        y: Math.min(
          startPoint.y,
          currentPoint.y
        ),
      };

  const nextWidth = isHorizontal
    ? Math.max(horizontalDistance, 20)
    : 20;

  const nextHeight = isHorizontal
    ? 20
    : Math.max(verticalDistance, 20);

  const nextRotation = isHorizontal ? 0 : 90;

  setNodes((currentNodes) =>
    currentNodes.map((node) => {
      if (node.id !== lineId) {
        return node;
      }

      return {
        ...node,
        position: nextPosition,
        style: {
          ...node.style,
          width: nextWidth,
          height: nextHeight,
        },
        data: {
          ...node.data,
          rotation: nextRotation,
        },
      } as KNode;
    })
  );

  setSelectedNode(
    (currentSelectedNode) => {
      if (
        !currentSelectedNode ||
        currentSelectedNode.id !== lineId
      ) {
        return currentSelectedNode;
      }

      return {
        ...currentSelectedNode,
        position: nextPosition,
        style: {
          ...currentSelectedNode.style,
          width: nextWidth,
          height: nextHeight,
        },
        data: {
          ...currentSelectedNode.data,
          rotation: nextRotation,
        },
      } as KNode;
    }
  );
};

const finishDrawingLine = (
  event: ReactPointerEvent<HTMLDivElement>
) => {
  if (
    !isDrawingLine ||
    !draftLineIdRef.current
  ) {
    return;
  }

  event.preventDefault();

  if (
    event.currentTarget.hasPointerCapture(
      event.pointerId
    )
  ) {
    event.currentTarget.releasePointerCapture(
      event.pointerId
    );
  }

  lineDrawStartRef.current = null;
  draftLineIdRef.current = null;
  setIsDrawingLine(false);

  setContextStatus(
    "Line created. Select the line and drag a resize handle to change its length."
  );
};


  const fitAll = () => {
    if (!flowInstance) {
      return;
    }

    flowInstance.fitView({
      padding: 0.15,
      duration: 300,
    });
  };

  const focusSelected = () => {
    if (!flowInstance || !selectedNode) {
      return;
    }

    flowInstance.setCenter(
      selectedNode.position.x + getNodeWidth(selectedNode) / 2,
      selectedNode.position.y + getNodeHeight(selectedNode) / 2,
      {
        zoom: 1.15,
        duration: 300,
      }
    );
  };

  const updateSelectedNodeData = (updates: Partial<NodeData>) => {
    if (!selectedNode) return;

    const selectedNodeId = selectedNode.id;

    setSelectedNode((currentSelectedNode) => {
      if (
        !currentSelectedNode ||
        currentSelectedNode.id !== selectedNodeId
      ) {
        return currentSelectedNode;
      }

      return {
        ...currentSelectedNode,
        data: {
          ...currentSelectedNode.data,
          ...updates,
        } as NodeData,
      };
    });

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id !== selectedNodeId) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
          } as NodeData,
        };
      })
    );
  };


  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    if (
      selectedNode.data.nodeKind === "card" &&
      selectedNode.data.source === "monday"
    ) {
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== selectedNode.id)
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );

    setSelectedNode(null);
  };

const duplicateSelectedNode = () => {
  const selectedVisualNodes = nodes.filter(
    (node) =>
      node.selected &&
      !(
        node.data.nodeKind === "card" &&
        node.data.source === "monday"
      )
  );

  if (selectedVisualNodes.length === 0) {
    return;
  }

  const duplicatedNodes =
    duplicateNodes(selectedVisualNodes);

  if (duplicatedNodes.length > 0) {
    setSelectedNode(duplicatedNodes[0]);
    setSelectedEdgeId(null);
  }
};


const duplicateNodes = (nodesToCopy: KNode[]) => {
  const timestamp = Date.now();

  const duplicatedNodes = nodesToCopy.map(
    (node, index) => {
      const duplicatedNode: KNode = {
        ...node,

        id: `${node.id}-copy-${timestamp}-${index}`,

        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },

        selected: false,
      };

      if (
        duplicatedNode.data.nodeKind === "card"
      ) {
        duplicatedNode.data = {
          ...duplicatedNode.data,
          title: `${duplicatedNode.data.title} Copy`,
        };
      }

      if (
        duplicatedNode.data.nodeKind === "note"
      ) {
        duplicatedNode.data = {
          ...duplicatedNode.data,
          title: `${duplicatedNode.data.title} Copy`,
        };
      }

      if (
        duplicatedNode.data.nodeKind === "frame"
      ) {
        duplicatedNode.data = {
          ...duplicatedNode.data,
          title: `${duplicatedNode.data.title} Copy`,
        };
      }

      if (
        duplicatedNode.data.nodeKind === "shape"
      ) {
        duplicatedNode.data = {
          ...duplicatedNode.data,
          label: `${duplicatedNode.data.label} Copy`,
        };
      }

      return duplicatedNode;
    }
  );

  setNodes((currentNodes) => [
    ...currentNodes,
    ...duplicatedNodes,
  ]);

  return duplicatedNodes;
};

const copySelectedNodes = () => {
  const selectedVisualNodes = nodes.filter(
    (node) =>
      node.selected &&
      !(
        node.data.nodeKind === "card" &&
        node.data.source === "monday"
      )
  );

  setCopiedNodes(selectedVisualNodes);
};

const pasteCopiedNodes = () => {
  if (copiedNodes.length === 0) {
    return;
  }

  const duplicatedNodes =
    duplicateNodes(copiedNodes);

  if (duplicatedNodes.length > 0) {
    setSelectedNode(duplicatedNodes[0]);
    setSelectedEdgeId(null);
  }
};

useEffect(() => {
  const handleKeyDown = (
    event: KeyboardEvent
  ) => {
    const ctrlOrCmd =
      event.ctrlKey || event.metaKey;

    if (!ctrlOrCmd) {
      return;
    }

    const key = event.key.toLowerCase();

if (key === "c") {
  event.preventDefault();

  copySelectedNodes();
}

if (key === "v") {
  event.preventDefault();

  pasteCopiedNodes();
}
  };

  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleKeyDown
    );
  };
}, [nodes]);

  const openSelectedMondayItem = async () => {
    if (
      !selectedNode ||
      selectedNode.data.nodeKind !== "card" ||
      selectedNode.data.source !== "monday" ||
      !selectedNode.data.itemId
    ) {
      return;
    }

    await monday.execute("openItemCard", {
      itemId: Number(selectedNode.data.itemId),
      kind: "columns",
    });
  };

  const buildMondayColumnValuesFromDraft = (
    draftValues: Record<string, string> | undefined
  ) => {
    const columnValues: Record<string, unknown> = {};

    if (!draftValues) {
      return columnValues;
    }

    boardColumns.forEach((column) => {
      const rawValue = draftValues[column.id]?.trim();

      if (!rawValue) {
        return;
      }

      if (column.id === "name" || column.type === "name") {
        return;
      }

      if (column.type === "text") {
        columnValues[column.id] = rawValue;
        return;
      }

      if (column.type === "long_text") {
        columnValues[column.id] = {
          text: rawValue,
        };
        return;
      }

      if (column.type === "numbers") {
        const numericValue = Number(rawValue);

        if (!Number.isNaN(numericValue)) {
          columnValues[column.id] = numericValue;
        }

        return;
      }

      if (column.type === "date") {
        columnValues[column.id] = rawValue;
        return;
      }

      if (column.type === "status") {
        columnValues[column.id] = {
          label: rawValue,
        };
        return;
      }

      if (column.type === "dropdown") {
        columnValues[column.id] = {
          labels: [rawValue],
        };
      }
    });

    return columnValues;
  };

  const buildLocalMondayColumnValuesFromDraft = (
    draftValues: Record<string, string> | undefined
  ) => {
    const localValues: Record<
      string,
      {
        id: string;
        text: string | null;
        type: string;
      }
    > = {};

    if (!draftValues) {
      return localValues;
    }

    Object.entries(draftValues).forEach(([columnId, value]) => {
      const column = boardColumns.find(
        (currentColumn) => currentColumn.id === columnId
      );

      localValues[columnId] = {
        id: columnId,
        text: value,
        type: column?.type ?? "text",
      };
    });

    return localValues;
  };

  const createSelectedMondayItem = async () => {
    if (isCreatingMondayItem) {
      return;
    }

    if (
      !selectedNode ||
      selectedNode.data.nodeKind !== "card" ||
      selectedNode.data.source !== "manual"
    ) {
      return;
    }

    const cardData = selectedNode.data;
    const itemName = cardData.title.trim();

    if (!itemName) {
      setContextStatus("Enter a card title before creating a Monday item.");
      return;
    }

    if (!isValidBoardId(boardId)) {
      setContextStatus("Cannot create Monday item because board ID is not valid.");
      return;
    }

    try {
      setIsCreatingMondayItem(true);
      setContextStatus("Creating Monday item...");

      const oldNodeId = selectedNode.id;

      const columnValues = buildMondayColumnValuesFromDraft(
        cardData.draftMondayValues
      );

      const localMondayColumnValues = buildLocalMondayColumnValuesFromDraft(
        cardData.draftMondayValues
      );

      const newItemId = await createMondayItem({
        monday,
        boardId,
        itemName,
        columnValues,
      });

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== oldNodeId) {
            return node;
          }

          return {
            ...node,
            id: newItemId,
            data: {
              ...cardData,
              nodeKind: "card",
              source: "monday",
              itemId: newItemId,
              title: itemName,
              subtitle: cardData.subtitle || "Created from Kanvas",
              status: cardData.status || "No status",
              owner: cardData.owner || "Unassigned",
              color: cardData.color || "#0073ea",
              mondayColumnValues: localMondayColumnValues,
              draftMondayValues: {},
            },
          };
        })
      );

      setEdges((currentEdges) =>
        currentEdges.map((edge) => ({
          ...edge,
          source: edge.source === oldNodeId ? newItemId : edge.source,
          target: edge.target === oldNodeId ? newItemId : edge.target,
        }))
      );

      setSelectedNode(null);
      setSelectedEdgeId(null);

      setContextStatus(`Created Monday item ${newItemId}.`);
    } catch (error) {
      console.error("Failed to create Monday item:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unknown error while creating Monday item.";

      setContextStatus(`Failed to create Monday item: ${message}`);
    } finally {
      setIsCreatingMondayItem(false);
    }
  };

  const saveSelectedMondayItem = async () => {
    if (isSavingMondayChanges) {
      return;
    }

    if (
      !selectedNode ||
      selectedNode.data.nodeKind !== "card" ||
      selectedNode.data.source !== "monday" ||
      !selectedNode.data.itemId
    ) {
      return;
    }

    const cardData = selectedNode.data;
    const draftValues = cardData.draftMondayValues ?? {};

    if (Object.keys(draftValues).length === 0) {
      setContextStatus("No Monday changes to save.");
      return;
    }

    if (!isValidBoardId(boardId)) {
      setContextStatus("Cannot save Monday changes because board ID is not valid.");
      return;
    }

    const columnValues = buildMondayColumnValuesFromDraft(draftValues);

    if (Object.keys(columnValues).length === 0) {
      setContextStatus("No supported Monday column changes to save.");
      return;
    }

    try {
      setIsSavingMondayChanges(true);
      setContextStatus("Saving Monday changes...");

      const localMondayColumnValues =
        buildLocalMondayColumnValuesFromDraft(draftValues);

      if (!cardData.itemId) return;

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== selectedNode.id) {
            return node;
          }

          return {
            ...node,
            data: {
              ...cardData,
              mondayColumnValues: {
                ...(cardData.mondayColumnValues ?? {}),
                ...localMondayColumnValues,
              },
              draftMondayValues: {},
            },
          };
        })
      );

      setContextStatus(`Saved Monday changes for item ${cardData.itemId}.`);
    } catch (error) {
      console.error("Failed to save Monday changes:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unknown error while saving Monday changes.";

      setContextStatus(`Failed to save Monday changes: ${message}`);
    } finally {
      setIsSavingMondayChanges(false);
    }
  };

  
  const refreshItems = () => {
    if (!isValidBoardId(boardId)) {
      return;
    }

    wrapLoader(async () => {
      await loadMondayItems(boardId);
    });
  };

  const clearConnectors = () => {
    setEdges([]);
    setSelectedEdgeId(null);
  };

  const resetSavedLayout = () => {
    if (isValidBoardId(boardId)) {
      clearSavedLayout(boardId);
      setSearchText("");
      setSelectedNode(null);
      setSelectedEdgeId(null);
      loadMondayItems(boardId);
    }
  };

  const closeDetailsPanel = () => {
    setSelectedNode(null);
    setSelectedEdgeId(null);
  };

  return (
    <div className="kanvas-app">
      <KanvasToolbar
        contextStatus={contextStatus}
        boardName={boardName}
        boardId={boardId}
        searchText={searchText}
        setSearchText={setSearchText}
        filteredNodeCount={filteredNodes.length}
        totalNodeCount={nodes.length}
        selectedNode={selectedNode}
        refreshItems={refreshItems}
        addCard={addCard}
        addFrame={addFrame}
        addNote={addNote}
        addShape={addShape}
        fitAll={fitAll}
        focusSelected={focusSelected}
        addMindMapRoot={addMindMapRoot}
        addMindMapChild={addMindMapChild}
        addMindMapSibling={addMindMapSibling}
        autoLayoutMindMap={autoLayoutMindMap}
        clearConnectors={clearConnectors}
        resetSavedLayout={resetSavedLayout}
        boardColumnCount={boardColumns.length}
      />

      <div className="kanvas-body">
        <div
          className={
            isDrawingLine
              ? "kanvas-flow-wrapper drawing-line"
              : "kanvas-flow-wrapper"
          }
          onPointerDown={startDrawingLine}
          onPointerMove={continueDrawingLine}
          onPointerUp={finishDrawingLine}
          onPointerCancel={finishDrawingLine}
        >
          <ReactFlow<KNode, Edge>
            nodes={filteredNodes}
            edges={filteredEdges}
            nodeTypes={nodeTypes}
            onInit={(instance) =>
              setFlowInstance(instance)
            }
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={
              isDrawingLine
                ? undefined
                : closeDetailsPanel
            }
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            selectionOnDrag={!isDrawingLine}
            multiSelectionKeyCode="Control"
            panOnDrag={!isDrawingLine}
          >
            <Background gap={24} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {selectedEdge && selectedEdgeData && (
          <ConnectorDetailsPanel
            selectedEdge={selectedEdge}
            selectedEdgeData={selectedEdgeData}
            closeDetailsPanel={closeDetailsPanel}
            updateSelectedConnector={updateSelectedConnector}
            deleteSelectedConnector={deleteSelectedConnector}
          />
        )}

        {selectedNode && (
          <NodeDetailsPanel
            selectedNode={selectedNode}
            boardColumns={boardColumns}
            closeDetailsPanel={closeDetailsPanel}
            updateSelectedNodeData={updateSelectedNodeData}
            openSelectedMondayItem={openSelectedMondayItem}
            createSelectedMondayItem={createSelectedMondayItem}
            saveSelectedMondayItem={saveSelectedMondayItem}
            isCreatingMondayItem={isCreatingMondayItem}
            isSavingMondayChanges={isSavingMondayChanges}
            deleteSelectedNode={deleteSelectedNode}
            duplicateSelectedNode={duplicateSelectedNode}
          />
        )}
      </div>
    </div>
  );
}

export default App;