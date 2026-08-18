import { useCallback } from "react";

export function useMondayBoardLoader() {
  const wrapLoader = useCallback(
    async (loader: () => Promise<void>) => {
      await loader();
    },
    []
  );

  return {
    wrapLoader,
  };
}