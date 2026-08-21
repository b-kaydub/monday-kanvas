import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from "@xyflow/react";

import type {
  KNode,
  ShapeData,
} from "../../types/kanvas";

function ShapeText({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div className="kanvas-shape-text">
      <div className="kanvas-shape-text-title">
        {label}
      </div>

      {text.trim() && (
        <div className="kanvas-shape-text-body">
          {text}
        </div>
      )}
    </div>
  );
}

export function KanvasShape({
  data,
  selected,
}: NodeProps<KNode>) {
  const shapeData = data as ShapeData;

  const isLine =
    shapeData.shapeType === "line";

  const isVerticalLine =
    isLine && shapeData.rotation === 90;

  const lineThickness =
    shapeData.lineThickness ?? 4;

  const transformStyle = {
    transform: `rotate(${shapeData.rotation}deg)`,
  };

  return (
    <div className="kanvas-shape-wrapper">
      {isLine ? (
        <NodeResizer
          isVisible={selected}
          minWidth={isVerticalLine ? 20 : 40}
          maxWidth={
            isVerticalLine ? 20 : undefined
          }
          minHeight={isVerticalLine ? 40 : 20}
          maxHeight={
            isVerticalLine ? undefined : 20
          }
          color={shapeData.borderColor}
          handleStyle={{
            width: 12,
            height: 12,
            background: shapeData.borderColor,
            border: "2px solid white",
            borderRadius: "50%",
          }}
          lineStyle={{
            borderColor: shapeData.borderColor,
          }}
        />
      ) : (
        <NodeResizer
          isVisible={selected}
          minWidth={60}
          minHeight={50}
          color={shapeData.borderColor}
        />
      )}

      <Handle
        type="target"
        position={Position.Left}
      />

      <Handle
        type="source"
        position={Position.Right}
      />

      {shapeData.shapeType === "rectangle" && (
        <div
          className={
            selected
              ? "kanvas-shape selected"
              : "kanvas-shape"
          }
          style={{
            ...transformStyle,
            backgroundColor:
              shapeData.fillColor,
            borderColor:
              shapeData.borderColor,
          }}
        >
          <ShapeText
            label={shapeData.label}
            text={shapeData.text}
          />
        </div>
      )}

      {shapeData.shapeType === "circle" && (
        <div
          className={
            selected
              ? "kanvas-shape kanvas-shape-circle selected"
              : "kanvas-shape kanvas-shape-circle"
          }
          style={{
            ...transformStyle,
            backgroundColor:
              shapeData.fillColor,
            borderColor:
              shapeData.borderColor,
          }}
        >
          <ShapeText
            label={shapeData.label}
            text={shapeData.text}
          />
        </div>
      )}

      {shapeData.shapeType === "triangle" && (
        <div
          className={
            selected
              ? "kanvas-shape-triangle-container selected"
              : "kanvas-shape-triangle-container"
          }
          style={transformStyle}
        >
          <div
            className="kanvas-shape-triangle"
            style={{
              backgroundColor:
                shapeData.fillColor,
              borderColor:
                shapeData.borderColor,
            }}
          />

          <div className="kanvas-shape-triangle-label">
            <ShapeText
              label={shapeData.label}
              text={shapeData.text}
            />
          </div>
        </div>
      )}

      {shapeData.shapeType === "hexagon" && (
        <div
          className={
            selected
              ? "kanvas-shape-hexagon-container selected"
              : "kanvas-shape-hexagon-container"
          }
          style={transformStyle}
        >
          <div
            className="kanvas-shape-hexagon"
            style={{
              backgroundColor:
                shapeData.fillColor,
              borderColor:
                shapeData.borderColor,
            }}
          />

          <div className="kanvas-shape-hexagon-label">
            <ShapeText
              label={shapeData.label}
              text={shapeData.text}
            />
          </div>
        </div>
      )}

      {shapeData.shapeType === "arrow" && (
        <div
          className={
            selected
              ? "kanvas-shape-arrow-container selected"
              : "kanvas-shape-arrow-container"
          }
          style={transformStyle}
        >
          <div
            className="kanvas-shape-arrow-body"
            style={{
              backgroundColor:
                shapeData.fillColor,
              borderColor:
                shapeData.borderColor,
            }}
          >
            <ShapeText
              label={shapeData.label}
              text={shapeData.text}
            />
          </div>

          <div
            className="kanvas-shape-arrow-head"
            style={{
              borderLeftColor:
                shapeData.fillColor,
            }}
          />
        </div>
      )}

      {isLine && (
        <div
          className={
            selected
              ? "kanvas-shape-line-container selected"
              : "kanvas-shape-line-container"
          }
        >
        <div
          className={
            isVerticalLine
              ? "kanvas-shape-line vertical"
              : "kanvas-shape-line horizontal"
          }
          style={{
            backgroundColor:
              shapeData.borderColor,

            ...(isVerticalLine
              ? {
                  width: `${lineThickness}px`,
                }
              : {
                  height: `${lineThickness}px`,
                }),
          }}
        />
        </div>
      )}
    </div>
  );
}