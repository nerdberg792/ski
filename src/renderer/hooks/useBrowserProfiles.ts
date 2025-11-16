import { useMemo } from "react";
import type {
  BrowserProfilesListResult,
  BrowserProfilesOpenResult,
} from "../../types/browser-profiles";

export interface UseBrowserProfilesResult {
  list: (browser: string) => Promise<BrowserProfilesListResult>;
  open: (payload: { browser: string; profile: string }) => Promise<BrowserProfilesOpenResult>;
  isAvailable: boolean;
}

export function useBrowserProfiles(): UseBrowserProfilesResult {
  const skyBrowserProfiles = useMemo(() => window.sky?.browserProfiles, []);

  const list = async (browser: string): Promise<BrowserProfilesListResult> => {
    if (!skyBrowserProfiles) {
      return { success: false, error: "Browser Profiles integration is not available" };
    }
    try {
      return await skyBrowserProfiles.list(browser);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const open = async (payload: {
    browser: string;
    profile: string;
  }): Promise<BrowserProfilesOpenResult> => {
    if (!skyBrowserProfiles) {
      return { success: false, error: "Browser Profiles integration is not available" };
    }
    try {
      return await skyBrowserProfiles.open(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    list,
    open,
    isAvailable: Boolean(skyBrowserProfiles),
  };
}

