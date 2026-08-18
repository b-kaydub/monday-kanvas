import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { FrameData, KNode } from "../../types/kanvas";

export function KanvasFrame({ data, selected }: NodeProps<KNode>) {
  const frameData = data as FrameData;

  return (
    <div
      className={selected ? "kanvas-frame selected" : "kanvas-frame"}
      style={{
        borderColor: frameData.color,
        backgroundColor: `${frameData.color}14`,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={280}
        minHeight={160}
        color={frameData.color}
      />

      <div className="kanvas-frame-header">
        <div
          className="kanvas-frame-dot"
          style={{ backgroundColor: frameData.color }}
        />

        <div>
          <div className="kanvas-frame-title">{frameData.title}</div>
          <div className="kanvas-frame-description">
            {frameData.description}
          </div>
        </div>
      </div>
    </div>
  );
}