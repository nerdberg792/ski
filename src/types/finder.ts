export interface FinderCreateFileResult {
  success: boolean;
  error?: string;
  filePath?: string;
}

export interface FinderOpenFileResult {
  success: boolean;
  error?: string;
}

export interface FinderMoveFilesResult {
  success: boolean;
  error?: string;
  movedCount?: number;
}

export interface FinderCopyFilesResult {
  success: boolean;
  error?: string;
  copiedCount?: number;
}

export interface FinderGetSelectedFilesResult {
  success: boolean;
  files?: string[];
  error?: string;
}

