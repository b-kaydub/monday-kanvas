import type { KNode, MondayItem, SavedLayout } from "../types/kanvas";
import { getStatusColor } from "./statusColors";

export function mondayItemsToNodes(
  items: MondayItem[],
  savedLayout: SavedLayout
): KNode[] {
  return items.map((item, index) => {
    const statusColumn = item.column_values.find(
      (column) => column.type === "status"
    );

    const personColumn = item.column_values.find(
      (column) => column.type === "people" || column.type === "person"
    );

    const status = statusColumn?.text || "No status";
    const owner = personColumn?.text || "Unassigned";

    const mondayColumnValues = Object.fromEntries(
      item.column_values.map((column) => [
        column.id,
        {
          id: column.id,
          text: column.text,
          type: column.type,
        },
      ])
    );

    const defaultPosition = {
      x: 100 + (index % 4) * 340,
      y: 100 + Math.floor(index / 4) * 190,
    };

    return {
      id: item.id,
      type: "kanvasCard",
      position: savedLayout.positions[item.id] ?? defaultPosition,
      data: {
        nodeKind: "card",
        title: item.name,
        subtitle: item.group?.title || "No group",
        status,
        owner,
        color: getStatusColor(status),
        itemId: item.id,
        source: "monday",
        mondayColumnValues,
      },
    };
  });
}