import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from "@xyflow/react";

import type {
  KNode,
  NoteData,
} from "../../types/kanvas";

export function KanvasNote({
  data,
  selected,
}: NodeProps<KNode>) {
  const noteData = data as NoteData;

  const fontSize =
    typeof noteData.fontSize === "number"
      ? noteData.fontSize
      : 16;

  return (
    <div
      className={
        selected
          ? "kanvas-note selected"
          : "kanvas-note"
      }
      style={{
        backgroundColor: noteData.color,
        width: "100%",
        height: "100%",
      }}
    >

<NodeResizer
  isVisible={selected}
  minWidth={80}
  minHeight={60}
  color="#ffb800"
  handleStyle={{
    width: 12,
    height: 12,
    background: "#ffb800",
    border: "2px solid white",
    borderRadius: "3px",
  }}
  lineStyle={{
    borderColor: "#ffb800",
  }}
/>

      <Handle
        type="target"
        position={Position.Left}
      />

      <Handle
        type="source"
        position={Position.Right}
      />

      <div className="kanvas-note-title">
        {noteData.title}
      </div>

      <div
        className="kanvas-note-text"
        style={{ fontSize: `${fontSize}px` }}
      >
        {noteData.text}
      </div>
    </div>
  );
}