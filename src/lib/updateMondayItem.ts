type MondayClient = {
  api: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    }
  ) => Promise<unknown>;
};

type UpdateMondayItemArgs = {
  monday: MondayClient;
  boardId: string;
  itemId: string;
  columnValues: Record<string, unknown>;
};

type UpdateMondayItemResponse = {
  change_multiple_column_values?: {
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

export async function updateMondayItem({
  monday,
  boardId,
  itemId,
  columnValues,
}: UpdateMondayItemArgs): Promise<string> {
  const mutation = `
    mutation UpdateKanvasItem(
      $boardId: ID!
      $itemId: ID!
      $columnValues: JSON!
    ) {
      change_multiple_column_values(
        board_id: $boardId
        item_id: $itemId
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const response = (await monday.api(mutation, {
    variables: {
      boardId: String(boardId),
      itemId: String(itemId),
      columnValues: JSON.stringify(columnValues),
    },
  })) as {
    data?: UpdateMondayItemResponse;
    errors?: Array<{
      message?: string;
    }>;
  };

  if (response.errors && response.errors.length > 0) {
    console.error("Monday update item response:", response);
    throw new Error(getMondayErrorMessage(response));
  }

  const updatedItemId = response.data?.change_multiple_column_values?.id;

  if (!updatedItemId) {
    console.error("Monday update item missing item ID:", response);
    throw new Error("Monday API did not return the updated item ID.");
  }

  return updatedItemId;
}