import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CardData, KNode } from "../../types/kanvas";

export function KanvasCard({ data, selected }: NodeProps<KNode>) {
  const cardData = data as CardData;

  return (
    <div className={selected ? "kanvas-card selected" : "kanvas-card"}>
      <Handle type="target" position={Position.Left} />

      <div
        className="kanvas-card-accent"
        style={{ backgroundColor: cardData.color }}
      />

      <div className="kanvas-card-content">
        <div className="kanvas-card-title">{cardData.title}</div>
        <div className="kanvas-card-subtitle">{cardData.subtitle}</div>

        <div className="kanvas-card-meta">
          <span className="kanvas-pill">{cardData.status}</span>
          <span className="kanvas-owner">{cardData.owner}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}