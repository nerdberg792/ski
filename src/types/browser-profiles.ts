export interface BrowserProfile {
  id: string;
  name: string;
  path: string;
  browser: string;
}

export interface BrowserProfilesListResult {
  success: boolean;
  profiles?: BrowserProfile[];
  error?: string;
}

export interface BrowserProfilesOpenResult {
  success: boolean;
  error?: string;
}

