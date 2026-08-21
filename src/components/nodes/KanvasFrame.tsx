import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from "@xyflow/react";

import type { FrameData, KNode } from "../../types/kanvas";

export function KanvasFrame({
  data,
  selected,
}: NodeProps<KNode>) {
  const frameData = data as FrameData;

  return (
    <div
      className={
        selected
          ? "kanvas-frame selected"
          : "kanvas-frame"
      }
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

      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
      />

      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
      />

      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
      />

      <div className="kanvas-frame-header">
        <div
          className="kanvas-frame-dot"
          style={{
            backgroundColor:
              frameData.color,
          }}
        />

        <div>
          <div className="kanvas-frame-title">
            {frameData.title}
          </div>

          <div className="kanvas-frame-description">
            {frameData.description}
          </div>
        </div>
      </div>
    </div>
  );
}