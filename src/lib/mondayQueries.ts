export const GET_BOARD_ITEMS_QUERY = `
  query GetBoardItems($boardId: [ID!]) {
    boards(ids: $boardId) {
      id
      name
      items_page(limit: 50) {
        items {
          id
          name
          group {
            id
            title
          }
          column_values {
            id
            text
            type
          }
        }
      }
    }
  }
`;