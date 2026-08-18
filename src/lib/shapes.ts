import type { ShapeType } from "../types/kanvas";

export function getShapeLabel(shapeType: ShapeType) {
  if (shapeType === "rectangle") return "Rectangle";
  if (shapeType === "circle") return "Circle";
  if (shapeType === "triangle") return "Triangle";
  if (shapeType === "hexagon") return "Hexagon";
  if (shapeType === "line") return "Line";

  return "Arrow";
}

export function getDefaultShapeSize(shapeType: ShapeType) {
  if (shapeType === "arrow") {
    return { width: 220, height: 90 };
  }

  if (shapeType === "line") {
    return { width: 250, height: 10 };
  }

  if (shapeType === "triangle") {
    return { width: 160, height: 140 };
  }

  return { width: 160, height: 110 };
}