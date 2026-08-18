import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import type { KNode, NoteData } from "../../types/kanvas";

export function KanvasNote({ data, selected }: NodeProps<KNode>) {
  const noteData = data as NoteData;

  return (
    <div
      className={selected ? "kanvas-note selected" : "kanvas-note"}
      style={{ backgroundColor: noteData.color }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={140}
        color="#ffb800"
      />

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      <div className="kanvas-note-title">{noteData.title}</div>
      <div className="kanvas-note-text">{noteData.text}</div>
    </div>
  );
}