import { useMemo } from "react";
import type {
  BrowserHistorySearchResult,
  BrowserHistoryOpenResult,
} from "../../types/browser-history";

export interface UseBrowserHistoryResult {
  search: (payload: { query: string; browser?: string; limit?: number }) => Promise<BrowserHistorySearchResult>;
  open: (payload: { url: string; browser?: string }) => Promise<BrowserHistoryOpenResult>;
  isAvailable: boolean;
}

export function useBrowserHistory(): UseBrowserHistoryResult {
  const skyBrowserHistory = useMemo(() => window.sky?.browserHistory, []);

  const search = async (payload: {
    query: string;
    browser?: string;
    limit?: number;
  }): Promise<BrowserHistorySearchResult> => {
    if (!skyBrowserHistory) {
      return { success: false, error: "Browser History integration is not available" };
    }
    try {
      return await skyBrowserHistory.search(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const open = async (payload: {
    url: string;
    browser?: string;
  }): Promise<BrowserHistoryOpenResult> => {
    if (!skyBrowserHistory) {
      return { success: false, error: "Browser History integration is not available" };
    }
    try {
      return await skyBrowserHistory.open(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    search,
    open,
    isAvailable: Boolean(skyBrowserHistory),
  };
}

