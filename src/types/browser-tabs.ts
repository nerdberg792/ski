export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  windowId: string;
  tabIndex: number;
  browser: string;
}

export interface BrowserTabsSearchResult {
  success: boolean;
  tabs?: BrowserTab[];
  error?: string;
}

export interface BrowserTabsCloseResult {
  success: boolean;
  error?: string;
}

