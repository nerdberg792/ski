import { shell } from "electron";

/**
 * Open a stock ticker in Apple Stocks
 */
export async function searchStocks(ticker: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Apple Stocks uses a web URL format
    const url = `https://stocks.apple.com/symbol/${encodeURIComponent(ticker.toUpperCase())}`;
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to open stock: ${message}` };
  }
}

