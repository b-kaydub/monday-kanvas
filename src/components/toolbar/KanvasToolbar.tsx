import { useState, type Dispatch, type SetStateAction } from "react";
import type { KNode, ShapeType } from "../../types/kanvas";

type ToolbarSectionKey =
  | "view"
  | "mindMap"
  | "content"
  | "shapes"
  | "system";

type KanvasToolbarProps = {
  contextStatus: string;
  boardName: string;
  boardId: string;
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  filteredNodeCount: number;
  totalNodeCount: number;
  boardColumnCount: number;
  selectedNode: KNode | null;

  refreshItems: () => void;

  addCard: () => void;
  addFrame: () => void;
  addNote: () => void;
  addShape: (shapeType: ShapeType) => void;

  fitAll: () => void;
  focusSelected: () => void;

  addMindMapRoot: () => void;
  addMindMapChild: () => void;
  addMindMapSibling: () => void;
  autoLayoutMindMap: () => void;

  clearConnectors: () => void;
  resetSavedLayout: () => void;
};

export function KanvasToolbar({
  contextStatus,
  boardName,
  boardId,
  searchText,
  setSearchText,
  filteredNodeCount,
  totalNodeCount,
  boardColumnCount,
  selectedNode,
  refreshItems,
  addCard,
  addFrame,
  addNote,
  addShape,
  fitAll,
  focusSelected,
  addMindMapRoot,
  addMindMapChild,
  addMindMapSibling,
  autoLayoutMindMap,
  clearConnectors,
  resetSavedLayout,
}: KanvasToolbarProps) {
  const [toolbarSections, setToolbarSections] = useState<
    Record<ToolbarSectionKey, boolean>
  >({
    view: true,
    mindMap: true,
    content: true,
    shapes: true,
    system: false,
  });

  const toggleToolbarSection = (section: ToolbarSectionKey) => {
    setToolbarSections((currentSections) => {
      const nextSections = { ...currentSections };
      nextSections[section] = !nextSections[section];
      return nextSections;
    });
  };

  return (
    <div className="kanvas-toolbar">
      <div>
        <div className="kanvas-logo">Kanvas</div>

        <div className="kanvas-caption">
        {contextStatus}
        {boardName ? ` | Board: ${boardName}` : ""}
        {boardId ? ` | Board ID: ${boardId}` : ""}
        {boardColumnCount > 0 ? ` | Columns: ${boardColumnCount}` : ""}
        {searchText.trim()
            ? ` | Showing ${filteredNodeCount} of ${totalNodeCount} objects`
            : ""}
        </div>
      </div>

      <div className="kanvas-toolbar-actions">
        <input
          className="kanvas-search"
          placeholder="Search..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        {searchText.trim() && (
          <button onClick={() => setSearchText("")}>Clear Search</button>
        )}

        <div className="kanvas-toolbar-section">
          <button
            type="button"
            className="kanvas-toolbar-section-header"
            onClick={() => toggleToolbarSection("view")}
          >
            <span>View</span>
            <span className="kanvas-toolbar-chevron">
              {toolbarSections.view ? "▼" : "▶"}
            </span>
          </button>

          {toolbarSections.view && (
            <div className="kanvas-toolbar-section-content">
              <button onClick={fitAll}>Fit All</button>

              <button onClick={focusSelected} disabled={!selectedNode}>
                Focus Selected
              </button>
            </div>
          )}
        </div>

        <div className="kanvas-toolbar-section">
          <button
            type="button"
            className="kanvas-toolbar-section-header"
            onClick={() => toggleToolbarSection("mindMap")}
          >
            <span>Mind Map</span>
            <span className="kanvas-toolbar-chevron">
              {toolbarSections.mindMap ? "▼" : "▶"}
            </span>
          </button>

          {toolbarSections.mindMap && (
            <div className="kanvas-toolbar-section-content">
              <button onClick={addMindMapRoot}>Root</button>

              <button onClick={addMindMapChild} disabled={!selectedNode}>
                Child
              </button>

              <button onClick={addMindMapSibling} disabled={!selectedNode}>
                Sibling
              </button>

              <button onClick={autoLayoutMindMap} disabled={!selectedNode}>
                Auto Layout
              </button>
            </div>
          )}
        </div>

        <div className="kanvas-toolbar-section">
          <button
            type="button"
            className="kanvas-toolbar-section-header"
            onClick={() => toggleToolbarSection("content")}
          >
            <span>Content</span>
            <span className="kanvas-toolbar-chevron">
              {toolbarSections.content ? "▼" : "▶"}
            </span>
          </button>

          {toolbarSections.content && (
            <div className="kanvas-toolbar-section-content">
              <button onClick={addCard}>Card</button>
              <button onClick={addNote}>Note</button>
              <button onClick={addFrame}>Frame</button>
            </div>
          )}
        </div>

        <div className="kanvas-toolbar-section">
          <button
            type="button"
            className="kanvas-toolbar-section-header"
            onClick={() => toggleToolbarSection("shapes")}
          >
            <span>Shapes</span>
            <span className="kanvas-toolbar-chevron">
              {toolbarSections.shapes ? "▼" : "▶"}
            </span>
          </button>

          {toolbarSections.shapes && (
            <div className="kanvas-toolbar-section-content">
              <button onClick={() => addShape("rectangle")}>Rectangle</button>
              <button onClick={() => addShape("circle")}>Circle</button>
              <button onClick={() => addShape("triangle")}>Triangle</button>
              <button onClick={() => addShape("hexagon")}>Hexagon</button>
              <button onClick={() => addShape("arrow")}>Arrow</button>
              <button onClick={() => addShape("line")}>Line</button>
            </div>
          )}
        </div>

        <div className="kanvas-toolbar-section">
          <button
            type="button"
            className="kanvas-toolbar-section-header"
            onClick={() => toggleToolbarSection("system")}
          >
            <span>System</span>
            <span className="kanvas-toolbar-chevron">
              {toolbarSections.system ? "▼" : "▶"}
            </span>
          </button>

          {toolbarSections.system && (
            <div className="kanvas-toolbar-section-content">
              <button onClick={refreshItems}>Refresh Items</button>
              <button onClick={clearConnectors}>Clear Connectors</button>
              <button onClick={resetSavedLayout}>Clear Saved Layout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}