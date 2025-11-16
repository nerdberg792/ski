import { useMemo } from "react";
import type {
  BrowserTabsSearchResult,
  BrowserTabsCloseResult,
} from "../../types/browser-tabs";

export interface UseBrowserTabsResult {
  search: (query: string, browser?: string) => Promise<BrowserTabsSearchResult>;
  close: (payload: { browser: string; windowId: string; tabIndex: number }) => Promise<BrowserTabsCloseResult>;
  isAvailable: boolean;
}

export function useBrowserTabs(): UseBrowserTabsResult {
  const skyBrowserTabs = useMemo(() => window.sky?.browserTabs, []);

  const search = async (query: string, browser?: string): Promise<BrowserTabsSearchResult> => {
    if (!skyBrowserTabs) {
      return { success: false, error: "Browser Tabs integration is not available" };
    }
    try {
      return await skyBrowserTabs.search(query, browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const close = async (payload: {
    browser: string;
    windowId: string;
    tabIndex: number;
  }): Promise<BrowserTabsCloseResult> => {
    if (!skyBrowserTabs) {
      return { success: false, error: "Browser Tabs integration is not available" };
    }
    try {
      return await skyBrowserTabs.close(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    search,
    close,
    isAvailable: Boolean(skyBrowserTabs),
  };
}

