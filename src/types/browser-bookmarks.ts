export interface BrowserBookmark {
  id: string;
  title: string;
  url: string;
  folder?: string;
  browser: string;
}

export interface BrowserBookmarksSearchResult {
  success: boolean;
  bookmarks?: BrowserBookmark[];
  error?: string;
}

export interface BrowserBookmarksOpenResult {
  success: boolean;
  error?: string;
}

