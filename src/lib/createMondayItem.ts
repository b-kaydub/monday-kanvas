type MondayClient = {
  api: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    }
  ) => Promise<unknown>;
};

type CreateMondayItemArgs = {
  monday: MondayClient;
  boardId: string;
  itemName: string;
  columnValues?: Record<string, unknown>;
};

type CreateMondayItemResponse = {
  create_item?: {
    id: string;
  };
};

function getMondayErrorMessage(response: {
  errors?: Array<{
    message?: string;
  }>;
}) {
  if (!response.errors || response.errors.length === 0) {
    return "Unknown Monday API error.";
  }

  return response.errors
    .map((error, index) => {
      return `Error ${index + 1}: ${error.message || "No message"}`;
    })
    .join(" | ");
}

export async function createMondayItem({
  monday,
  boardId,
  itemName,
  columnValues,
}: CreateMondayItemArgs): Promise<string> {
  const mutation = `
    mutation CreateKanvasItem(
      $boardId: ID!
      $itemName: String!
      $columnValues: JSON
    ) {
      create_item(
        board_id: $boardId
        item_name: $itemName
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const variables = {
    boardId: String(boardId),
    itemName,
    columnValues: columnValues ? JSON.stringify(columnValues) : undefined,
  };

  const response = (await monday.api(mutation, {
    variables,
  })) as {
    data?: CreateMondayItemResponse;
    errors?: Array<{
      message?: string;
    }>;
  };

  if (response.errors && response.errors.length > 0) {
    console.error("Monday create_item response:", response);
    throw new Error(getMondayErrorMessage(response));
  }

  const itemId = response.data?.create_item?.id;

  if (!itemId) {
    console.error("Monday create_item missing item ID:", response);
    throw new Error("Monday API did not return a new item ID.");
  }

  return itemId;
}