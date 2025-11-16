import { useMemo } from "react";
import type {
  AppleStocksSearchResult,
} from "../../types/apple-stocks";

export interface UseAppleStocksResult {
  search: (ticker: string) => Promise<AppleStocksSearchResult>;
  isAvailable: boolean;
}

export function useAppleStocks(): UseAppleStocksResult {
  const skyAppleStocks = useMemo(() => window.sky?.appleStocks, []);

  const search = async (ticker: string): Promise<AppleStocksSearchResult> => {
    if (!skyAppleStocks) {
      return { success: false, error: "Apple Stocks integration is not available" };
    }
    try {
      return await skyAppleStocks.search(ticker);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    search,
    isAvailable: Boolean(skyAppleStocks),
  };
}

