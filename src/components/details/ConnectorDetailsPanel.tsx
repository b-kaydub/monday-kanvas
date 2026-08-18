import type { Edge } from "@xyflow/react";
import type { ConnectorData, ConnectorStyle } from "../../types/kanvas";

type ConnectorDetailsPanelProps = {
  selectedEdge: Edge;
  selectedEdgeData: ConnectorData;
  closeDetailsPanel: () => void;
  updateSelectedConnector: (updates: Partial<ConnectorData>) => void;
  deleteSelectedConnector: () => void;
};

export function ConnectorDetailsPanel({
  selectedEdge,
  selectedEdgeData,
  closeDetailsPanel,
  updateSelectedConnector,
  deleteSelectedConnector,
}: ConnectorDetailsPanelProps) {
  return (
    <aside className="kanvas-details-panel">
      <div className="kanvas-details-header">
        <div>
          <div className="kanvas-details-title">Connector Details</div>
          <div className="kanvas-details-subtitle">
            {selectedEdge.source} → {selectedEdge.target}
          </div>
        </div>

        <button className="kanvas-icon-button" onClick={closeDetailsPanel}>
          ×
        </button>
      </div>

      <div className="kanvas-details-section">
        <label>Connector Label</label>
        <input
          className="kanvas-details-input"
          value={selectedEdgeData.label}
          onChange={(event) =>
            updateSelectedConnector({ label: event.target.value })
          }
        />
      </div>

      <div className="kanvas-details-section">
        <label>Connector Type</label>
        <select
          className="kanvas-details-input"
          value={selectedEdgeData.connectorStyle}
          onChange={(event) =>
            updateSelectedConnector({
              connectorStyle: event.target.value as ConnectorStyle,
            })
          }
        >
          <option value="straight">Straight</option>
          <option value="step">Elbow</option>
          <option value="smoothstep">Smooth Elbow</option>
        </select>
      </div>

      <div className="kanvas-details-grid">
        <div className="kanvas-details-section">
          <label>Color</label>
          <input
            className="kanvas-details-color"
            type="color"
            value={selectedEdgeData.color}
            onChange={(event) =>
              updateSelectedConnector({ color: event.target.value })
            }
          />
        </div>

        <div className="kanvas-details-section">
          <label>Width</label>
          <input
            className="kanvas-details-input"
            type="number"
            min={1}
            max={10}
            value={selectedEdgeData.strokeWidth}
            onChange={(event) =>
              updateSelectedConnector({
                strokeWidth: Number(event.target.value),
              })
            }
          />
        </div>
      </div>

      <div className="kanvas-details-section">
        <label>
          <input
            type="checkbox"
            checked={selectedEdgeData.arrowhead}
            onChange={(event) =>
              updateSelectedConnector({ arrowhead: event.target.checked })
            }
          />{" "}
          Show arrowhead
        </label>
      </div>

      <div className="kanvas-details-section">
        <label>
          <input
            type="checkbox"
            checked={selectedEdgeData.dashed}
            onChange={(event) =>
              updateSelectedConnector({ dashed: event.target.checked })
            }
          />{" "}
          Dashed line
        </label>
      </div>

      <div className="kanvas-details-section">
        <label>
          <input
            type="checkbox"
            checked={selectedEdgeData.animated}
            onChange={(event) =>
              updateSelectedConnector({ animated: event.target.checked })
            }
          />{" "}
          Animate connector
        </label>
      </div>

      <div className="kanvas-details-actions">
        <button
          className="kanvas-danger-button"
          onClick={deleteSelectedConnector}
        >
          Delete Connector
        </button>
      </div>
    </aside>
  );
}