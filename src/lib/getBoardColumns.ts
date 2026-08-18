import type { MondayBoardColumn } from "../types/kanvas";

type MondayClient = {
  api: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    }
  ) => Promise<unknown>;
};

type GetBoardColumnsArgs = {
  monday: MondayClient;
  boardId: string;
};

type GetBoardColumnsResponse = {
  boards?: Array<{
    id: string;
    columns?: MondayBoardColumn[];
  }>;
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

export async function getBoardColumns({
  monday,
  boardId,
}: GetBoardColumnsArgs): Promise<MondayBoardColumn[]> {
  const query = `
    query GetBoardColumns($boardId: [ID!]) {
      boards(ids: $boardId) {
        id
        columns {
          id
          title
          type
          settings
        }
      }
    }
  `;

  const response = (await monday.api(query, {
    variables: {
      boardId: [boardId],
    },
  })) as {
    data?: GetBoardColumnsResponse;
    errors?: Array<{
      message?: string;
    }>;
  };

  if (response.errors && response.errors.length > 0) {
    console.error("Monday getBoardColumns response:", response);
    throw new Error(getMondayErrorMessage(response));
  }

  return response.data?.boards?.[0]?.columns ?? [];
}