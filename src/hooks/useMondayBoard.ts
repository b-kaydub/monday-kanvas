import { useState } from "react";

export function isValidBoardId(boardId: string) {
  return (
    boardId &&
    boardId !== "Loading..." &&
    boardId !== "No board context" &&
    boardId !== "Context error"
  );
}

export function useMondayBoard() {
  const [boardId, setBoardId] = useState("Loading...");
  const [boardName, setBoardName] = useState("");
  const [contextStatus, setContextStatus] = useState(
    "Reading Monday board context..."
  );
  const [hasLoadedBoardItems, setHasLoadedBoardItems] = useState(false);

  return {
    boardId,
    setBoardId,

    boardName,
    setBoardName,

    contextStatus,
    setContextStatus,

    hasLoadedBoardItems,
    setHasLoadedBoardItems,
  };
}