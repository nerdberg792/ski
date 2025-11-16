import { useMemo } from "react";
import type {
  FinderCreateFileResult,
  FinderOpenFileResult,
  FinderMoveFilesResult,
  FinderCopyFilesResult,
  FinderGetSelectedFilesResult,
} from "../../types/finder";

export interface UseFinderResult {
  createFile: (payload: { filename: string; autoOpen?: boolean }) => Promise<FinderCreateFileResult>;
  openFile: (payload: { path: string; application?: string }) => Promise<FinderOpenFileResult>;
  moveToFolder: (payload: { destination: string; filePaths: string[] }) => Promise<FinderMoveFilesResult>;
  copyToFolder: (payload: { destination: string; filePaths: string[] }) => Promise<FinderCopyFilesResult>;
  getSelectedFiles: () => Promise<FinderGetSelectedFilesResult>;
  isAvailable: boolean;
}

export function useFinder(): UseFinderResult {
  const skyFinder = useMemo(() => window.sky?.finder, []);

  const createFile = async (payload: {
    filename: string;
    autoOpen?: boolean;
  }): Promise<FinderCreateFileResult> => {
    if (!skyFinder) {
      return { success: false, error: "Finder integration is not available" };
    }
    try {
      return await skyFinder.createFile(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const openFile = async (payload: {
    path: string;
    application?: string;
  }): Promise<FinderOpenFileResult> => {
    if (!skyFinder) {
      return { success: false, error: "Finder integration is not available" };
    }
    try {
      return await skyFinder.openFile(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const moveToFolder = async (payload: {
    destination: string;
    filePaths: string[];
  }): Promise<FinderMoveFilesResult> => {
    if (!skyFinder) {
      return { success: false, error: "Finder integration is not available" };
    }
    try {
      return await skyFinder.moveToFolder(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const copyToFolder = async (payload: {
    destination: string;
    filePaths: string[];
  }): Promise<FinderCopyFilesResult> => {
    if (!skyFinder) {
      return { success: false, error: "Finder integration is not available" };
    }
    try {
      return await skyFinder.copyToFolder(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  const getSelectedFiles = async (): Promise<FinderGetSelectedFilesResult> => {
    if (!skyFinder) {
      return { success: false, error: "Finder integration is not available" };
    }
    try {
      return await skyFinder.getSelectedFiles();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  };

  return {
    createFile,
    openFile,
    moveToFolder,
    copyToFolder,
    getSelectedFiles,
    isAvailable: Boolean(skyFinder),
  };
}

