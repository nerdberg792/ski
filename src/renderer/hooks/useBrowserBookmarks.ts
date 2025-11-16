import { useMemo } from "react";
import type {
  BrowserBookmarksSearchResult,
  BrowserBookmarksOpenResult,
} from "../../types/browser-bookmarks";

export interface UseBrowserBookmarksResult {
  search: (query: string, browser?: string) => Promise<BrowserBookmarksSearchResult>;
  open: (payload: { url: string; browser?: string }) => Promise<BrowserBookmarksOpenResult>;
  isAvailable: boolean;
}

export function useBrowserBookmarks(): UseBrowserBookmarksResult {
  const skyBrowserBookmarks = useMemo(() => window.sky?.browserBookmarks, []);

  const search = async (query: string, browser?: string): Promise<BrowserBookmarksSearchResult> => {
    if (!skyBrowserBookmarks) {
      return { success: false, error: "Browser Bookmarks integration is not available" };
    }
    try {
      return await skyBrowserBookmarks.search(query, browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const open = async (payload: {
    url: string;
    browser?: string;
  }): Promise<BrowserBookmarksOpenResult> => {
    if (!skyBrowserBookmarks) {
      return { success: false, error: "Browser Bookmarks integration is not available" };
    }
    try {
      return await skyBrowserBookmarks.open(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    search,
    open,
    isAvailable: Boolean(skyBrowserBookmarks),
  };
}

