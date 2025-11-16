export interface BrowserHistoryEntry {
  id: string;
  url: string;
  title: string;
  visitCount?: number;
  lastVisitTime?: string;
  browser: string;
}

export interface BrowserHistorySearchResult {
  success: boolean;
  entries?: BrowserHistoryEntry[];
  error?: string;
}

export interface BrowserHistoryOpenResult {
  success: boolean;
  error?: string;
}

