import type {
  KNode,
  MondayBoardColumn,
  NodeData,
  ShapeType,
} from "../../types/kanvas";

type NodeDetailsPanelProps = {
  selectedNode: KNode;
  boardColumns: MondayBoardColumn[];
  closeDetailsPanel: () => void;
  updateSelectedNodeData: (updates: Partial<NodeData>) => void;
  openSelectedMondayItem: () => Promise<void>;
  createSelectedMondayItem: () => Promise<void>;
  saveSelectedMondayItem: () => Promise<void>;
  isCreatingMondayItem: boolean;
  isSavingMondayChanges: boolean;
  deleteSelectedNode: () => void;
};

const editableMondayColumnTypes = new Set([
  "text",
  "long_text",
  "numbers",
  "date",
  "status",
  "dropdown",
]);

type MondayColumnLabelOption = {
  label: string;
  value: string;
};

function parseMondayColumnSettings(settings: unknown): Record<string, unknown> {
  if (!settings) {
    return {};
  }

  if (typeof settings === "string") {
    try {
      return JSON.parse(settings) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (typeof settings === "object") {
    return settings as Record<string, unknown>;
  }

  return {};
}

function getMondayColumnLabelOptions(
  column: MondayBoardColumn
): MondayColumnLabelOption[] {
  const settings = parseMondayColumnSettings(column.settings);
  const labels = settings.labels;

  if (!labels) {
    return [];
  }

  if (Array.isArray(labels)) {
    return labels
      .map((labelItem) => {
        if (typeof labelItem === "string") {
          return {
            label: labelItem,
            value: labelItem,
          };
        }

        if (labelItem && typeof labelItem === "object") {
          const item = labelItem as Record<string, unknown>;
          const label =
            typeof item.name === "string"
              ? item.name
              : typeof item.label === "string"
                ? item.label
                : "";

          return {
            label,
            value: label,
          };
        }

        return {
          label: "",
          value: "",
        };
      })
      .filter((option) => option.label.trim());
  }

  if (typeof labels === "object") {
    return Object.entries(labels as Record<string, unknown>)
      .map(([key, value]) => {
        if (typeof value === "string") {
          return {
            label: value,
            value,
          };
        }

        if (value && typeof value === "object") {
          const valueObject = value as Record<string, unknown>;
          const label =
            typeof valueObject.name === "string"
              ? valueObject.name
              : typeof valueObject.label === "string"
                ? valueObject.label
                : "";

          return {
            label,
            value: label || key,
          };
        }

        return {
          label: "",
          value: "",
        };
      })
      .filter((option) => option.label.trim());
  }

  return [];
}

const hiddenMondayColumnIds = new Set([
  "name",
]);

const hiddenMondayColumnTypes = new Set([
  "name",
  "people",
  "person",
  "file",
  "files",
  "formula",
  "mirror",
  "dependency",
  "dependencies",
  "connect_boards",
  "board_relation",
  "subtasks",
  "subitems",
  "creation_log",
  "last_updated",
  "auto_number",
  "button",
]);

function shouldShowMondayColumn(column: MondayBoardColumn) {
  if (hiddenMondayColumnIds.has(column.id)) {
    return false;
  }

  if (hiddenMondayColumnTypes.has(column.type)) {
    return false;
  }

  return editableMondayColumnTypes.has(column.type);
}

export function NodeDetailsPanel({
  selectedNode,
  boardColumns,
  closeDetailsPanel,
  updateSelectedNodeData,
  openSelectedMondayItem,
  createSelectedMondayItem,
  saveSelectedMondayItem,
  isCreatingMondayItem,
  isSavingMondayChanges,
  deleteSelectedNode,
}: NodeDetailsPanelProps) {
  const updateDraftMondayValue = (columnId: string, value: string) => {
    if (selectedNode.data.nodeKind !== "card") {
      return;
    }

    const nextDraftMondayValues: Record<string, string> = {
      ...(selectedNode.data.draftMondayValues ?? {}),
    };

    nextDraftMondayValues[columnId] = value;

    updateSelectedNodeData({
      draftMondayValues: nextDraftMondayValues,
    } as Partial<NodeData>);
  };

  const getDraftMondayValue = (columnId: string) => {
    if (selectedNode.data.nodeKind !== "card") {
      return "";
    }

    return (
      selectedNode.data.draftMondayValues?.[columnId] ??
      selectedNode.data.mondayColumnValues?.[columnId]?.text ??
      ""
    );
  };

  const getLinkedMondayColumnText = (column: MondayBoardColumn) => {
    if (selectedNode.data.nodeKind !== "card") {
      return "Empty";
    }

    const columnValue = selectedNode.data.mondayColumnValues?.[column.id];

    if (columnValue?.text && columnValue.text.trim()) {
      return columnValue.text;
    }

    return "Empty";
  };

  const visibleMondayColumns = boardColumns.filter(shouldShowMondayColumn);

  const renderDraftMondayColumnInput = (column: MondayBoardColumn) => {
    const currentValue = getDraftMondayValue(column.id);

    if (column.type === "status" || column.type === "dropdown") {
      const options = getMondayColumnLabelOptions(column);

      if (options.length > 0) {
        return (
          <select
            className="kanvas-details-input"
            value={currentValue}
            onChange={(event) =>
              updateDraftMondayValue(column.id, event.target.value)
            }
          >
            <option value="">Select...</option>

            {options.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          className="kanvas-details-input"
          value={currentValue}
          placeholder="Enter label..."
          onChange={(event) =>
            updateDraftMondayValue(column.id, event.target.value)
          }
        />
      );
    }

    if (column.type === "long_text") {
      return (
        <textarea
          className="kanvas-details-textarea"
          value={currentValue}
          onChange={(event) =>
            updateDraftMondayValue(column.id, event.target.value)
          }
        />
      );
    }

    if (column.type === "numbers") {
      return (
        <input
          className="kanvas-details-input"
          type="number"
          value={currentValue}
          onChange={(event) =>
            updateDraftMondayValue(column.id, event.target.value)
          }
        />
      );
    }

    if (column.type === "date") {
      return (
        <input
          className="kanvas-details-input"
          type="date"
          value={currentValue}
          onChange={(event) =>
            updateDraftMondayValue(column.id, event.target.value)
          }
        />
      );
    }

    return (
      <input
        className="kanvas-details-input"
        value={currentValue}
        onChange={(event) =>
          updateDraftMondayValue(column.id, event.target.value)
        }
      />
    );
  };

  const renderMondayColumnEditor = (
    column: MondayBoardColumn,
    showReadOnlyValueForUnsupported: boolean
  ) => {
    const isEditable = editableMondayColumnTypes.has(column.type);

    return (
      <div className="kanvas-column-list-item" key={column.id}>
        <div className="kanvas-column-list-title">
          {column.title || "Untitled column"}
        </div>

        {isEditable ? (
          <div className="kanvas-column-list-editor">
            {renderDraftMondayColumnInput(column)}
          </div>
        ) : (
          <div className="kanvas-column-list-value">
            {showReadOnlyValueForUnsupported
              ? getLinkedMondayColumnText(column)
              : "Not editable yet"}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="kanvas-details-panel">
      <div className="kanvas-details-header">
        <div>
          <div className="kanvas-details-title">
            {selectedNode.data.nodeKind === "frame"
              ? "Frame Details"
              : selectedNode.data.nodeKind === "shape"
                ? "Shape Details"
                : selectedNode.data.nodeKind === "note"
                  ? "Note Details"
                  : "Card Details"}
          </div>

          <div className="kanvas-details-subtitle">
            {selectedNode.data.nodeKind === "frame"
              ? "Visual grouping frame"
              : selectedNode.data.nodeKind === "shape"
                ? `${selectedNode.data.shapeType} shape`
                : selectedNode.data.nodeKind === "note"
                  ? "Editable note card"
                  : selectedNode.data.source === "monday"
                    ? "Linked Monday item"
                    : "Manual Kanvas card"}
          </div>
        </div>

        <button className="kanvas-icon-button" onClick={closeDetailsPanel}>
          ×
        </button>
      </div>

      {selectedNode.data.nodeKind === "frame" && (
        <>
          <div className="kanvas-details-section">
            <label>Frame Title</label>
            <input
              className="kanvas-details-input"
              value={selectedNode.data.title}
              onChange={(event) =>
                updateSelectedNodeData({ title: event.target.value })
              }
            />
          </div>

          <div className="kanvas-details-section">
            <label>Description</label>
            <textarea
              className="kanvas-details-textarea"
              value={selectedNode.data.description}
              onChange={(event) =>
                updateSelectedNodeData({
                  description: event.target.value,
                })
              }
            />
          </div>

          <div className="kanvas-details-section">
            <label>Frame Color</label>
            <input
              className="kanvas-details-color"
              type="color"
              value={selectedNode.data.color}
              onChange={(event) =>
                updateSelectedNodeData({ color: event.target.value })
              }
            />
          </div>
        </>
      )}

      {selectedNode.data.nodeKind === "shape" && (
        <>
          <div className="kanvas-details-section">
            <label>Shape Type</label>
            <select
              className="kanvas-details-input"
              value={selectedNode.data.shapeType}
              onChange={(event) =>
                updateSelectedNodeData({
                  shapeType: event.target.value as ShapeType,
                })
              }
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="triangle">Triangle</option>
              <option value="hexagon">Hexagon</option>
              <option value="arrow">Arrow</option>
            </select>
          </div>

          <div className="kanvas-details-section">
            <label>Label</label>
            <input
              className="kanvas-details-input"
              value={selectedNode.data.label}
              onChange={(event) =>
                updateSelectedNodeData({ label: event.target.value })
              }
            />
          </div>

          <div className="kanvas-details-section">
            <label>Text</label>
            <textarea
              className="kanvas-details-textarea"
              value={selectedNode.data.text}
              onChange={(event) =>
                updateSelectedNodeData({ text: event.target.value })
              }
            />
          </div>

          <div className="kanvas-details-grid">
            <div className="kanvas-details-section">
              <label>Fill Color</label>
              <input
                className="kanvas-details-color"
                type="color"
                value={selectedNode.data.fillColor}
                onChange={(event) =>
                  updateSelectedNodeData({
                    fillColor: event.target.value,
                  })
                }
              />
            </div>

            <div className="kanvas-details-section">
              <label>Border Color</label>
              <input
                className="kanvas-details-color"
                type="color"
                value={selectedNode.data.borderColor}
                onChange={(event) =>
                  updateSelectedNodeData({
                    borderColor: event.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="kanvas-details-section">
            <label>Rotation</label>
            <input
              className="kanvas-details-input"
              type="number"
              value={selectedNode.data.rotation}
              onChange={(event) =>
                updateSelectedNodeData({
                  rotation: Number(event.target.value),
                })
              }
            />
          </div>
        </>
      )}

      {selectedNode.data.nodeKind === "note" && (
        <>
          <div className="kanvas-details-section">
            <label>Note Title</label>
            <input
              className="kanvas-details-input"
              value={selectedNode.data.title}
              onChange={(event) =>
                updateSelectedNodeData({ title: event.target.value })
              }
            />
          </div>

          <div className="kanvas-details-section">
            <label>Note Text</label>
            <textarea
              className="kanvas-details-textarea"
              value={selectedNode.data.text}
              onChange={(event) =>
                updateSelectedNodeData({ text: event.target.value })
              }
            />
          </div>

          <div className="kanvas-details-section">
            <label>Note Color</label>
            <input
              className="kanvas-details-color"
              type="color"
              value={selectedNode.data.color}
              onChange={(event) =>
                updateSelectedNodeData({ color: event.target.value })
              }
            />
          </div>
        </>
      )}

            {selectedNode.data.nodeKind === "card" &&
        selectedNode.data.source === "manual" && (
          <>
            <div className="kanvas-details-section">
              <label>Title</label>
              <input
                className="kanvas-details-input"
                value={selectedNode.data.title}
                onChange={(event) =>
                  updateSelectedNodeData({ title: event.target.value })
                }
              />
            </div>

            <div className="kanvas-details-section">
              <label>Subtitle</label>
              <input
                className="kanvas-details-input"
                value={selectedNode.data.subtitle}
                onChange={(event) =>
                  updateSelectedNodeData({
                    subtitle: event.target.value,
                  })
                }
              />
            </div>

            <div className="kanvas-details-section">
              <label>Notes</label>
              <textarea
                className="kanvas-details-textarea"
                value={selectedNode.data.notes || ""}
                onChange={(event) =>
                  updateSelectedNodeData({ notes: event.target.value })
                }
              />
            </div>

            {visibleMondayColumns.length > 0 && (
              <div className="kanvas-details-section">
                <label>Monday Columns</label>

                <div className="kanvas-column-list">
                  {visibleMondayColumns.map((column) =>
                    renderMondayColumnEditor(column, false)
                  )}
                </div>
              </div>
            )}
          </>
        )}

      {selectedNode.data.nodeKind === "card" &&
        selectedNode.data.source === "monday" && (
          <>
            <div className="kanvas-details-section">
              <label>Title</label>
              <div className="kanvas-details-value">
                {selectedNode.data.title}
              </div>
            </div>

            <div className="kanvas-details-section">
              <label>Status</label>
              <div className="kanvas-details-value">
                {selectedNode.data.status}
              </div>
            </div>

            <div className="kanvas-details-section">
              <label>Owner</label>
              <div className="kanvas-details-value">
                {selectedNode.data.owner}
              </div>
            </div>

            {visibleMondayColumns.length > 0 && (
              <div className="kanvas-details-section">
                <label>Monday Columns</label>

                <div className="kanvas-column-list">
                  {visibleMondayColumns.map((column) =>
                    renderMondayColumnEditor(column, true)
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="kanvas-details-actions">
          {selectedNode.data.nodeKind === "card" &&
            selectedNode.data.source === "manual" && (
              <button
                onClick={createSelectedMondayItem}
                disabled={
                  !selectedNode.data.title.trim() || isCreatingMondayItem
                }
              >
                {isCreatingMondayItem ? "Creating..." : "Create Monday Item"}
              </button>
            )}

          {selectedNode.data.nodeKind === "card" &&
            selectedNode.data.source === "monday" && (
              <button
                onClick={saveSelectedMondayItem}
                disabled={
                  isSavingMondayChanges ||
                  Object.keys(selectedNode.data.draftMondayValues ?? {}).length === 0
                }
              >
                {isSavingMondayChanges ? "Saving..." : "Save Monday Changes"}
              </button>
            )}

          <button
            onClick={openSelectedMondayItem}
          disabled={
            selectedNode.data.nodeKind !== "card" ||
            selectedNode.data.source !== "monday"
          }
        >
          Open Monday Item
        </button>

        {(selectedNode.data.nodeKind === "frame" ||
          selectedNode.data.nodeKind === "shape" ||
          selectedNode.data.nodeKind === "note" ||
          (selectedNode.data.nodeKind === "card" &&
            selectedNode.data.source === "manual")) && (
          <button
            className="kanvas-danger-button"
            onClick={deleteSelectedNode}
          >
            Delete
          </button>
        )}
      </div>
    </aside>
  );
}